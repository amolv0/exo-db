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
// Function to get details for a single award
const getAwardDetails = async (awardId) => {
    const numericAwardId = Number(awardId); // Convert awardId to a Number
    const params = {
        TableName: 'award-data',
        KeyConditionExpression: 'id = :awardIdValue',
        ExpressionAttributeValues: {
            ':awardIdValue': numericAwardId,
        },
    };
    try {
        const command = new lib_dynamodb_1.QueryCommand(params);
        const result = await docClient.send(command);
        return result.Items;
    }
    catch (error) {
        console.error('Error fetching award:', error);
        throw error;
    }
};
// Function to get details for multiple awards for a POST request
const getMultipleAwardDetails = async (awardIds) => {
    const numericAwardIds = awardIds.map(id => ({ id: Number(id) })); // Convert each awardId to a number
    const params = {
        RequestItems: {
            'award-data': {
                Keys: numericAwardIds,
            }
        }
    };
    try {
        const command = new lib_dynamodb_1.BatchGetCommand(params);
        const result = await docClient.send(command);
        return result.Responses?.['award-data'];
    }
    catch (error) {
        console.error('Error fetching awards:', error);
        throw error;
    }
};
// Main Lambda handler function
const handler = async (event) => {
    console.log('Received event:', event);
    const httpMethod = event.httpMethod;
    try {
        if (httpMethod === 'GET') {
            const pathParam = event.pathParameters?.awardId;
            if (pathParam) {
                const awardDetails = await getAwardDetails(pathParam);
                return {
                    statusCode: 200,
                    headers: headers,
                    body: JSON.stringify(awardDetails)
                };
            }
            else {
                throw new Error("Award id not properly provided through path parameters");
            }
        }
        else if (httpMethod === 'POST') {
            let awardIds;
            try {
                const parsedBody = JSON.parse(event.body || '[]');
                if (Array.isArray(parsedBody)) {
                    awardIds = parsedBody;
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
            const awardDetails = await getMultipleAwardDetails(awardIds);
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify(awardDetails),
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
            body: JSON.stringify({ error: error.message || 'Failed to fetch award(es)' })
        };
    }
};
exports.handler = handler;
