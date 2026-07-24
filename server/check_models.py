import google.generativeai as genai
import os
from dotenv import load_dotenv

# Find .env in the same directory as this file
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("ERROR: GEMINI_API_KEY not found in .env")
else:
    genai.configure(api_key=api_key)
    print("--- Available Models for your API Key ---")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"Name: {m.name} | Display: {m.display_name}")
    except Exception as e:
        print(f"FAILED to list models: {e}")
