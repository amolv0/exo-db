import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchGetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB Client
const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

// CORS headers
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Interface for Lambda event structure
interface LambdaEvent {
    httpMethod: string;
    pathParameters?: {
        skillId?: string; // It will come as a string through the path param, we convert to a number later
    };
    body?: string;
}

// Interface for the response structure
interface LambdaResponse {
    statusCode: number;
    headers: {};
    body: string;
}

// Function to get details for a single skill
const getskillDetails = async (skillId: string): Promise<any> => {
    const numericskillId = Number(skillId); // Convert skillId to a Number
    const params = {
        TableName: 'skills-data',
        KeyConditionExpression: 'id = :skillIdValue',
        ExpressionAttributeValues: {
            ':skillIdValue': numericskillId,
        },
    };
    try {
        const command = new QueryCommand(params);
        const result = await docClient.send(command);
        return result.Items;
    } catch (error) {
        console.error('Error fetching skill:', error);
        throw error;
    }
};

// Function to get details for multiple skills for a POST request
const getMultipleskillDetails = async (skillIds: string[]): Promise<any> => {
    const numericskillIds = skillIds.map(id => ({ id: Number(id) })); // Convert each skillId to a number
    const params = {
        RequestItems: {
            'skills-data': {
                Keys: numericskillIds,
            }
        }
    };
    try {
        const command = new BatchGetCommand(params);
        const result = await docClient.send(command);
        return result.Responses?.['skills-data'];
    } catch (error) {
        console.error('Error fetching skills:', error);
        throw error;
    }
};

// Main Lambda handler function
export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
    console.log('Received event:', event);
    const httpMethod = event.httpMethod;

    try {
        if(httpMethod === 'GET'){
            const pathParam = event.pathParameters?.skillId;
            if (pathParam) {
                const skillDetails = await getskillDetails(pathParam);
                return {
                    statusCode: 200,
                    headers: headers,
                    body: JSON.stringify(skillDetails)
                };
            } else {
                throw new Error("skill id not properly provided through path parameters");
            }
        } else if(httpMethod === 'POST'){
            let skillIds: string[];
            try {
                const parsedBody = JSON.parse(event.body || '[]');
                if (Array.isArray(parsedBody)) {
                    skillIds = parsedBody;
                } else {
                    throw new Error("Request body is not an array");
                }
            } catch (parseError) {
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
        } else {
            throw new Error("Unsupported HTTP method");
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: (error as Error).message || 'Failed to fetch skill(es)' })
        };
    }
};
