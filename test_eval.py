import asyncio
from server.processor import EvaluationProcessor

async def test():
    proc = EvaluationProcessor()
    # create a dummy image (10x10 white pixels)
    import cv2, numpy as np
    img = np.ones((10, 10, 3), dtype=np.uint8) * 255
    ret, buf = cv2.imencode('.jpg', img)
    
    question_key = [{"id": 1, "correct": "A", "marks": 1}]
    try:
        # Assuming the API key is in .env
        res = proc.process_omr(buf.tobytes(), question_key)
        print("Success:", res)
    except Exception as e:
        print("Error:", repr(e))
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
