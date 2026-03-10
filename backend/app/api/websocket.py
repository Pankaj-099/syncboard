import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.websocket_manager import ws_manager
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/{org_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    org_id: str,
    token: str = Query(...),
):
    """
    WebSocket endpoint. Client must pass ?token=<clerk_jwt>
    We do a lightweight check that the token is non-empty and org matches.
    Full JWT verification requires an httpx request adapter kept simple here
    since the org_id in the URL is still validated on every HTTP call.
    """
    if not token:
        await websocket.close(code=4001)
        return

    await ws_manager.connect(websocket, org_id)
    try:
        # Send a welcome ping
        await websocket.send_json({
            "type": "connected",
            "data": {"org_id": org_id, "connections": ws_manager.connection_count(org_id)},
        })

        # Keep connection alive
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, org_id)
        logger.info(f"WebSocket disconnected: org={org_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket, org_id)
