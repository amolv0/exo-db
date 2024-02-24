"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
// Initialize DynamoDB Client
const ddbClient = new client_dynamodb_1.DynamoDBClient({ region: 'us-east-1' });
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(ddbClient);
// CORS headers
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
};
// Function to get specifi event details for a GET request
const getEventDetails = async (eventId) => {
    const numericEventId = Number(eventId); // Convert eventId to a number
    const params = {
        TableName: 'event-data',
        KeyConditionExpression: 'id = :eventIdValue',
        ExpressionAttributeValues: {
            ':eventIdValue': numericEventId, // Use numericEventId here
        },
    };
    try {
        const command = new lib_dynamodb_1.QueryCommand(params);
        const result = await docClient.send(command);
        return result.Items;
    }
    catch (error) {
        console.error('Error fetching event:', error);
        throw error;
    }
};
// Function to get details for multiple events for a POST request
const getMultipleEventDetails = async (eventIds) => {
    const numericEventIds = eventIds.map(id => ({ id: Number(id) })); // Convert each eventId to a number
    const params = {
        RequestItems: {
            'event-data': {
                Keys: numericEventIds, // Use numericEventIds here
                ProjectionExpression: "id, #name, #start, #end, #location, #region, #season, #program",
                ExpressionAttributeNames: {
                    "#name": "name",
                    "#start": "start",
                    "#end": "end",
                    "#location": "location",
                    "#region": "region",
                    "#season": "season",
                    "#program": "program"
                }
            }
        }
    };
    try {
        const command = new lib_dynamodb_1.BatchGetCommand(params);
        const result = await docClient.send(command);
        return result.Responses?.['event-data'];
    }
    catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
};
// Updated handler to support both GET and POST requests
const handler = async (event) => {
    console.log('Received event:', event);
    try {
        if (event.httpMethod === 'GET') {
            const eventId = event.pathParameters?.eventId;
            if (eventId) {
                const eventDetails = await getEventDetails(eventId);
                return {
                    statusCode: 200,
                    headers: headers,
                    body: JSON.stringify(eventDetails)
                };
            }
            else {
                throw new Error("Event Id not properly provided through path parameters");
            }
        }
        else if (event.httpMethod === 'POST') {
            // Handle POST request
            let eventIds;
            // Parse the JSON string from the request body
            try {
                const parsedBody = JSON.parse(event.body || '[]');
                if (Array.isArray(parsedBody)) {
                    eventIds = parsedBody;
                }
                else {
                    throw new Error("Request body is not an array");
                }
            }
            catch (parseError) {
                console.error('Parsing error:', parseError);
                return {
                    statusCode: 400,
                    headers: headers,
                    body: JSON.stringify({ error: "Failed to parse request body as JSON array" }),
                };
            }
            const eventDetails = await getMultipleEventDetails(eventIds);
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify(eventDetails),
            };
        }
        else {
            throw new Error("Unsupported HTTP method");
        }
    }
    catch (error) {
        console.error('Error:', error);
        const errorMessage = (error instanceof Error) ? error.message : 'Failed to process request';
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({ error: errorMessage })
        };
    }
};
exports.handler = handler;
