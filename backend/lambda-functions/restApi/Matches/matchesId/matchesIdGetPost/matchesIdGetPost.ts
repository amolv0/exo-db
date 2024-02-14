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
        matchId?: string; // It will come as a string through the path param, we convert to a number later
    };
    body?: string;
}

// Interface for the response structure
interface LambdaResponse {
    statusCode: number;
    headers: {};
    body: string;
}

// Function to get details for a single match
const getMatchDetails = async (matchId: string): Promise<any> => {
    const numericMatchId = Number(matchId); // Convert matchId to a Number
    const params = {
        TableName: 'match-data',
        KeyConditionExpression: 'id = :matchIdValue',
        ExpressionAttributeValues: {
            ':matchIdValue': numericMatchId,
        },
    };
    try {
        const command = new QueryCommand(params);
        const result = await docClient.send(command);
        return result.Items;
    } catch (error) {
        console.error('Error fetching match:', error);
        throw error;
    }
};

// Function to get details for multiple matches for a POST request
const getMultipleMatchDetails = async (matchIds: string[]): Promise<any> => {
    const numericMatchIds = matchIds.map(id => ({ id: Number(id) })); // Convert each matchId to a number
    const params = {
        RequestItems: {
            'match-data': {
                Keys: numericMatchIds,
            }
        }
    };
    try {
        const command = new BatchGetCommand(params);
        const result = await docClient.send(command);
        return result.Responses?.['match-data'];
    } catch (error) {
        console.error('Error fetching matches:', error);
        throw error;
    }
};

// Main Lambda handler function
export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
    console.log('Received event:', event);
    const httpMethod = event.httpMethod;

    try {
        if(httpMethod === 'GET'){
            const pathParam = event.pathParameters?.matchId;
            if (pathParam) {
                const matchDetails = await getMatchDetails(pathParam);
                return {
                    statusCode: 200,
                    headers: headers,
                    body: JSON.stringify(matchDetails)
                };
            } else {
                throw new Error("Match id not properly provided through path parameters");
            }
        } else if(httpMethod === 'POST'){
            let matchIds: string[];
            try {
                const parsedBody = JSON.parse(event.body || '[]');
                if (Array.isArray(parsedBody)) {
                    matchIds = parsedBody;
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
            const matchDetails = await getMultipleMatchDetails(matchIds);
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify(matchDetails),
            };
        } else {
            throw new Error("Unsupported HTTP method");
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: (error as Error).message || 'Failed to fetch match(es)' })
        };
    }
};
