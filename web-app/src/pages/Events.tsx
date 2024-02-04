import React from 'react';
import WebSocketClient from '../components/WebsocketClient';

const Teams: React.FC = () => {
  return (
    <div className="flex flex-col items-center">
        <h1 className="text-white text-2xl font-bold mb-4 my-8">Events</h1>
        <WebSocketClient/>
    </div>
  );
};

export default Teams;