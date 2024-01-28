import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB Client
const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Type for the event item
interface EventItem {
    id: number;
}

// GET /events?numberOfEvents={number} to get n most recent events
// Function to get the n most recent events
const getRecentEvents = async (numberOfEvents: number): Promise<EventItem[]> => {
    const params = {
        TableName: 'event-data',
        IndexName: 'EventsByStartDateGSI', // GSI name
        KeyConditionExpression: '#partition_key = :partition_value',
        ExpressionAttributeNames: {
            '#partition_key': 'gsiPartitionKey', // partition key name used in GSI
            '#id': 'id'
        },
        ExpressionAttributeValues: {
            ':partition_value': 'ALL_EVENTS', // partition key value
        },
        ProjectionExpression: '#id', // Only return the 'id' attribute
        ScanIndexForward: false, // false for descending order
        Limit: numberOfEvents
    };

    try {
        const command = new QueryCommand(params);
        const data = await docClient.send(command);
        return data.Items as EventItem[];
    } catch (error) {
        console.error('Error fetching recent events:', error);
        throw error;
    }
};

// GET /events?status=ongoing to get all ongoing events
// Function to get ongoing events
const getOngoingEvents = async (): Promise<EventItem[]> => {
    const params = {
        TableName: 'event-data',
        IndexName: 'OngoingEventsIndex',
        KeyConditionExpression: 'ongoing = :ongoingValue',
        ExpressionAttributeValues: {
            ':ongoingValue': 'true'
        },
        ProjectionExpression: 'id'
    };

    try {
        const command = new QueryCommand(params);
        const result = await docClient.send(command);
        return result.Items as EventItem[];
    } catch (error) {
        console.error('Error fetching ongoing events:', error);
        throw error;
    }
};

export const handler = async (event: APIGatewayProxyEvent) => {
    console.log('Received event:', event);
    console.log('Query parameters:', event.queryStringParameters);

    const numberOfEventsInput = event.queryStringParameters?.numberOfEvents;
    const isOngoingQuery = event.queryStringParameters?.status === 'ongoing';

    try {
        let result: EventItem[];

        if (numberOfEventsInput) {
            const numberOfEvents = parseInt(numberOfEventsInput, 10);
            if (isNaN(numberOfEvents) || numberOfEvents <= 0) {
                throw new Error("Invalid 'numberOfEvents' parameter. Must be a positive number.");
            }
            result = await getRecentEvents(numberOfEvents);
            
        } else if (isOngoingQuery) {
            result = await getOngoingEvents();
        } else {
            throw new Error("Invalid query parameter. Please specify either 'numberOfEvents' or 'status=ongoing'.");
        }

        const eventIds = result.map(item => item.id);
        console.log('Event IDs:', eventIds);

        return {
            statusCode: 200,
            body: JSON.stringify(eventIds)
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: ( error as Error).message || 'Failed to fetch events' })
        };
    }
};
