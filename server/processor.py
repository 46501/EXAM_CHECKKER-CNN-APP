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

from reportlab.lib.pagesizes import letter, A4
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
        # Adjusted margins to fit more content and look balanced on A4
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        styles = getSampleStyleSheet()
        elements = []

        # Color Palette - Scorify Branding
        brand_color = colors.HexColor("#6366f1")
        brand_dark = colors.HexColor("#4f46e5")
        text_dark = colors.HexColor("#1e293b")
        text_muted = colors.HexColor("#64748b")
        border_color = colors.HexColor("#e2e8f0")
        bg_light = colors.HexColor("#f8fafc")
        pass_color = colors.HexColor("#10b981")
        fail_color = colors.HexColor("#ef4444")

        # Typography
        title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], alignment=1, spaceAfter=4, fontSize=24, textColor=brand_color, fontName='Helvetica-Bold')
        subtitle_style = ParagraphStyle('SubTitleStyle', parent=styles['Normal'], alignment=1, spaceAfter=20, fontSize=11, textColor=text_muted)
        
        section_title_style = ParagraphStyle('SectionTitleStyle', parent=styles['Heading2'], fontSize=14, textColor=brand_dark, spaceAfter=10, fontName='Helvetica-Bold', borderPadding=0)
        
        normal_style = ParagraphStyle('NormalStyle', parent=styles['Normal'], fontSize=10, textColor=text_dark, spaceAfter=6, leading=14)
        center_style = ParagraphStyle('CenterStyle', parent=normal_style, alignment=1)
        
        # Header
        elements.append(Paragraph("Scorify Evaluation Report", title_style))
        elements.append(Paragraph("Automated Assessment & AI Grading", subtitle_style))
        
        # Compute summary metrics
        score = float(data.get('score', 0))
        maxScore = float(data.get('maxScore', 0))
        percentage = (score / maxScore * 100) if maxScore > 0 else 0
        status = "PASSED" if percentage >= 50 else "FAILED"
        status_color = pass_color if status == "PASSED" else fail_color

        # 1. SUMMARY CARD
        elements.append(Paragraph("Summary Overview", section_title_style))
        
        summary_data = [
            [
                Paragraph("<b>Evaluation Mode</b>", center_style), 
                Paragraph("<b>Total Score</b>", center_style), 
                Paragraph("<b>Percentage</b>", center_style), 
                Paragraph("<b>Final Status</b>", center_style)
            ],
            [
                Paragraph(f"{data.get('mode', 'N/A').upper()}", center_style),
                Paragraph(f"{score:.1f} / {maxScore:.1f}", center_style),
                Paragraph(f"{percentage:.1f}%", center_style),
                Paragraph(f"<font color='{status_color.hexval()}'><b>{status}</b></font>", center_style)
            ]
        ]
        
        # Card style table spanning full width
        summary_table = Table(summary_data, colWidths=[128, 128, 128, 128])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), bg_light),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LINEBELOW', (0, 0), (-1, 0), 1, border_color),
            ('BOX', (0, 0), (-1, -1), 1, border_color),
        ]))
        
        elements.append(summary_table)
        elements.append(Spacer(1, 15))

        if data.get('mode') == 'mcq':
            # MCQ Performance Stats
            elements.append(Paragraph("Performance Metrics", section_title_style))
            
            stats_data = [
                [Paragraph("<b>Questions Attempted</b>", normal_style), str(len(data.get('detailed', [])))],
                [Paragraph("<b>Correct Answers</b>", normal_style), str(data.get('correctCount', 0))],
                [Paragraph("<b>Incorrect Answers</b>", normal_style), str(data.get('incorrectCount', 0))],
                [Paragraph("<b>Negative Penalty</b>", normal_style), f"-{data.get('penalty', 0)}"]
            ]
            stats_table = Table(stats_data, colWidths=[256, 256])
            stats_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('LINEBELOW', (0, 0), (-1, -2), 0.5, border_color),
                ('BOX', (0, 0), (-1, -1), 1, border_color),
                ('BACKGROUND', (0, 0), (-1, -1), colors.white),
            ]))
            elements.append(stats_table)
            elements.append(Spacer(1, 15))

            # Q-by-Q Breakdown
            elements.append(Paragraph("Question-by-Question Breakdown", section_title_style))
            
            table_data = [["Q #", "Student Option", "Correct Option", "Result", "Marks Gained"]]
            
            for res in data.get('detailed', []):
                is_correct = res.get('isCorrect')
                result_mark = "PASS" if is_correct else "FAIL"
                res_color = pass_color if is_correct else fail_color
                
                try:
                    m = res.get('marksGained', 0)
                    marks_str = f"{float(m):.2f}"
                except:
                    marks_str = "0.00"

                table_data.append([
                    str(res.get('q', 'N/A')), 
                    str(res.get('selected') or '-'), 
                    str(res.get('correctAnswer', 'N/A')), 
                    Paragraph(f"<font color='{res_color.hexval()}'><b>{result_mark}</b></font>", center_style),
                    marks_str
                ])
                
            # Full width is 515.2 (A4 width 595.2 - 80 margins)
            bt = Table(table_data, colWidths=[50, 120, 120, 120, 105], repeatRows=1)
            bt.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), brand_color),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 0.5, border_color),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, bg_light])
            ]))
            elements.append(bt)
            
        else:
            # Theory Feedback
            elements.append(Paragraph("Theory Evaluation Feedback", section_title_style))
            
            # Card for Student Transcription
            elements.append(Paragraph("<b>Student Transcription:</b>", normal_style))
            transcription = data.get('extractedText', 'No text extracted')
            trans_table = Table([[Paragraph(f"<i>{transcription}</i>", normal_style)]], colWidths=[515])
            trans_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), bg_light),
                ('BOX', (0,0), (-1,-1), 1, border_color),
                ('TOPPADDING', (0,0), (-1,-1), 10),
                ('BOTTOMPADDING', (0,0), (-1,-1), 10),
                ('LEFTPADDING', (0,0), (-1,-1), 12),
                ('RIGHTPADDING', (0,0), (-1,-1), 12)
            ]))
            elements.append(trans_table)
            elements.append(Spacer(1, 15))
            
            feedback = data.get('feedback', {})
            elements.append(Paragraph("<b>AI Feedback & Suggestions:</b>", normal_style))
            
            if isinstance(feedback, dict):
                fb_text = feedback.get('feedback', 'No feedback provided.')
                
                # Card for Feedback
                fb_table = Table([[Paragraph(fb_text, normal_style)]], colWidths=[515])
                fb_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.white),
                    ('BOX', (0,0), (-1,-1), 1, border_color),
                    ('TOPPADDING', (0,0), (-1,-1), 10),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 10),
                    ('LEFTPADDING', (0,0), (-1,-1), 12),
                    ('RIGHTPADDING', (0,0), (-1,-1), 12)
                ]))
                elements.append(fb_table)
                elements.append(Spacer(1, 15))
                
                improvements = feedback.get('improvements', [])
                if improvements:
                    elements.append(Paragraph("<b>Actionable Improvements:</b>", normal_style))
                    imp_data = [[Paragraph(f"<bullet>•</bullet> {imp}", normal_style)] for imp in improvements]
                    imp_table = Table(imp_data, colWidths=[515])
                    imp_table.setStyle(TableStyle([
                        ('BACKGROUND', (0,0), (-1,-1), colors.white),
                        ('BOX', (0,0), (-1,-1), 1, border_color),
                        ('LINEBELOW', (0,0), (-1,-2), 0.5, border_color),
                        ('TOPPADDING', (0,0), (-1,-1), 8),
                        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                        ('LEFTPADDING', (0,0), (-1,-1), 12),
                        ('RIGHTPADDING', (0,0), (-1,-1), 12)
                    ]))
                    elements.append(imp_table)
            else:
                elements.append(Paragraph(str(feedback), normal_style))
                
        # Footer
        footer_style = ParagraphStyle('FooterStyle', parent=styles['Italic'], fontSize=8, textColor=colors.grey, alignment=1)
        elements.append(Spacer(1, 48))
        elements.append(Paragraph("This is an AI-generated academic evaluation by Scorify. Results should be verified by an instructor.", footer_style))
        
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
            # Reduce resolution to prevent TCP timeout errors on large images
            max_dim = 1200
            if max(h, w) > max_dim:
                scale = max_dim / max(h, w)
                return cv2.resize(img, (int(w * scale), int(h * scale)))
            return img
        except Exception: 
            return img

    def call_gemini(self, prompt, mime, img_base64, override_key=None):
        """Helper to call Gemini with specific models. Uses override_key if provided."""
        
        print("[STAGE: call_gemini] Configuring API key...")
        # Configure API Key and force REST transport to avoid gRPC proxy drops
        if override_key in ["null", "undefined", "", None, "null", "undefined"]:
            current_api_key = os.getenv("GEMINI_API_KEY")
        else:
            current_api_key = override_key
            
        if not current_api_key:
            raise ValueError("No Gemini API Key provided. Please set your API Key in the Settings panel.")
            
        genai.configure(api_key=current_api_key, transport="rest")
        
        models_to_try = [self.primary_model_name, self.fallback_model_name, 'models/gemini-3.1-flash-lite-preview']
        last_error = None
        import time
        import random
        
        for model_name in models_to_try:
            for attempt in range(3): # Try each model up to 3 times to handle network flakiness
                try:
                    print(f"[STAGE: call_gemini] Attempting generation with {model_name} (Attempt {attempt + 1})...")
                    model = genai.GenerativeModel(model_name)
                    # Explicit timeout of 60 seconds
                    response = model.generate_content(
                        [prompt, {"mime_type": mime, "data": img_base64}],
                        request_options={"timeout": 60}
                    )
                    print(f"[STAGE: call_gemini] Generation successful!")
                    return response.text
                except Exception as e:
                    last_error = e
                    print(f"[STAGE ERROR: call_gemini] Model {model_name} (Attempt {attempt + 1}) failed: {str(e)}")
                    # Exponential backoff with jitter
                    sleep_time = (2 ** attempt) + random.uniform(0, 1)
                    time.sleep(sleep_time)
        
        print("[STAGE ERROR: call_gemini] All models failed.")
        # Re-raise standard exception if all models fail
        if last_error is not None:
            raise last_error
        raise Exception("All models failed and no exceptions were caught.")

    def process_master_key(self, image_bytes, api_key=None):
        nparr = np.frombuffer(image_bytes, np.uint8); img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None: return []
        img = self.detect_and_warp(img)
        ext = ".jpg" if img.shape[2] == 3 else ".png"
        mime = "image/jpeg" if ext == ".jpg" else "image/png"
        
        if ext == ".jpg":
            _, buf = cv2.imencode('.jpg', img, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        else:
            _, buf = cv2.imencode(ext, img)
            
        img_b64 = base64.b64encode(buf).decode("utf-8")
        prompt = """Analyze master OMR. Return ONLY JSON array: [{"id": 1, "correct": "A", "marks": 1, "negativeEnabled": true, "negativeValue": 0.25}, ...]"""
        try:
            response_text = self.call_gemini(prompt, mime, img_b64, override_key=api_key)
            return self.clean_json(response_text) or []
        except Exception as e:
            print(f"[CRITICAL] Master Key AI failed: {e}"); return []

    def process_omr(self, image_bytes, question_key, api_key=None):
        """High-precision OMR detection using Gemini 2.0 Flash with structural reasoning."""
        print("[STAGE: process_omr] Starting OMR processing...")
        
        print("[STAGE: process_omr] Decoding image bytes...")
        nparr = np.frombuffer(image_bytes, np.uint8); img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None: 
            print("[STAGE ERROR: process_omr] cv2.imdecode failed.")
            raise ValueError("Invalid or corrupted image file uploaded. Please capture or upload a clear OMR image.")
        
        print("[STAGE: process_omr] Running detect_and_warp...")
        img = self.detect_and_warp(img)
        ext = ".jpg" if img.shape[2] == 3 else ".png"
        mime = "image/jpeg" if ext == ".jpg" else "image/png"
        
        print(f"[STAGE: process_omr] Encoding image to {ext} (Quality=80)...")
        # Apply JPEG compression to drastically reduce base64 size and prevent network timeouts
        if ext == ".jpg":
            _, buf = cv2.imencode('.jpg', img, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        else:
            _, buf = cv2.imencode(ext, img)
            
        print("[STAGE: process_omr] Converting to base64...")
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
        try:
            print("[STAGE: process_omr] Calling Gemini API...")
            response_text = self.call_gemini(prompt, mime, img_b64, override_key=api_key)
            
            print("[STAGE: process_omr] Cleaning JSON response...")
            result = self.clean_json(response_text)
            
            if not result:
                print("[STAGE ERROR: process_omr] JSON cleaning returned None")
                raise ValueError("The AI could not read this OMR sheet or returned an invalid format. Please ensure the image is clear and try again.")
                
            print("[STAGE: process_omr] OMR processing successfully returning result.")
            return result
        except Exception as e:
            print(f"[STAGE ERROR: process_omr] OMR Evaluation failed: {str(e)}")
            raise Exception(f"OMR failed: {str(e)}")

    def evaluate_theory(self, image_bytes, context, max_marks, api_key=None):
        nparr = np.frombuffer(image_bytes, np.uint8); img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None: return {}
        img = self.detect_and_warp(img)
        ext = ".jpg" if img.shape[2] == 3 else ".png"
        mime = "image/jpeg" if ext == ".jpg" else "image/png"
        
        if ext == ".jpg":
            _, buf = cv2.imencode('.jpg', img, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        else:
            _, buf = cv2.imencode(ext, img)
            
        img_b64 = base64.b64encode(buf).decode("utf-8")
        
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
