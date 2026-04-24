from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import llm

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

class KBRequest(BaseModel):
    question: str
    asset: str
    issue: str

class SummaryRequest(BaseModel):
    description: str
    notes: str

@router.post("/chat")
def passenger_chat(req: ChatRequest):
    history = [{"role": m.role, "content": m.content} for m in req.history]
    response = llm.chat_with_passenger(req.message, history)
    return {"response": response}

@router.post("/kb")
def kb_query(req: KBRequest):
    answer = llm.get_kb_answer(req.question, req.asset, req.issue)
    return {"answer": answer}

@router.post("/summarize")
def summarize(req: SummaryRequest):
    summary = llm.generate_resolution_summary(req.description, req.notes)
    return {"summary": summary}