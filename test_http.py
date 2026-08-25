import requests
import cv2
import numpy as np
import json
import time

def test():
    img = np.ones((10, 10, 3), dtype=np.uint8) * 255
    ret, buf = cv2.imencode('.jpg', img)
    
    files = {'file': ('test.jpg', buf.tobytes(), 'image/jpeg')}
    data = {'config': json.dumps([{"id": 1, "correct": "A", "marks": 1}])}
    
    res = requests.post("http://localhost:8005/evaluate/mcq", files=files, data=data)
    print("Status:", res.status_code)
    print("Response:", res.text)

if __name__ == "__main__":
    test()
