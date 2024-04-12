"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const ddbClient = new client_dynamodb_1.DynamoDBClient({ region: 'us-east-1' });
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(ddbClient);
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
};
// Main Lambda handler function
const handler = async (event) => {
    console.log('Received event:', event);
    const pathParam = event.pathParameters?.id;
    const queryId = pathParam ? decodeURIComponent(pathParam) : null;
    if (!queryId) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Missing or invalid id" }),
        };
    }
    try {
        const response = await docClient.send(new lib_dynamodb_1.GetCommand({
            TableName: "last-page-data",
            Key: { id: queryId },
        }));
        if (!response.Item) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ message: "Item not found" }),
            };
        }
        const lastPage = response.Item.last_page;
        console.log(lastPage);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ lastPage }),
        };
    }
    catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};
exports.handler = handler;
