// test.js
import { handler } from './nMostRecent.js';

async function testNMostRecent(n) {
    try {
        const event = { numberOfEvents: n.toString() };
        const response = await handler(event);
        console.log('Response:', response);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Replace with desired value of n
const n = 5;
testNMostRecent(n);