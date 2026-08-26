import asyncio
import os
import requests

url = "http://localhost:8005/evaluate/theory"
# Create a dummy image for theory
import numpy as np
import cv2
img = np.zeros((200, 400, 3), dtype=np.uint8)
cv2.putText(img, "A database is a structured collection of data.", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
cv2.putText(img, "Types: Relational, NoSQL, Hierarchical.", (10, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
cv2.imwrite("test_theory_answer.jpg", img)

with open("test_theory_answer.jpg", "rb") as f:
    files = {"file": f}
    data = {
        "context": "What is a database and what are its types?",
        "max_marks": 10
    }
    print("Sending request...")
    response = requests.post(url, files=files, data=data)
    print("Status:", response.status_code)
    try:
        print("Response:", response.json())
    except:
        print("Response Text:", response.text)
