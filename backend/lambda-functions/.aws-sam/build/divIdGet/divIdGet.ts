import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

// Initialize DynamoDB Client
const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

// CORS headers
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Interface for the event parameter
interface LambdaEvent {
    pathParameters: {
        eventId?: number;
        divId?: number;
    }
}

// Interface for the response structure
interface LambdaResponse {
    statusCode: number;
    headers: {};
    body: string;
}

// Function to get specific division of a specific event
const getEventDivisionById = async (eventId: number, divId: number): Promise<any> => {
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

        if (result.Items) {
            for (const item of result.Items) {
                // Unmarshall the entire DynamoDB item into a regular JavaScript object
                const unmarshalledItem = unmarshall(item);
                console.log("Unmarshalled item:", unmarshalledItem);
        
                // Now directly work with the unmarshalledItem, which should have a more straightforward structure
                if (unmarshalledItem.divisions && Array.isArray(unmarshalledItem.divisions)) {
                    console.log("Got here");
        
                    // Iterate over the array of divisions in the unmarshalled item
                    for (const division of unmarshalledItem.divisions) {
                        console.log('Division:', division);
        
                        // Check if the division has the matching divId
                        if (division.id === divId) {
                            return division; // Return the matching division object
                        }
                    }
                }
            }
        }
        return null; // Return null if no matching division is found
    } catch (error) {
        console.error('Error fetching event division:', error);
        throw error;
    }
};



export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
    console.log('Received event:', event);
    const { eventId, divId } = event.pathParameters || {};

    try {
        if (eventId && divId) {
            const division = await getEventDivisionById(eventId, Number(divId));
            if (division) {
                return {
                    statusCode: 200,
                    headers: headers,
                    body: JSON.stringify(division)
                };
            } else {
                return {
                    statusCode: 404,
                    headers: headers,
                    body: JSON.stringify({ error: "Division not found" })
                };
            }
        } else {
            throw new Error("Event Id or Division Id not properly provided through path parameters");
        }
    } catch (error) {
        console.error('Error:', error);
        const errorMessage = (error instanceof Error) ? error.message : 'Failed to fetch event division';
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({ error: errorMessage })
        };
    }
};
