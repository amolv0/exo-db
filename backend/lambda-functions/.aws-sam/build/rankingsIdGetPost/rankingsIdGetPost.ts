import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchGetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
};

interface LambdaEvent {
    httpMethod: string;
    pathParameters?: {
        rankingsId?: string; // It will come as a string through the path param, we convert to a number later
    };
    body?: string;
}

interface LambdaResponse {
    statusCode: number;
    headers: {};
    body: string;
}

// Function to get details for a single ranking
const getrankingDetails = async (rankingId: string): Promise<any> => {
    const numericrankingId = Number(rankingId);
    const params = {
        TableName: 'rankings-data',
        KeyConditionExpression: 'id = :rankingIdValue',
        ExpressionAttributeValues: {
            ':rankingIdValue': numericrankingId,
        },
    };
    try {
        const command = new QueryCommand(params);
        const result = await docClient.send(command);
        return result.Items;
    } catch (error) {
        console.error('Error fetching ranking:', error);
        throw error;
    }
};

// Function to get details for multiple rankings for a POST request
const getMultiplerankingDetails = async (rankingIds: string[]): Promise<any> => {
    const numericrankingIds = rankingIds.map(id => ({ id: Number(id) }));
    const params = {
        RequestItems: {
            'rankings-data': {
                Keys: numericrankingIds,
            }
        }
    };
    try {
        const command = new BatchGetCommand(params);
        const result = await docClient.send(command);
        return result.Responses?.['rankings-data'];
    } catch (error) {
        console.error('Error fetching rankings:', error);
        throw error;
    }
};

// Main Lambda handler function
export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
    console.log('Received event:', event);
    const httpMethod = event.httpMethod;

    try {
        if(httpMethod === 'GET'){
            const pathParam = event.pathParameters?.rankingsId;
            if (pathParam) {
                const rankingDetails = await getrankingDetails(pathParam);
                return {
                    statusCode: 200,
                    headers: headers,
                    body: JSON.stringify(rankingDetails)
                };
            } else {
                throw new Error("ranking id not properly provided through path parameters");
            }
        } else if(httpMethod === 'POST'){
            let rankingIds: string[];
            try {
                const parsedBody = JSON.parse(event.body || '[]');
                if (Array.isArray(parsedBody)) {
                    rankingIds = parsedBody;
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
            const rankingDetails = await getMultiplerankingDetails(rankingIds);
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify(rankingDetails),
            };
        } else {
            throw new Error("Unsupported HTTP method");
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: (error as Error).message || 'Failed to fetch ranking(es)' })
        };
    }
};
