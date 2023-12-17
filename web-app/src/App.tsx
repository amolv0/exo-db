import React from 'react';
import './App.css';
import WebSocketClient from './components/WebsocketClient';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <WebSocketClient />
      </header>
    </div>
  );
}

export default App;
