import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

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
    pathParameters?: {
        id?: string;
    };
}

// Interface for the response structure
interface LambdaResponse {
    statusCode: number;
    headers: {};
    body: string;
}




// Main Lambda handler function
export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
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
        const response = await docClient.send(new GetCommand({
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
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};