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
// Function to get details for a single match
const getMatchDetails = async (matchId) => {
    const numericMatchId = Number(matchId); // Convert matchId to a Number
    const params = {
        TableName: 'match-data',
        KeyConditionExpression: 'id = :matchIdValue',
        ExpressionAttributeValues: {
            ':matchIdValue': numericMatchId,
        },
    };
    try {
        const command = new lib_dynamodb_1.QueryCommand(params);
        const result = await docClient.send(command);
        return result.Items;
    }
    catch (error) {
        console.error('Error fetching match:', error);
        throw error;
    }
};
// Function to get details for multiple matches for a POST request
const getMultipleMatchDetails = async (matchIds) => {
    const numericMatchIds = matchIds.map(id => ({ id: Number(id) })); // Convert each matchId to a number
    const params = {
        RequestItems: {
            'match-data': {
                Keys: numericMatchIds,
            }
        }
    };
    try {
        const command = new lib_dynamodb_1.BatchGetCommand(params);
        const result = await docClient.send(command);
        return result.Responses?.['match-data'];
    }
    catch (error) {
        console.error('Error fetching matches:', error);
        throw error;
    }
};
// Main Lambda handler function
const handler = async (event) => {
    console.log('Received event:', event);
    const httpMethod = event.httpMethod;
    try {
        if (httpMethod === 'GET') {
            const pathParam = event.pathParameters?.matchId;
            if (pathParam) {
                const matchDetails = await getMatchDetails(pathParam);
                return {
                    statusCode: 200,
                    headers: headers,
                    body: JSON.stringify(matchDetails)
                };
            }
            else {
                throw new Error("Match id not properly provided through path parameters");
            }
        }
        else if (httpMethod === 'POST') {
            let matchIds;
            try {
                const parsedBody = JSON.parse(event.body || '[]');
                if (Array.isArray(parsedBody)) {
                    matchIds = parsedBody;
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
            const matchDetails = await getMultipleMatchDetails(matchIds);
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify(matchDetails),
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
            body: JSON.stringify({ error: error.message || 'Failed to fetch match(es)' })
        };
    }
};
exports.handler = handler;
