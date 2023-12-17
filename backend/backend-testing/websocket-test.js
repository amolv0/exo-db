const WebSocket = require('websocket').w3cwebsocket;

const ws = new WebSocket('wss://aarnwsrtbl.execute-api.us-east-1.amazonaws.com/dev');

ws.onopen = () => {
    console.log('WebSocket connection established');

    // Create a message to trigger Lambda function
    const message = {
        "action": "ongoingEvents"
    };

    // Send the message as a JSON string
    ws.send(JSON.stringify(message));
    console.log("Sent message");
};

ws.onmessage = (event) => {
    console.log('Received WebSocket message:');
    console.log(event.data); // Log the content of the message
    ws.close();
};

ws.onclose = () => {
    console.log('WebSocket connection closed');
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};
