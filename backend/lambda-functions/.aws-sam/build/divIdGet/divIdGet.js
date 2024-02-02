"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
// Initialize DynamoDB Client
const ddbClient = new client_dynamodb_1.DynamoDBClient({ region: 'us-east-1' });
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(ddbClient);
// Function to get specific division of a specific event
const getEventDivisionById = async (eventId, divId) => {
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
        if (result.Items) {
            for (const item of result.Items) {
                // Unmarshall the entire DynamoDB item into a regular JavaScript object
                const unmarshalledItem = (0, util_dynamodb_1.unmarshall)(item);
                console.log("Unmarshalled item:", unmarshalledItem);
                // Now you can directly work with the unmarshalledItem, which should have a more straightforward structure
                if (unmarshalledItem.divisions && Array.isArray(unmarshalledItem.divisions)) {
                    console.log("Got here");
                    // Iterate over the array of divisions in the unmarshalled item
                    for (const division of unmarshalledItem.divisions) {
                        console.log('Division:', division);
                        // Check if the division has the matching divId
                        if (division.id === divId) {
                            return division; // Return the matching division object
                        }
                    }
                }
            }
        }
        return null; // Return null if no matching division is found
    }
    catch (error) {
        console.error('Error fetching event division:', error);
        throw error;
    }
};
const handler = async (event) => {
    console.log('Received event:', event);
    const { eventId, divId } = event.pathParameters || {};
    try {
        if (eventId && divId) {
            const division = await getEventDivisionById(eventId, Number(divId));
            if (division) {
                return {
                    statusCode: 200,
                    body: JSON.stringify(division)
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
            throw new Error("Event Id or Division Id not properly provided through path parameters");
        }
    }
    catch (error) {
        console.error('Error:', error);
        const errorMessage = (error instanceof Error) ? error.message : 'Failed to fetch event division';
        return {
            statusCode: 500,
            body: JSON.stringify({ error: errorMessage })
        };
    }
};
exports.handler = handler;
