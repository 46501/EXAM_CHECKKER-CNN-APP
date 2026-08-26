from fastapi.responses import StreamingResponse, FileResponse
import json
import os
import sys
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Depends
from sqlalchemy.orm import Session

# Add server directory to path so modules can be imported when running from root (e.g. Render)
server_dir = os.path.dirname(os.path.abspath(__file__))
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)

from database import engine, get_db
import models

# Create database tables
models.Base.metadata.create_all(bind=engine)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


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
        print(f"[STAGE] Received MCQ Upload: {filename}")
        
        print("[STAGE] Parsing config JSON...")
        question_key = json.loads(config)
        
        print("[STAGE] Reading image bytes...")
        image_bytes = await file.read()
        
        print("[STAGE] Calling processor.process_omr...")
        results = processor.process_omr(image_bytes, question_key, x_gemini_api_key)
        
        print("[STAGE] MCQ Evaluation successful, returning 200 OK")
        return {"status": "success", "results": results}
    except ValueError as ve:
        print(f"[STAGE ERROR] User/Validation error: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print("[STAGE ERROR] Unhandled exception in evaluate_mcq")
        import traceback
        try:
            traceback.print_exc()
            with open("debug_error.log", "w") as f:
                f.write(f"Exception: {str(e)}\n")
                f.write(traceback.format_exc())
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

# --- DATABASE API ENDPOINTS ---
@app.post("/api/evaluations")
async def save_evaluation(data: dict, db: Session = Depends(get_db)):
    try:
        new_eval = models.EvaluationHistory(
            evaluation_type=data.get("evaluation_type"),
            student_name=data.get("student_name"),
            total_marks=data.get("total_marks"),
            obtained_marks=data.get("obtained_marks"),
            percentage=data.get("percentage"),
            status=data.get("status"),
            total_questions=data.get("total_questions"),
            attempted_questions=data.get("attempted_questions"),
            correct_answers=data.get("correct_answers"),
            incorrect_answers=data.get("incorrect_answers"),
            evaluation_date=data.get("evaluation_date"),
            evaluation_time=data.get("evaluation_time"),
            detailed_result=data.get("detailed_result")
        )
        db.add(new_eval)
        db.commit()
        db.refresh(new_eval)
        return {"status": "success", "id": new_eval.id}
    except Exception as e:
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to save evaluation history.")

@app.get("/api/evaluations")
async def get_evaluations(db: Session = Depends(get_db)):
    try:
        # For now, return all evaluations. Later, filter by user_id
        evals = db.query(models.EvaluationHistory).order_by(models.EvaluationHistory.evaluation_date.desc(), models.EvaluationHistory.evaluation_time.desc()).all()
        return {"status": "success", "evaluations": [
            {
                "id": e.id,
                "evaluation_type": e.evaluation_type,
                "student_name": e.student_name,
                "total_marks": e.total_marks,
                "obtained_marks": e.obtained_marks,
                "percentage": e.percentage,
                "status": e.status,
                "evaluation_date": e.evaluation_date,
                "evaluation_time": e.evaluation_time
            } for e in evals
        ]}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Unable to load evaluation history. Please try again.")

@app.get("/api/evaluations/{eval_id}")
async def get_evaluation(eval_id: str, db: Session = Depends(get_db)):
    try:
        e = db.query(models.EvaluationHistory).filter(models.EvaluationHistory.id == eval_id).first()
        if not e:
            raise HTTPException(status_code=404, detail="Evaluation not found.")
        return {"status": "success", "evaluation": {
            "id": e.id,
            "evaluation_type": e.evaluation_type,
            "student_name": e.student_name,
            "detailed_result": e.detailed_result
        }}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Unable to load evaluation details. Please try again.")

@app.delete("/api/evaluations/{eval_id}")
async def delete_evaluation(eval_id: str, db: Session = Depends(get_db)):
    try:
        e = db.query(models.EvaluationHistory).filter(models.EvaluationHistory.id == eval_id).first()
        if not e:
            raise HTTPException(status_code=404, detail="Evaluation not found.")
        db.delete(e)
        db.commit()
        return {"status": "success", "message": "Evaluation deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to delete evaluation. Please try again.")

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
