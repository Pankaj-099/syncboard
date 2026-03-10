
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # org_id -> list of active WebSocket connections
        self._connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, org_id: str):
        await websocket.accept()
        if org_id not in self._connections:
            self._connections[org_id] = []
        self._connections[org_id].append(websocket)
        logger.info(f"WS connected: org={org_id}, total={len(self._connections[org_id])}")

    def disconnect(self, websocket: WebSocket, org_id: str):
        if org_id in self._connections:
            self._connections[org_id] = [
                ws for ws in self._connections[org_id] if ws != websocket
            ]
            if not self._connections[org_id]:
                del self._connections[org_id]
        logger.info(f"WS disconnected: org={org_id}")

    async def broadcast_to_org(self, org_id: str, event: dict):

        if org_id not in self._connections:
            return

        payload = json.dumps(event, default=str)
        dead: List[WebSocket] = []

        for ws in self._connections[org_id]:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)

        for ws in dead:
            self.disconnect(ws, org_id)

    def connection_count(self, org_id: str) -> int:
        return len(self._connections.get(org_id, []))


# Singleton
ws_manager = ConnectionManager()


def build_event(event_type: str, data: dict, user_name: str = "") -> dict:
    return {
        "type": event_type,
        "data": data,
        "user_name": user_name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
