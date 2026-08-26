import os
import cv2
import numpy as np
from server.processor import EvaluationProcessor

def main():
    processor = EvaluationProcessor()
    
    # Generate image
    img = np.zeros((400, 600, 3), dtype=np.uint8)
    cv2.putText(img, "A database is a structured collection of data.", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    cv2.putText(img, "Types: Relational, NoSQL, Hierarchical.", (10, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    _, buf = cv2.imencode('.jpg', img)
    image_bytes = buf.tobytes()
    
    context = "What is a database and what are its types?"
    max_marks = 10
    
    print("Evaluating with Gemini...")
    result = processor.evaluate_theory(image_bytes, context, max_marks)
    print("Result:", result)

    # Test an incorrect answer
    img2 = np.zeros((400, 600, 3), dtype=np.uint8)
    cv2.putText(img2, "A database is a type of dog.", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    _, buf2 = cv2.imencode('.jpg', img2)
    image_bytes2 = buf2.tobytes()
    
    print("\nEvaluating INCORRECT answer with Gemini...")
    result2 = processor.evaluate_theory(image_bytes2, context, max_marks)
    print("Result2:", result2)

if __name__ == "__main__":
    main()
