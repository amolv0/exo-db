"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
// Initialize DynamoDB Client
const ddbClient = new client_dynamodb_1.DynamoDBClient({ region: 'us-east-1' });
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(ddbClient);
// Function to get specific event details
const getEventDetails = async (eventId) => {
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
        return result.Items;
    }
    catch (error) {
        console.error('Error fetching ongoing events:', error);
        throw error;
    }
};
const handler = async (event) => {
    console.log('Received event:', event);
    const eventId = event.pathParameters?.eventId;
    try {
        if (eventId) {
            const eventDetails = await getEventDetails(eventId);
            const unmarshalledData = Array.isArray(eventDetails)
                ? eventDetails.map(item => (0, util_dynamodb_1.unmarshall)(item))
                : (0, util_dynamodb_1.unmarshall)(eventDetails);
            return {
                statusCode: 200,
                body: JSON.stringify(unmarshalledData)
            };
        }
        else {
            throw new Error("Event Id not properly provided through path parameters");
        }
    }
    catch (error) {
        console.error('Error:', error);
        const errorMessage = (error instanceof Error) ? error.message : 'Failed to fetch event details';
        return {
            statusCode: 500,
            body: JSON.stringify({ error: errorMessage })
        };
    }
};
exports.handler = handler;
