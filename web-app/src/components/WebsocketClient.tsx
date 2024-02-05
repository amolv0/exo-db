import { useEffect, useState } from 'react';
import '../index.css';

const WebSocketClient = () => {
  const [messages, setMessages] = useState<string[]>([]);
  let socket: WebSocket;

  useEffect(() => {
    socket = new WebSocket('wss://aarnwsrtbl.execute-api.us-east-1.amazonaws.com/dev');

    socket.onopen = () => {
      console.log('WebSocket Connected');
      socket.send(JSON.stringify({ action: 'ongoingEvents' }));
    };

    socket.onmessage = (event) => {
      console.log('Message from server ', event.data);
      setMessages((prevMessages) => [...prevMessages, event.data]);
    };

    socket.onclose = () => {
      console.log('WebSocket Disconnected');
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div>
      <h2 className = "text-white">Ongoing Events:</h2>
      {messages.map((message, index) => (
        <p key={index}>{message}</p>
      ))}
    </div>
  );
};

export default WebSocketClient;