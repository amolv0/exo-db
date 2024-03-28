import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchGetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";

// Initialize DynamoDB Client
const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const s3Client = new S3Client({ region: "us-east-1" });

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
        eventId?: string; // It will come as a string through the path param, we convert to a number later
    };
    body?: string;
}

// Interface for the response structure
interface LambdaResponse {
    statusCode: number;
    headers: {};
    body: string;
}


async function fetch_divisions_from_s3(s3_reference: string): Promise<any> {
    // Extract the bucket name and key from the S3 reference
    const match = s3_reference.match(/^s3:\/\/([^\/]+)\/(.+)$/);
    if (!match) {
        throw new Error("Invalid S3 reference format");
    }
    const [, bucketName, key] = match;

    // Fetch the object from S3
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
    });
    const { Body } = await s3Client.send(command);

    if (Body instanceof Readable) { // Ensure the body is a stream
        const divisionsData = await streamToString(Body);
        return JSON.parse(divisionsData); // Assuming the divisions data is JSON-formatted
    } else {
        throw new Error("Expected a readable stream for S3 object body");
    }
}

// Function to get specifi event details for a GET request
const getEventDetails = async (eventId: string): Promise<any> => {
    const numericEventId = Number(eventId); // Convert eventId to a number
    const params = {
        TableName: 'event-data',
        KeyConditionExpression: 'id = :eventIdValue',
        ExpressionAttributeValues: {
            ':eventIdValue': numericEventId, // Use numericEventId here
        },
    };

    try {
        const command = new QueryCommand(params);
        const result = await docClient.send(command);
        let items: Record<string, any>[] = result.Items ?? [];

        for (let item of items){
            if(item && item.divisions && item.divisions.divisions_s3_reference){
                const divisions = await fetch_divisions_from_s3(item.divisions.divisions_s3_reference);
                console.log(divisions);
                item.divisions = divisions;
            }
        }
        return result.Items;
    } catch (error) {
        console.error('Error fetching event:', error);
        throw error;
    }
};

async function streamToString(stream: Readable): Promise<string> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
}

  
// Function to get details for multiple events for a POST request
const getMultipleEventDetails = async (eventIds: string[]): Promise<any> => {
    const numericEventIds = eventIds.map(id => ({ id: Number(id) })); // Convert each eventId to a number
    const params = {
        RequestItems: {
            'event-data': {
                Keys: numericEventIds, // Use numericEventIds here
                ProjectionExpression: "id, #name, #start, #end, #location, #region, #season, #program, #level",
                ExpressionAttributeNames: {
                    "#name": "name",
                    "#start": "start",
                    "#end": "end",
                    "#location": "location",
                    "#region": "region",
                    "#season": "season",
                    "#program": "program",
                    "#level": "level"
                }
            }
        }
    };

    try {
        const command = new BatchGetCommand(params);
        const result = await docClient.send(command);
        return result.Responses?.['event-data'];
    } catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
};

// Updated handler to support both GET and POST requests
export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
    console.log('Received event:', event);

    try {
        if (event.httpMethod === 'GET') {
            const eventId = event.pathParameters?.eventId;
            if (eventId) {
                const eventDetails = await getEventDetails(eventId);
                return {
                    statusCode: 200,
                    headers: headers,
                    body: JSON.stringify(eventDetails)
                };
            } else {
                throw new Error("Event Id not properly provided through path parameters");
            }
        } else if (event.httpMethod === 'POST') {
            // Handle POST request
            let eventIds: string[];

            // Parse the JSON string from the request body
            try {
                const parsedBody = JSON.parse(event.body || '[]');
                if (Array.isArray(parsedBody)) {
                    eventIds = parsedBody;
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
            const eventDetails = await getMultipleEventDetails(eventIds);
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify(eventDetails),
            };
        } else {
            throw new Error("Unsupported HTTP method");
        }
    } catch (error) {
        console.error('Error:', error);
        const errorMessage = (error instanceof Error) ? error.message : 'Failed to process request';
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({ error: errorMessage })
        };
    }
};
