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

// CORS headers
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
};

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

// Function to get events before a given start date
const getEventsBeforeStartDate = async (startDate: string, numberOfEvents: number): Promise<EventItem[]> => {
    const params = {
        TableName: 'event-data',
        IndexName: 'EventsByStartDateGSI',
        KeyConditionExpression: '#partition_key = :partition_value AND #start_attr < :start_date',
        ExpressionAttributeNames: {
            '#partition_key': 'gsiPartitionKey',
            '#start_attr': 'start', // sort key name in GSI, 'start' is a reserved keyword in dynamodb
        },
        ExpressionAttributeValues: {
            ':partition_value': 'ALL_EVENTS',
            ':start_date': startDate,
        },
        ProjectionExpression: 'id, #start_attr',
        ScanIndexForward: false, // false for descending order (most recent first)
        Limit: numberOfEvents
    };

    const command = new QueryCommand(params);
    const { Items } = await docClient.send(command);
    return Items as EventItem[];
};

// Function to get events after a given start date
const getEventsAfterStartDate = async (startDate: string, numberOfEvents: number): Promise<EventItem[]> => {
    const params = {
        TableName: 'event-data',
        IndexName: 'EventsByStartDateGSI',
        KeyConditionExpression: '#partition_key = :partition_value AND #start_attr > :start_date',
        ExpressionAttributeNames: {
            '#partition_key': 'gsiPartitionKey',
            '#start_attr': 'start', // sort key name in GSI, 'start' is a reserved keyword in dynamodb
        },
        ExpressionAttributeValues: {
            ':partition_value': 'ALL_EVENTS',
            ':start_date': startDate,
        },
        ProjectionExpression: 'id, #start_attr',
        ScanIndexForward: true, // true for ascending order
        Limit: numberOfEvents
    };

    const command = new QueryCommand(params);
    const { Items } = await docClient.send(command);
    return Items as EventItem[];
};

export const handler = async (event: APIGatewayProxyEvent) => {
    console.log('Received event:', event);
    const numberOfEventsInput = event.queryStringParameters?.numberOfEvents || '10'; // Default to 10 if not provided
    const numberOfEvents = parseInt(numberOfEventsInput, 10);
    if (isNaN(numberOfEvents) || numberOfEvents <= 0) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Invalid 'numberOfEvents' parameter. Must be a positive number." })
        };
    }

    const startBefore = event.queryStringParameters?.start_before;
    const startAfter = event.queryStringParameters?.start_after;
    const isOngoingQuery = event.queryStringParameters?.status === 'ongoing';

    try {
        let result: EventItem[] = [];

        if (startBefore) {
            result = await getEventsBeforeStartDate(startBefore, numberOfEvents);
        } else if (startAfter) {
            result = await getEventsAfterStartDate(startAfter, numberOfEvents);
        } else if (isOngoingQuery) {
            result = await getOngoingEvents();
        } else {
            result = await getRecentEvents(numberOfEvents);
        }

        console.log('Event items:', result);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: (error as Error).message || 'Failed to fetch events' })
        };
    }
};