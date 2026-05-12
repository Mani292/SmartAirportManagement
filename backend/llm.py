import json
import os

from dotenv import load_dotenv
from groq import AsyncGroq

load_dotenv()

_client = None


def get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            # Fallback for testing environment where LLM might not be used but code is imported
            api_key = "mock_key"
        _client = AsyncGroq(api_key=api_key)
    return _client


MODEL = "llama-3.1-8b-instant"


def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent prompt injection."""
    if not isinstance(text, str):
        return ""
    # Block common injection keywords
    blocked = ["system:", "ignore previous", "you are now", "instead of", "forget all"]
    sanitized = text
    for b in blocked:
        sanitized = sanitized.replace(b, "[REDACTED]")
    return sanitized.strip()


async def triage_incident(description, location, area, department):
    prompt = f"""
You are an airport operations AI triage assistant.
Analyze this incident and return ONLY valid JSON, nothing else. No explanation.

Incident: {sanitize_input(description)}
Location: {sanitize_input(location)}
Area: {sanitize_input(area)}
Department: {sanitize_input(department)}

Return this exact JSON:
{{
    "category": "Facilities/IT/Security/Housekeeping/Ground Operations/HR",
    "priority": "1",
    "assigned_team": "TeamName",
    "estimated_fix_mins": 30,
    "safety_risk": false,
    "recommended_action": "first step for technician"
}}

Priority: 1=Critical(safety risk), 2=High(major impact), 3=Medium, 4=Low
Important: "assigned_team" MUST be exactly one of: "Electrical", "Plumbing", "Security", "Facilities", "IT", "HR", "Drone Fleet"
Special Rule: If the incident involves a runway perimeter breach, suspicious package, or external threat, assign it to "Drone Fleet" for immediate automated visual verification.
"""
    client = get_client()
    res = await client.chat.completions.create(
        model=MODEL, messages=[{"role": "user", "content": prompt}], temperature=0.1
    )
    content = res.choices[0].message.content.strip()
    content = content.replace("```json", "").replace("```", "").strip()
    return json.loads(content)


async def chat_with_passenger(message, conversation_history):
    system = """You are a friendly airport assistant helping passengers report facility issues.
Ask for location if not provided.
Ask for description of the issue if not clear.
Once you have location and description, say READY_TO_SUBMIT and summarize the issue clearly.
Keep all responses short, friendly, and helpful.
Do not ask more than one question at a time."""

    messages = [{"role": "system", "content": system}]
    messages.extend(conversation_history)
    messages.append({"role": "user", "content": sanitize_input(message)})

    client = get_client()
    res = await client.chat.completions.create(
        model="llama-3.1-8b-instant", messages=messages, temperature=0.7
    )
    return res.choices[0].message.content


async def get_kb_answer(question, asset, issue):
    prompt = f"""
You are a senior airport facility maintenance expert.
Asset: {sanitize_input(asset)}
Current Issue: {sanitize_input(issue)}
Technician Question: {sanitize_input(question)}

Give numbered step-by-step repair guidance.
Mark any safety warnings with [SAFETY].
Be practical and concise. Maximum 10 steps.
"""
    client = get_client()
    res = await client.chat.completions.create(
        model=MODEL, messages=[{"role": "user", "content": prompt}], temperature=0.3
    )
    return res.choices[0].message.content


async def generate_resolution_summary(description, notes):
    prompt = f"""
Write a short professional resolution summary for this airport maintenance incident.
Original Issue: {sanitize_input(description)}
Resolution Notes: {sanitize_input(notes)}
Keep it under 3 sentences. Professional tone. No fluff.
"""
    client = get_client()
    res = await client.chat.completions.create(
        model=MODEL, messages=[{"role": "user", "content": prompt}], temperature=0.2
    )
    return res.choices[0].message.content
