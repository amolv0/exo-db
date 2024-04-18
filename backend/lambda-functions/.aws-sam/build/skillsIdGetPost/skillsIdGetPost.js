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
// Function to get details for a single skill
const getskillDetails = async (skillId) => {
    const numericskillId = Number(skillId);
    const params = {
        TableName: 'skills-data',
        KeyConditionExpression: 'id = :skillIdValue',
        ExpressionAttributeValues: {
            ':skillIdValue': numericskillId,
        },
    };
    try {
        const command = new lib_dynamodb_1.QueryCommand(params);
        const result = await docClient.send(command);
        return result.Items;
    }
    catch (error) {
        console.error('Error fetching skill:', error);
        throw error;
    }
};
// Function to get details for multiple skills for a POST request
const getMultipleskillDetails = async (skillIds) => {
    const numericskillIds = skillIds.map(id => ({ id: Number(id) }));
    const params = {
        RequestItems: {
            'skills-data': {
                Keys: numericskillIds,
            }
        }
    };
    try {
        const command = new lib_dynamodb_1.BatchGetCommand(params);
        const result = await docClient.send(command);
        return result.Responses?.['skills-data'];
    }
    catch (error) {
        console.error('Error fetching skills:', error);
        throw error;
    }
};
// Main Lambda handler function
const handler = async (event) => {
    console.log('Received event:', event);
    const httpMethod = event.httpMethod;
    try {
        if (httpMethod === 'GET') {
            const pathParam = event.pathParameters?.skillId;
            if (pathParam) {
                const skillDetails = await getskillDetails(pathParam);
                return {
                    statusCode: 200,
                    headers: headers,
                    body: JSON.stringify(skillDetails)
                };
            }
            else {
                throw new Error("skill id not properly provided through path parameters");
            }
        }
        else if (httpMethod === 'POST') {
            let skillIds;
            try {
                const parsedBody = JSON.parse(event.body || '[]');
                if (Array.isArray(parsedBody)) {
                    skillIds = parsedBody;
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
            const skillDetails = await getMultipleskillDetails(skillIds);
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify(skillDetails),
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
            body: JSON.stringify({ error: error.message || 'Failed to fetch skill(es)' })
        };
    }
};
exports.handler = handler;
