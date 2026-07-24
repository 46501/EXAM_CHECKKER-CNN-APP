import cv2
import numpy as np
import os
import base64
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Find .env in the same directory as this file (for local development)
# On Render, GEMINI_API_KEY is set via the dashboard environment variables
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path, override=False)

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("[WARNING] GEMINI_API_KEY not found. Set it via .env (local) or environment variables (deployed).")
else:
    print(f"[DEBUG] API Key loaded successfully (Starts with: {api_key[:5]}...)")

genai.configure(api_key=api_key)

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from io import BytesIO

class EvaluationProcessor:
    def __init__(self):
        # Using models that ARE available for this API Key
        self.primary_model_name = 'models/gemini-3.1-flash-lite-preview'
        self.fallback_model_name = 'models/gemini-3.1-pro-preview'

    def clean_json(self, text):
        """Extracts JSON content from potentially messy AI output."""
        try:
            text_lower = text.lower()
            if "```json" in text_lower:
                start = text_lower.find("```json") + 7
                end = text.rfind("```")
                text = text[start:end].strip()
            elif "```" in text:
                start = text.find("```") + 3
                end = text.rfind("```")
                text = text[start:end].strip()
            
            return json.loads(text.strip())
        except Exception as e:
            print(f"[ERROR] JSON Cleanup failed: {str(e)}")
            print(f"[DEBUG] Raw AI Output (first 500 chars): {text[:500]}")
            return None

    def generate_pdf_report(self, data):
        """Generates a professional PDF report from the evaluation data."""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        styles = getSampleStyleSheet()
        elements = []

        # Styles
        title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], alignment=1, spaceAfter=20, fontSize=24, textColor=colors.HexColor("#6366f1"))
        header_style = ParagraphStyle('HeaderStyle', parent=styles['Heading2'], fontSize=16, textColor=colors.HexColor("#1e293b"), spaceAfter=12)
        normal_style = styles['Normal']
        
        elements.append(Paragraph("AvalAI - Evaluation Report", title_style))
        elements.append(Spacer(1, 12))

        score = float(data.get('score', 0))
        maxScore = float(data.get('maxScore', 0))
        percentage = (score / maxScore * 100) if maxScore > 0 else 0
        status = "PASSED" if percentage >= 50 else "FAILED"
        status_color = colors.HexColor("#10b981") if status == "PASSED" else colors.HexColor("#f43f5e")

        # Summary Header Table
        meta_data = [
            ["Metric", "Value"],
            ["Evaluation Mode", data.get('mode', 'N/A').upper()],
            ["Total Marks", f"{score} / {maxScore} ({percentage:.1f}%)"],
            ["Final Status", status]
        ]
        
        t = Table(meta_data, colWidths=[150, 200])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#6366f1")),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TEXTCOLOR', (1, 3), (1, 3), status_color),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0"))
        ]))
        elements.append(t)
        elements.append(Spacer(1, 32))

        if data.get('mode') == 'mcq':
            elements.append(Paragraph("MCQ Performance Summary", header_style))
            elements.append(Spacer(1, 6))
            
            summary_highlights = [
                ["Questions Attempted", len(data.get('detailed', []))],
                ["Correct Answers", data.get('correctCount', 0)],
                ["Incorrect Answers", data.get('incorrectCount', 0)],
                ["Total Negative Penalty", f"-{data.get('penalty', 0)}"]
            ]
            st = Table(summary_highlights, colWidths=[150, 150])
            st.setStyle(TableStyle([
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fdfdfd"))
            ]))
            elements.append(st)
            elements.append(Spacer(1, 32))

            elements.append(Paragraph("Question-by-Question Breakdown", header_style))
            elements.append(Spacer(1, 12))
            table_data = [["Question #", "Student Option", "Correct Option", "Result", "Marks Gained"]]
            for res in data.get('detailed', []):
                result_mark = "PASS" if res.get('isCorrect') else "FAIL"
                try:
                    m = res.get('marksGained', 0)
                    marks_str = f"{float(m):.2f}"
                except:
                    marks_str = "0.00"

                table_data.append([
                    str(res.get('q', 'N/A')), 
                    str(res.get('selected') or 'EMPTY'), 
                    str(res.get('correctAnswer', 'N/A')), 
                    result_mark, 
                    marks_str
                ])
            
            bt = Table(table_data, colWidths=[80, 100, 100, 70, 90])
            bt.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e293b")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
            ]))
            elements.append(bt)
        else:
            elements.append(Paragraph("Theory Evaluation Feedback", header_style))
            elements.append(Spacer(1, 12))
            
            elements.append(Paragraph("<b>Student Transcription:</b>", normal_style))
            elements.append(Paragraph(data.get('extractedText', 'No text extracted'), styles['Italic']))
            elements.append(Spacer(1, 12))
            
            feedback = data.get('feedback', {})
            if isinstance(feedback, dict):
                elements.append(Paragraph(f"<b>Strengths Identified:</b> {feedback.get('strengths', 'N/A')}", normal_style))
                elements.append(Spacer(1, 6))
                elements.append(Paragraph(f"<b>Deduction Rationale:</b> {feedback.get('deductions', 'N/A')}", normal_style))
                elements.append(Spacer(1, 6))
                elements.append(Paragraph(f"<b>Suggested Improvements:</b> {feedback.get('improvements', 'N/A')}", normal_style))
            else:
                elements.append(Paragraph(str(feedback), normal_style))

        # Footer
        footer_style = ParagraphStyle('FooterStyle', parent=styles['Italic'], fontSize=8, textColor=colors.grey, alignment=1)
        elements.append(Spacer(1, 48))
        elements.append(Paragraph("This is an AI-generated academic evaluation by EvalAI. Results should be verified by an instructor.", footer_style))
        
        try:
            doc.build(elements)
        except Exception as e:
            print(f"[CRITICAL] PDF Build Error: {e}")
            raise e
            
        buffer.seek(0)
        return buffer

    def order_points(self, pts):
        rect = np.zeros((4, 2), dtype="float32")
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]; rect[2] = pts[np.argmax(s)]
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]; rect[3] = pts[np.argmax(diff)]
        return rect

    def four_point_transform(self, image, pts):
        rect = self.order_points(pts)
        (tl, tr, br, bl) = rect
        wA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
        wB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
        maxWidth = max(int(wA), int(wB))
        hA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
        hB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
        maxHeight = max(int(hA), int(hB))
        dst = np.array([[0, 0],[maxWidth - 1, 0],[maxWidth - 1, maxHeight - 1],[0, maxHeight - 1]], dtype="float32")
        M = cv2.getPerspectiveTransform(rect, dst)
        return cv2.warpPerspective(image, M, (maxWidth, maxHeight))

    def detect_and_warp(self, img):
        try:
            if img is None: return img
            h, w = img.shape[:2]
            # Bypass dangerous four-point cropping entirely. Native AI vision is vastly superior.
            # Only apply quota-safe scaling to preserve crisp bubble fidelity up to 2400px max.
            if max(h, w) > 2400:
                scale = 2400 / max(h, w)
                return cv2.resize(img, (int(w * scale), int(h * scale)))
            return img
        except Exception: 
            return img

    def call_gemini(self, prompt, mime, img_base64, override_key=None):
        """Helper to call Gemini with specific models. Uses override_key if provided."""
        
        # Configure API Key for THIS request
        current_api_key = override_key if override_key else os.getenv("GEMINI_API_KEY")
        if not current_api_key:
            raise Exception("No Gemini API Key provided. Set one in Settings.")
            
        genai.configure(api_key=current_api_key)
        
        models_to_try = [self.primary_model_name, self.fallback_model_name, 'models/gemini-3.1-flash-lite-preview']
        last_error = None
        for model_name in models_to_try:
            try:
                print(f"[DEBUG] Attempting AI evaluation with {model_name}...")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content([prompt, {"mime_type": mime, "data": img_base64}])
                return response.text
            except Exception as e:
                last_error = e
                print(f"[RECOVERY] Model {model_name} failed: {str(e)}")
        
        # Re-raise standard exception if all models fail
        raise last_error

    def process_master_key(self, image_bytes, api_key=None):
        nparr = np.frombuffer(image_bytes, np.uint8); img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None: return []
        img = self.detect_and_warp(img); ext = ".jpg" if img.shape[2] == 3 else ".png"; mime = "image/jpeg" if ext == ".jpg" else "image/png"
        _, buf = cv2.imencode(ext, img); img_b64 = base64.b64encode(buf).decode("utf-8")
        prompt = """Analyze master OMR. Return ONLY JSON array: [{"id": 1, "correct": "A", "marks": 1, "negativeEnabled": true, "negativeValue": 0.25}, ...]"""
        try:
            response_text = self.call_gemini(prompt, mime, img_b64, override_key=api_key)
            return self.clean_json(response_text) or []
        except Exception as e:
            print(f"[CRITICAL] Master Key AI failed: {e}"); return []

    def process_omr(self, image_bytes, question_key, api_key=None):
        """High-precision OMR detection using Gemini 2.0 Flash with structural reasoning."""
        nparr = np.frombuffer(image_bytes, np.uint8); img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None: return []
        
        img = self.detect_and_warp(img)
        ext = ".jpg" if img.shape[2] == 3 else ".png"
        mime = "image/jpeg" if ext == ".jpg" else "image/png"
        _, buf = cv2.imencode(ext, img)
        img_b64 = base64.b64encode(buf).decode("utf-8")
        
        prompt = f"""
        Objective: Highest Precision OMR Grading.
        Answer Key Data (TOTAL QUESTIONS TO EVALUATE): {json.dumps(question_key)}
        
        Instructions for AI Examiner:
        1. YOU MUST evaluate EVERY SINGLE question listed in the Answer Key Data. DO NOT skip any questions.
        2. Specifically look for a DARKLY FILLED circle or marked option (A, B, C, D, E) for each row.
        3. If a row is entirely blank or illegible: "selected": null.
        4. If a row has multiple marks: "selected": "MULTIPLE".
        5. Compare the student's selection against the Answer Key Data to determine 'isCorrect'.
        
        Return ONLY a valid JSON array containing EXACTLY {len(question_key)} objects: 
        [
            {{"q": 1, "selected": "A", "isCorrect": true, "confidence": 0.98}},
            ...
        ]
        """
        try:
            response_text = self.call_gemini(prompt, mime, img_b64, override_key=api_key)
            result = self.clean_json(response_text)
            if not result:
                raise ValueError("AI returned invalid JSON or unrecognized format")
            return result
        except Exception as e:
            print(f"[CRITICAL] OMR AI Detection failed: {e}")
            raise Exception(f"OMR failed: {str(e)}")

    def evaluate_theory(self, image_bytes, context, max_marks, api_key=None):
        nparr = np.frombuffer(image_bytes, np.uint8); img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None: return {}
        img = self.detect_and_warp(img); ext = ".jpg" if img.shape[2] == 3 else ".png"; mime = "image/jpeg" if ext == ".jpg" else "image/png"
        _, buf = cv2.imencode(ext, img); img_b64 = base64.b64encode(buf).decode("utf-8")
        
        prompt = f"""
        Role: Expert Academic Examiner.
        Question Context: {context}

        Analyze the handwriting and content. Return ONLY JSON with this EXACT structure:
        {{
            "score": <0-{max_marks}>,
            "maxScore": {max_marks},
            "feedback": {{
                "strengths": "<brief positive points>",
                "deductions": "<specifically why marks were lost>",
                "improvements": "<one actionable tip for next time>"
            }},
            "extractedText": "<exact transcription>"
        }}
        """
        try:
            response_text = self.call_gemini(prompt, mime, img_b64, override_key=api_key)
            return self.clean_json(response_text) or {}
        except Exception as e:
            print(f"[CRITICAL] Theory AI failed: {e}"); return {}
