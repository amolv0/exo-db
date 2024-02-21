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
        awardId?: string; // It will come as a string through the path param, we convert to a number later
    };
    body?: string;
}

// Interface for the response structure
interface LambdaResponse {
    statusCode: number;
    headers: {};
    body: string;
}

// Function to get details for a single award
const getAwardDetails = async (awardId: string): Promise<any> => {
    const numericAwardId = Number(awardId); // Convert awardId to a Number
    const params = {
        TableName: 'award-data',
        KeyConditionExpression: 'id = :awardIdValue',
        ExpressionAttributeValues: {
            ':awardIdValue': numericAwardId,
        },
    };
    try {
        const command = new QueryCommand(params);
        const result = await docClient.send(command);
        return result.Items;
    } catch (error) {
        console.error('Error fetching award:', error);
        throw error;
    }
};

// Function to get details for multiple awards for a POST request
const getMultipleAwardDetails = async (awardIds: string[]): Promise<any> => {
    const numericAwardIds = awardIds.map(id => ({ id: Number(id) })); // Convert each awardId to a number
    const params = {
        RequestItems: {
            'award-data': {
                Keys: numericAwardIds,
            }
        }
    };
    try {
        const command = new BatchGetCommand(params);
        const result = await docClient.send(command);
        return result.Responses?.['award-data'];
    } catch (error) {
        console.error('Error fetching awards:', error);
        throw error;
    }
};

// Main Lambda handler function
export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
    console.log('Received event:', event);
    const httpMethod = event.httpMethod;

    try {
        if(httpMethod === 'GET'){
            const pathParam = event.pathParameters?.awardId;
            if (pathParam) {
                const awardDetails = await getAwardDetails(pathParam);
                return {
                    statusCode: 200,
                    headers: headers,
                    body: JSON.stringify(awardDetails)
                };
            } else {
                throw new Error("Award id not properly provided through path parameters");
            }
        } else if(httpMethod === 'POST'){
            let awardIds: string[];
            try {
                const parsedBody = JSON.parse(event.body || '[]');
                if (Array.isArray(parsedBody)) {
                    awardIds = parsedBody;
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
            const awardDetails = await getMultipleAwardDetails(awardIds);
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify(awardDetails),
            };
        } else {
            throw new Error("Unsupported HTTP method");
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: (error as Error).message || 'Failed to fetch award(es)' })
        };
    }
};
