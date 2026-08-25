from fastapi.responses import StreamingResponse, FileResponse
import json
import os
import sys
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Add server directory to path so processor can be imported when running from root
server_dir = os.path.dirname(os.path.abspath(__file__))
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)

from processor import EvaluationProcessor
import uvicorn

app = FastAPI()

# Allow frontend to call the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

processor = EvaluationProcessor()

@app.post("/generate-report")
async def generate_report(data: dict):
    try:
        pdf_buffer = processor.generate_pdf_report(data)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=EvaluationReport.pdf"}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Unable to generate report right now. Please try again later.")

@app.post("/evaluate/master-key")
async def evaluate_master_key(
    file: UploadFile = File(...),
    x_gemini_api_key: str = Header(None)
):
    print(f"[SERVER] Received Master Key Upload: {file.filename}")
    try:
        image_bytes = await file.read()
        print(f"[SERVER] Read {len(image_bytes)} bytes")
        
        detected_key = processor.process_master_key(image_bytes, x_gemini_api_key)
        print(f"[SERVER] Processing complete. Detected {len(detected_key)} questions.")
        
        return {
            "status": "success",
            "detectedKey": detected_key
        }
    except Exception as e:
        import traceback
        print("[CRITICAL] Master Key Processing Failed!")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Unable to process the master key right now. Please try again later.")

@app.post("/evaluate/mcq")
async def evaluate_mcq(
    file: UploadFile = File(...),
    config: str = Form(...),
    x_gemini_api_key: str = Header(None)
):
    try:
        filename = file.filename.encode('ascii', 'ignore').decode() if file.filename else "unknown"
        print(f"[SERVER] Received MCQ Upload: {filename}")
        question_key = json.loads(config)
        image_bytes = await file.read()
        results = processor.process_omr(image_bytes, question_key, x_gemini_api_key)
        return {"status": "success", "results": results}
    except Exception as e:
        import traceback
        try:
            traceback.print_exc()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail="Unable to process your evaluation right now. Please try again later.")

@app.post("/evaluate/theory")
async def evaluate_theory(
    file: UploadFile = File(...),
    context: str = Form(...),
    max_marks: float = Form(...),
    x_gemini_api_key: str = Header(None)
):
    try:
        filename = file.filename.encode('ascii', 'ignore').decode() if file.filename else "unknown"
        print(f"[SERVER] Theory Evaluation Request Received: {filename}")
        image_bytes = await file.read()
        print(f"[SERVER] Read {len(image_bytes)} bytes for theory")
        
        # evaluation now returns parsed dict via processor.clean_json
        result = processor.evaluate_theory(image_bytes, context, max_marks, x_gemini_api_key)
        print(f"[SERVER] Theory Evaluation Complete")
        return result
        
    except Exception as e:
        import traceback
        print("[CRITICAL] Theory Evaluation Failed!")
        try:
            traceback.print_exc()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail="Unable to process your evaluation right now. Please try again later.")

# --- STATIC FILE SERVING (for deployment) ---
# Serve the client folder so frontend and backend run on the same URL
client_dir = Path(__file__).resolve().parent.parent / "client"

@app.get("/")
async def serve_root():
    """Serve the main index.html at the root URL."""
    return FileResponse(str(client_dir / "index.html"))

# Mount static files AFTER all API routes (so API routes take priority)
app.mount("/", StaticFiles(directory=str(client_dir)), name="static")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="debug")
