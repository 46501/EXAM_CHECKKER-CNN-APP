import asyncio
import os
import requests
import json
import numpy as np
import cv2

url = "http://localhost:8007/evaluate/mcq"
# Create a dummy image for MCQ
img = np.zeros((400, 400, 3), dtype=np.uint8)
cv2.circle(img, (100, 100), 10, (255, 255, 255), -1) # Mock filled bubble
cv2.imwrite("test_mcq.jpg", img)

config = [
    {"q": 1, "correct": "A", "marks": 1, "negativeEnabled": False, "negativeValue": 0}
]

with open("test_mcq.jpg", "rb") as f:
    files = {"file": f}
    data = {
        "config": json.dumps(config)
    }
    print("Sending request...")
    try:
        response = requests.post(url, files=files, data=data)
        print("Status:", response.status_code)
        try:
            print("Response:", response.json())
        except:
            print("Response Text:", response.text)
    except Exception as e:
        print("Request failed:", e)
