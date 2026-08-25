import uuid
from sqlalchemy import Column, String, Float, Integer, JSON
from database import Base

class EvaluationHistory(Base):
    __tablename__ = "evaluations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    
    # Future authentication support
    user_id = Column(String, index=True, nullable=True)
    
    evaluation_type = Column(String, index=True) # 'MCQ', 'Theory', 'Batch'
    student_name = Column(String, nullable=True)
    
    total_marks = Column(Float, nullable=True)
    obtained_marks = Column(Float, nullable=True)
    percentage = Column(Float, nullable=True)
    status = Column(String, nullable=True) # 'Pass', 'Fail'
    
    total_questions = Column(Integer, nullable=True)
    attempted_questions = Column(Integer, nullable=True)
    correct_answers = Column(Integer, nullable=True)
    incorrect_answers = Column(Integer, nullable=True)
    
    evaluation_date = Column(String)
    evaluation_time = Column(String)
    
    # Store the entire original result to avoid reprocessing when viewing
    detailed_result = Column(JSON)
