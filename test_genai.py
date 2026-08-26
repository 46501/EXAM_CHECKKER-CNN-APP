import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv("server/.env")

try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"), transport="rest")
    print("Configure OK")
    
    model = genai.GenerativeModel("models/gemini-3.1-flash-lite-preview")
    res = model.generate_content("Hello", request_options={"timeout": 60})
    print("Response:", res.text)
except Exception as e:
    import traceback
    traceback.print_exc()
