import React, { useRef, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';

const WS_URL = 'ws://localhost:8080/ws';

function CodeEditorPage() {
  // Get the roomId from the URL
  const { roomId } = useParams();
  // State for the code in the editor
  const [code, setCode] = useState('');
  // State for the list of connected users
  const [users, setUsers] = useState([]);
  // Your assigned username
  const [yourName, setYourName] = useState('');
  // Name of the user currently typing (for typing indicator)
  const [typingUser, setTypingUser] = useState('');
  // WebSocket reference
  const ws = useRef(null);
  // Used to prevent feedback loop when updating code from remote edits
  const isRemoteUpdate = useRef(false);
  // Timeout for clearing the typing indicator
  const typingTimeout = useRef(null);

  // Set up the WebSocket connection and event handlers
  useEffect(() => {
    ws.current = new window.WebSocket(`${WS_URL}/${roomId}`);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'init') {
          // Initial state: set code, users, and your name
          isRemoteUpdate.current = true;
          setCode(msg.code);
          setUsers(msg.users || []);
          setYourName(msg.yourName || '');
        } else if (msg.type === 'edit') {
          // Another user made an edit: update the code
          isRemoteUpdate.current = true;
          setCode(msg.code);
        } else if (msg.type === 'users') {
          // Update the list of connected users
          setUsers(msg.users || []);
        } else if (msg.type === 'typing') {
          // Show typing indicator for the user who is typing
          setTypingUser(msg.from);
          if (typingTimeout.current) clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => setTypingUser(''), 1200);
        } else {
          console.warn('Unknown message type:', msg);
        }
      } catch (e) {
        console.error('Failed to parse message:', event.data, e);
      }
    };

    ws.current.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket disconnected', event);
    };

    // Clean up on unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [roomId]);

  // Handle code changes in the editor
  const handleEditorChange = (value) => {
    // If this is a remote update, don't send it back to the server
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      setCode(value);
      return;
    }
    setCode(value);
    // Send the new code to the backend and notify others you're typing
    if (ws.current && ws.current.readyState === 1) {
      try {
        ws.current.send(
          JSON.stringify({
            type: 'edit',
            op: 'insert',
            position: 0,
            text: value,
          })
        );
        // Send typing event
        ws.current.send(
          JSON.stringify({
            type: 'typing',
          })
        );
      } catch (e) {
        console.error('Failed to send message:', e);
      }
    }
  };

  // Copy the current room link to the clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Room link copied to clipboard!');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#181c20', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Header with app name and room info */}
      <header style={{ background: '#23272f', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 'bold', fontSize: 22 }}>CollabCode</div>
        <div>
          <span style={{ marginRight: 16 }}>Room: <b>{roomId}</b></span>
          <button onClick={handleCopyLink} style={{ padding: '0.4em 1em', borderRadius: 6, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer' }}>Copy Room Link</button>
        </div>
      </header>

      {/* User presence and typing indicator */}
      <div style={{ background: '#23272f', padding: '0.5rem 1rem', fontSize: 15, display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: 12 }}>Connected:</span>
        {users.map((u) => (
          <span key={u} style={{ marginRight: 10, fontWeight: u === yourName ? 'bold' : 'normal', color: u === yourName ? '#3b82f6' : '#fff' }}>{u}{u === yourName ? ' (You)' : ''}</span>
        ))}
        {typingUser && typingUser !== yourName && (
          <span style={{ marginLeft: 20, color: '#facc15' }}>{typingUser} is typing...</span>
        )}
      </div>

      {/* Monaco code editor */}
      <div style={{ flex: 1 }}>
        <MonacoEditor
          height="75vh"
          language="javascript"
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{ fontSize: 16 }}
        />
      </div>

      {/* Footer with a little branding */}
      <footer style={{ background: '#23272f', padding: '0.7rem', textAlign: 'center', fontSize: 14, color: '#aaa' }}>
        Andrew Maklakov - CollabCode &copy; {new Date().getFullYear()}; Real-time collaborative code editor MVP
      </footer>
    </div>
  );
}

export default CodeEditorPage; 