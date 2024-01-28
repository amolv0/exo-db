import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

// Initialize DynamoDB Client
const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Interface for the event parameter
interface LambdaEvent {
    pathParameters: {
        eventId?: number;
    }
}

// Interface for the response structure
interface LambdaResponse {
    statusCode: number;
    body: string;
}

// Function to get specific event details
const getEventDetails = async (eventId: number): Promise<any> => {
    const params = {
        TableName: 'event-data',
        KeyConditionExpression: 'id = :eventIdValue',
        ExpressionAttributeValues: {
            ':eventIdValue': { N: eventId.toString() } 
        },
    };
    
    try {
        const command = new QueryCommand(params);
        const result = await docClient.send(command);
        return result.Items
    } catch (error) {
        console.error('Error fetching ongoing events:', error);
        throw error;
    }
};

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
    console.log('Received event:', event);
    const eventId = event.pathParameters?.eventId;
    try {
        if (eventId) {
            const eventDetails = await getEventDetails(eventId);
            const unmarshalledData = Array.isArray(eventDetails)
                ? eventDetails.map(item => unmarshall(item))
                : unmarshall(eventDetails);
            return {
                statusCode: 200,
                body: JSON.stringify(unmarshalledData)
            };
        } else {
            throw new Error("Event Id not properly provided through path parameters");
        }
    } catch (error) {
        console.error('Error:', error);
        const errorMessage = (error instanceof Error) ? error.message : 'Failed to fetch event details';
        return {
            statusCode: 500,
            body: JSON.stringify({ error: errorMessage })
        };
    }
};
