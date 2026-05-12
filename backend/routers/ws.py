import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"[WS] Broadcast error: {e}")

manager = ConnectionManager()

@router.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    """
    Real-time WebSocket endpoint for the Enterprise Dashboard.
    Streams incident updates and critical IoT telemetry.
    """
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # We can process incoming WS messages if needed
            # For now, just echo or handle ping
            if data.lower() == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Helper function to broadcast events from other routers
async def broadcast_event(event_type: str, payload: dict):
    await manager.broadcast({
        "type": event_type,
        "data": payload
    })
