import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CodeEditorPage from './CodeEditorPage';

// Main App component sets up routing for the app
function App() {
  return (
    <Router>
      <Routes>
        {/* Route for the collaborative code editor room */}
        <Route path="/room/:roomId" element={<CodeEditorPage />} />
        {/* Home route with a simple welcome message */}
        <Route path="/" element={<div style={{padding: 32}}>Welcome to CollabCode!<br/>Go to <b>/room/&lt;roomId&gt;</b> to start editing with friends.</div>} />
      </Routes>
    </Router>
  );
}

export default App;
