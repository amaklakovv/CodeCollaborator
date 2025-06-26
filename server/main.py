from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import uvicorn
from typing import Dict, Set
import asyncio
import random

app = FastAPI()

# In-memory room state: room_id -> { 'code': str, 'connections': set of WebSocket, 'users': dict of ws:username }
rooms: Dict[str, Dict] = {}
rooms_lock = asyncio.Lock()

# Fun animal names for user presence
USER_NAMES = [
    "Red Panda", "Blue Whale", "Green Turtle", "Yellow Canary", "Purple Finch",
    "Orange Fox", "Silver Wolf", "Golden Eagle", "Pink Dolphin", "Brown Bear"
]

def get_random_username(used_names):
    """
    Pick a random username that isn't already taken in the room.
    If all are taken, generate a generic User#### name.
    """
    available = [name for name in USER_NAMES if name not in used_names]
    if available:
        return random.choice(available)
    return f"User{random.randint(1000,9999)}"

@app.get("/")
def read_root():
    # Simple health check endpoint
    return {"message": "CollabCode Python Server Running!"}

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    # Accept the WebSocket connection
    await websocket.accept()
    print(f"WebSocket connection accepted for room: {room_id}")
    async with rooms_lock:
        # Create the room if it doesn't exist
        if room_id not in rooms:
            rooms[room_id] = {"code": "", "connections": set(), "users": {}}
        # Assign a unique username for this connection
        used_names = set(rooms[room_id]["users"].values())
        username = get_random_username(used_names)
        rooms[room_id]["connections"].add(websocket)
        rooms[room_id]["users"][websocket] = username
        code = rooms[room_id]["code"]
        user_list = list(rooms[room_id]["users"].values())
    # Send the current code and user list to the new user
    try:
        await websocket.send_json({"type": "init", "code": code, "users": user_list, "yourName": username})
    except Exception as e:
        print(f"Error sending init message: {e}")
    # Notify all users in the room about the updated user list
    await broadcast_user_list(room_id)
    try:
        while True:
            try:
                # Wait for a message from the client
                data = await websocket.receive_json()
            except Exception as e:
                print(f"Error receiving JSON: {e}")
                break
            # Handle code edit events
            if data.get("type") == "edit":
                async with rooms_lock:
                    code = data.get("text", "")  # For MVP, just set the full code
                    rooms[room_id]["code"] = code
                    # Broadcast the new code to all other users in the room
                    for conn in rooms[room_id]["connections"]:
                        if conn != websocket:
                            try:
                                await conn.send_json({"type": "edit", "code": code, "from": username})
                            except Exception as e:
                                print(f"Error broadcasting to client: {e}")
            # Handle typing indicator events
            elif data.get("type") == "typing":
                # Broadcast typing indicator to all except sender
                async with rooms_lock:
                    for conn in rooms[room_id]["connections"]:
                        if conn != websocket:
                            try:
                                await conn.send_json({"type": "typing", "from": username})
                            except Exception as e:
                                print(f"Error broadcasting typing: {e}")
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for room: {room_id}")
    finally:
        async with rooms_lock:
            # Remove the user from the room
            rooms[room_id]["connections"].discard(websocket)
            if websocket in rooms[room_id]["users"]:
                del rooms[room_id]["users"][websocket]
            # Clean up the room if empty
            if not rooms[room_id]["connections"]:
                del rooms[room_id]
            else:
                # Notify remaining users about the updated user list
                await broadcast_user_list(room_id)

def get_user_list(room_id):
    """Return the list of usernames in the room."""
    return list(rooms[room_id]["users"].values())

async def broadcast_user_list(room_id):
    """
    Send the updated user list to all clients in the room.
    """
    user_list = get_user_list(room_id)
    for conn in rooms[room_id]["connections"]:
        try:
            await conn.send_json({"type": "users", "users": user_list})
        except Exception as e:
            print(f"Error broadcasting user list: {e}")

if __name__ == "__main__":
    # Start the FastAPI server with Uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True) 