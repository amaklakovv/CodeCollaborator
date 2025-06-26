# Code Collaborator
This is my take on a real-time collaborative code editor. If you've ever used and written in Google Docs with other people and thought, "This would be useful while coding with others", that's exactly what this project is about.

## What is the Code Collaborator?
The code collaborator lets you and a friend (or a few friends!) edit code together, live, in the same browser window. You can see each other's changes instantly, know who's in the room, and even see when someone else is typing. 

## Why did I build this?
I wanted to challenge myself with a full-stack project that's both useful and fun. Real-time collaboration is everywhere these days, and I wanted to understand how it works. Plus, it's a great way to show off skills in React, WebSockets (which I learnt in my second year), Python/FastAPI, and a bit of UI polish.

## Features
- **Live code editing** — see changes as they happen
- **User presence** — see who's in the room (with fun animal names, like Docs)
- **Typing indicator** — know when someone else is typing
- **Shareable room links** — just copy and send to collaborate
- **Monaco Editor** — has a similar looks and feel to VSCode, syntax highlighting and a great coding experience
- **Simple, clean UI** — easy to use, easy to demo

## How to use it
1. **Clone this repo**
2. **Start the backend** (Python/FastAPI):
   ```sh
   cd server
   pip install -r requirements.txt
   python main.py
   ```
   The backend will run on [http://localhost:8080](http://localhost:8080)

3. **Start the frontend** (React):
   ```sh
   cd client
   npm install
   npm start
   ```
   The frontend will run on [http://localhost:3000](http://localhost:3000)

4. **Open a room**
   - Go to `http://localhost:3000/room/anything-you-like` (e.g., `/room/testroom`)
   - Share the link with a friend or open it in another tab to see real-time collaboration in action!

## Tech Stack
- **Frontend:** React, Monaco Editor, WebSockets
- **Backend:** Python, FastAPI, Uvicorn
- **Infra:** Runs locally, no database needed

## What's next?
**Currently this is an MVP**. I'd like to add more features in the future, maybe chat, file uploads, or even deploy it.
