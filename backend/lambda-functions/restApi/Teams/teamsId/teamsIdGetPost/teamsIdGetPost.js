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
const getTeamDetails = async (query, queryType) => {
    if (queryType == "id") {
        const numbericTeamId = Number(query); // Convert teamId to a Number
        const params = {
            TableName: 'team-data',
            KeyConditionExpression: 'id = :teamIdValue',
            ExpressionAttributeValues: {
                ':teamIdValue': numbericTeamId, // Use numbericTeamId here
            },
        };
        try {
            const command = new lib_dynamodb_1.QueryCommand(params);
            const result = await docClient.send(command);
            return result.Items;
        }
        catch (error) {
            console.error('Error fetching team:', error);
            throw error;
        }
    }
    else if (queryType == "number") {
        console.log(query);
        const params = {
            TableName: 'team-data',
            IndexName: 'TeamNumberIndex',
            KeyConditionExpression: '#teamNumber = :teamNumberValue',
            ExpressionAttributeNames: {
                '#teamNumber': 'number',
            },
            ExpressionAttributeValues: {
                ':teamNumberValue': query,
            },
        };
        try {
            const command = new lib_dynamodb_1.QueryCommand(params);
            const result = await docClient.send(command);
            return result.Items;
        }
        catch (error) {
            console.error('Error fetching team data:', error);
            throw error;
        }
    }
};
// Function to get details for multiple teams for a POST request
const getMultipleTeamDetails = async (queries, queryType) => {
    if (queryType === 'id') {
        const numericTeamids = queries.map(id => ({ id: Number(id) })); // Convert each teamId to a number if the query is of ids
        const params = {
            RequestItems: {
                'team-data': {
                    Keys: numericTeamids, // Use numericEventIds here
                }
            }
        };
        try {
            const command = new lib_dynamodb_1.BatchGetCommand(params);
            const result = await docClient.send(command);
            return result.Responses?.['event-data'];
        }
        catch (error) {
            console.error('Error fetching teams:', error);
            throw error;
        }
    }
    else {
        const numericTeamids = queries.map(number => ({ number: number }));
        const params = {
            RequestItems: {
                'team-data': {
                    Keys: numericTeamids, // Use numericEventIds here
                }
            }
        };
        try {
            const command = new lib_dynamodb_1.BatchGetCommand(params);
            const result = await docClient.send(command);
            return result.Responses?.['event-data'];
        }
        catch (error) {
            console.error('Error fetching teams:', error);
            throw error;
        }
    }
};
// Main Lambda handler function
const handler = async (event) => {
    console.log('Received event:', event);
    const queryType = event.queryStringParameters?.query_type === 'number' ? "number" : "id";
    const httpMethod = event.httpMethod;
    try {
        if (httpMethod === 'GET') {
            const pathParam = event.pathParameters?.teamId;
            if (pathParam) {
                const teamDetails = await getTeamDetails(pathParam, queryType);
                return {
                    statusCode: 200,
                    headers: headers,
                    body: JSON.stringify(teamDetails)
                };
            }
            else {
                throw new Error("Team {queryType} not properly provided through path parameters");
            }
        }
        else if (httpMethod === 'POST') {
            let queries;
            // Parse the JSON string from the request body
            try {
                const parsedBody = JSON.parse(event.body || '[]');
                if (Array.isArray(parsedBody)) {
                    queries = parsedBody;
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
            const teamDetails = await getMultipleTeamDetails(queries, queryType);
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify(teamDetails),
            };
        }
    }
    catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Failed to fetch team(s)' })
        };
    }
};
exports.handler = handler;
