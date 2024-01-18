import { handler } from './websocketDisconnect.js';

async function testWebsocketDisconnect() {
    try {
        // Mock WebSocket disconnect event
        const event = {
            requestContext: {
                connectionId: 'testConnectionId123' // Example connection ID
            }
        };

        const response = await handler(event);
        console.log('Response:', JSON.stringify(response, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testWebsocketDisconnect();