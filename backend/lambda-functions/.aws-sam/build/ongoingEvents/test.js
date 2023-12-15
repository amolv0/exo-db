import { handler } from './ongoingEvents.js';

// Mock event structure similar to what AWS Lambda would receive from API Gateway
const mockEvent = {
    requestContext: {
        connectionId: 'testConnectionId123', // Sample connection ID
        domainName: 'wss://gruvv52k29.execute-api.us-east-1.amazonaws.com/dev', // Sample domain name
        stage: 'dev' // Sample stage
    },
    body: JSON.stringify({ action: 'ongoingEvents' }) // Mocked body with action
};

handler(mockEvent)
    .then(response => console.log('Response:', response))
    .catch(error => console.error('Error:', error));