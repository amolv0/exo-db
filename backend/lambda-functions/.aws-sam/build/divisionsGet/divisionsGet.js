"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const ddbClient = new client_dynamodb_1.DynamoDBClient({ region: 'us-east-1' });
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(ddbClient);
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
};
// Function to get divisions of a specific event
const getEventDivisions = async (eventId) => {
    const params = {
        TableName: 'event-data',
        KeyConditionExpression: 'id = :eventIdValue',
        ExpressionAttributeValues: {
            ':eventIdValue': { N: eventId.toString() }
        },
    };
    try {
        const command = new client_dynamodb_1.QueryCommand(params);
        const result = await docClient.send(command);
        const divisions = result.Items?.map(item => item.divisions?.L).flat();
        return divisions;
    }
    catch (error) {
        console.error('Error fetching event divisions:', error);
        throw error;
    }
};
const handler = async (event) => {
    console.log('Received event:', event);
    const eventId = event.pathParameters?.eventId;
    try {
        if (eventId) {
            const divisions = await getEventDivisions(eventId);
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify((0, util_dynamodb_1.unmarshall)(divisions))
            };
        }
        else {
            throw new Error("Event Id not properly provided through path parameters");
        }
    }
    catch (error) {
        console.error('Error:', error);
        const errorMessage = (error instanceof Error) ? error.message : 'Failed to fetch event divisions';
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({ error: errorMessage })
        };
    }
};
exports.handler = handler;
