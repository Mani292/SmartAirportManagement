from typing import List

import llm
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from logger.audit import log_audit
from routers.auth import get_current_user

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
async def passenger_chat(req: ChatRequest, user: dict = Depends(get_current_user)):
    history = [{"role": m.role, "content": m.content} for m in req.history]
    response = await llm.chat_with_passenger(req.message, history)
    return {"response": response}


@router.post("/kb")
async def kb_query(req: KBRequest, user: dict = Depends(get_current_user)):
    answer = await llm.get_kb_answer(req.question, req.asset, req.issue)
    log_audit("TECH", "KB_QUERY", f"Asset: {req.asset}")
    return {"answer": answer}


@router.post("/summarize")
async def summarize(req: SummaryRequest, user: dict = Depends(get_current_user)):
    summary = await llm.generate_resolution_summary(req.description, req.notes)
    return {"summary": summary}
