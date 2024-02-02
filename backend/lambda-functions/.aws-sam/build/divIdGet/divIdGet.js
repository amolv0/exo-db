"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
// Initialize DynamoDB Client
const ddbClient = new client_dynamodb_1.DynamoDBClient({ region: 'us-east-1' });
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(ddbClient);
// Function to get event details, including all divisions
const getEventDetails = async (eventId) => {
    const params = {
        TableName: 'event-data',
        KeyConditionExpression: 'id = :eventIdValue',
        ExpressionAttributeValues: {
            ':eventIdValue': { N: eventId.toString() } // Using the numeric value directly
        },
    };
    try {
        const command = new client_dynamodb_1.QueryCommand(params);
        const result = await docClient.send(command);
        return result.Items;
    }
    catch (error) {
        console.error('Error fetching event details:', error);
        throw error;
    }
};
const handler = async (event) => {
    console.log('Received event:', event);
    const eventIdString = event.pathParameters?.eventId;
    const divIdString = event.pathParameters?.divId;
    try {
        if (eventIdString && divIdString) {
            const eventId = parseInt(eventIdString, 10);
            const divId = parseInt(divIdString, 10);
            const eventDetails = await getEventDetails(eventId);
            // Assuming eventDetails is an array of events, find the first one (if multiple events have the same ID, this might need adjustment)
            const eventItem = eventDetails[0];
            // Assuming divisions are stored in an attribute named 'divisions' and it's an array of division objects
            const matchingDivision = eventItem.divisions.find((division) => division.id === divId);
            if (matchingDivision) {
                return {
                    statusCode: 200,
                    body: JSON.stringify(matchingDivision)
                };
            }
            else {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ error: "Division not found" })
                };
            }
        }
        else {
            throw new Error("Event ID and/or Division ID not properly provided through path parameters");
        }
    }
    catch (error) {
        console.error('Error:', error);
        const errorMessage = (error instanceof Error) ? error.message : 'Failed to fetch division details';
        return {
            statusCode: 500,
            body: JSON.stringify({ error: errorMessage })
        };
    }
};
exports.handler = handler;
