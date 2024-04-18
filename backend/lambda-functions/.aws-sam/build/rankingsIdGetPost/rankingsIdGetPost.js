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
// Function to get details for a single ranking
const getrankingDetails = async (rankingId) => {
    const numericrankingId = Number(rankingId);
    const params = {
        TableName: 'rankings-data',
        KeyConditionExpression: 'id = :rankingIdValue',
        ExpressionAttributeValues: {
            ':rankingIdValue': numericrankingId,
        },
    };
    try {
        const command = new lib_dynamodb_1.QueryCommand(params);
        const result = await docClient.send(command);
        return result.Items;
    }
    catch (error) {
        console.error('Error fetching ranking:', error);
        throw error;
    }
};
// Function to get details for multiple rankings for a POST request
const getMultiplerankingDetails = async (rankingIds) => {
    const numericrankingIds = rankingIds.map(id => ({ id: Number(id) }));
    const params = {
        RequestItems: {
            'rankings-data': {
                Keys: numericrankingIds,
            }
        }
    };
    try {
        const command = new lib_dynamodb_1.BatchGetCommand(params);
        const result = await docClient.send(command);
        return result.Responses?.['rankings-data'];
    }
    catch (error) {
        console.error('Error fetching rankings:', error);
        throw error;
    }
};
// Main Lambda handler function
const handler = async (event) => {
    console.log('Received event:', event);
    const httpMethod = event.httpMethod;
    try {
        if (httpMethod === 'GET') {
            const pathParam = event.pathParameters?.rankingsId;
            if (pathParam) {
                const rankingDetails = await getrankingDetails(pathParam);
                return {
                    statusCode: 200,
                    headers: headers,
                    body: JSON.stringify(rankingDetails)
                };
            }
            else {
                throw new Error("ranking id not properly provided through path parameters");
            }
        }
        else if (httpMethod === 'POST') {
            let rankingIds;
            try {
                const parsedBody = JSON.parse(event.body || '[]');
                if (Array.isArray(parsedBody)) {
                    rankingIds = parsedBody;
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
            const rankingDetails = await getMultiplerankingDetails(rankingIds);
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify(rankingDetails),
            };
        }
        else {
            throw new Error("Unsupported HTTP method");
        }
    }
    catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Failed to fetch ranking(es)' })
        };
    }
};
exports.handler = handler;
