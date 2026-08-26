import os
import cv2
import numpy as np
from server.processor import EvaluationProcessor

def main():
    processor = EvaluationProcessor()
    
    # Generate image
    img = np.zeros((400, 600, 3), dtype=np.uint8)
    cv2.putText(img, "MCQ Sheet", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    _, buf = cv2.imencode('.jpg', img)
    image_bytes = buf.tobytes()
    
    config = [
        {"q": 1, "correct": "A", "marks": 1, "negativeEnabled": False, "negativeValue": 0}
    ]
    
    print("Evaluating MCQ with Gemini...")
    try:
        result = processor.process_omr(image_bytes, config)
        print("Result:", result)
    except Exception as e:
        print("Exception caught:", e)

if __name__ == "__main__":
    main()
