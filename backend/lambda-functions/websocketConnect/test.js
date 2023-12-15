import { handler } from './websocketConnect.js';

async function testWebsocketConnect() {
    try {
        // Mock WebSocket connect event
        const event = {
            requestContext: {
                connectionId: 'testConnectionId123', // Example connection ID
                domainName: 'wss://gruvv52k29.execute-api.us-east-1.amazonaws.com/dev/', // Example domain name
                stage: 'dev' // Example stage
            }
        };

        const response = await handler(event);
        console.log('Response:', JSON.stringify(response, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testWebsocketConnect();
