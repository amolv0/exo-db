import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
};

interface LambdaEvent {
    pathParameters: {
        eventId?: number;
        divId?: number;
    }
}

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
                if (unmarshalledItem.divisions && Array.isArray(unmarshalledItem.divisions)) {
                    console.log("Got here");
        
                    for (const division of unmarshalledItem.divisions) {
                        console.log('Division:', division);
        
                        if (division.id === divId) {
                            return division;
                        }
                    }
                }
            }
        }
        return null;
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
