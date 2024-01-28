"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
// Initialize DynamoDB Client
const ddbClient = new client_dynamodb_1.DynamoDBClient({ region: 'us-east-1' });
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(ddbClient);
// GET /events?numberOfEvents={number} to get n most recent events
// Function to get the n most recent events
const getRecentEvents = async (numberOfEvents) => {
    const params = {
        TableName: 'event-data',
        IndexName: 'EventsByStartDateGSI', // GSI name
        KeyConditionExpression: '#partition_key = :partition_value',
        ExpressionAttributeNames: {
            '#partition_key': 'gsiPartitionKey', // partition key name used in GSI
            '#id': 'id'
        },
        ExpressionAttributeValues: {
            ':partition_value': 'ALL_EVENTS', // partition key value
        },
        ProjectionExpression: '#id', // Only return the 'id' attribute
        ScanIndexForward: false, // false for descending order
        Limit: numberOfEvents
    };
    try {
        const command = new lib_dynamodb_1.QueryCommand(params);
        const data = await docClient.send(command);
        return data.Items;
    }
    catch (error) {
        console.error('Error fetching recent events:', error);
        throw error;
    }
};
// GET /events?status=ongoing to get all ongoing events
// Function to get ongoing events
const getOngoingEvents = async () => {
    const params = {
        TableName: 'event-data',
        IndexName: 'OngoingEventsIndex',
        KeyConditionExpression: 'ongoing = :ongoingValue',
        ExpressionAttributeValues: {
            ':ongoingValue': 'true'
        },
        ProjectionExpression: 'id'
    };
    try {
        const command = new lib_dynamodb_1.QueryCommand(params);
        const result = await docClient.send(command);
        return result.Items;
    }
    catch (error) {
        console.error('Error fetching ongoing events:', error);
        throw error;
    }
};
const handler = async (event) => {
    console.log('Received event:', event);
    console.log('Query parameters:', event.queryStringParameters);
    const numberOfEventsInput = event.queryStringParameters?.numberOfEvents;
    const isOngoingQuery = event.queryStringParameters?.status === 'ongoing';
    try {
        let result;
        if (numberOfEventsInput) {
            const numberOfEvents = parseInt(numberOfEventsInput, 10);
            if (isNaN(numberOfEvents) || numberOfEvents <= 0) {
                throw new Error("Invalid 'numberOfEvents' parameter. Must be a positive number.");
            }
            result = await getRecentEvents(numberOfEvents);
        }
        else if (isOngoingQuery) {
            result = await getOngoingEvents();
        }
        else {
            throw new Error("Invalid query parameter. Please specify either 'numberOfEvents' or 'status=ongoing'.");
        }
        const eventIds = result.map(item => item.id); // No change needed here, but ensure handling as numbers
        console.log('Event IDs:', eventIds);
        return {
            statusCode: 200,
            body: JSON.stringify(eventIds)
        };
    }
    catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'Failed to fetch events' })
        };
    }
};
exports.handler = handler;
