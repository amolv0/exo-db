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

// Function to query ongoing events with optional program filtering and limit
const getOngoingEvents = async (eventCode?: string): Promise<number[]> => {
    let accumulatedItems: number[] = [];
    let lastEvaluatedKey = undefined;

    do {
        const params: any = {
            TableName: 'event-data',
            IndexName: 'OngoingEventsIndex',
            KeyConditionExpression: '#ongoing_attr = :ongoingValue',
            ExpressionAttributeNames: {
                '#ongoing_attr': 'ongoing',
            },
            ExpressionAttributeValues: {
                ':ongoingValue': 'true',
            },
            ProjectionExpression: 'id',
            ExclusiveStartKey: lastEvaluatedKey, // Use the last evaluated key for pagination
        };

        if (eventCode) {
            params.FilterExpression = '#program = :program_value';
            params.ExpressionAttributeNames['#program'] = 'program';
            params.ExpressionAttributeValues[':program_value'] = eventCode;
        }

        const command = new QueryCommand(params);
        const response = await docClient.send(command);
        const items = response.Items as EventItem[];
        accumulatedItems = [...accumulatedItems, ...items.map(item => item.id)];
        lastEvaluatedKey = response.LastEvaluatedKey;

    } while (lastEvaluatedKey); // Continue until all items are fetched

    return accumulatedItems;
};

// Function to build query parameters dynamically
const buildQueryParams = (startDate?: string, numberOfEvents = 10, eventCode?: string, isBefore?: boolean) => {
    const params: any = {
        TableName: 'event-data',
        IndexName: 'EventsByStartDateGSI',
        KeyConditionExpression: '#partition_key = :partition_value',
        ExpressionAttributeNames: {
            '#partition_key': 'gsiPartitionKey',
            // '#start_attr' will be conditionally added below if needed
        },
        ExpressionAttributeValues: {
            ':partition_value': 'ALL_EVENTS',
        },
        ProjectionExpression: 'id',
        ScanIndexForward: startDate ? !isBefore : false, // false for descending (most recent first) by default
        Limit: numberOfEvents
    };

    // Conditionally add start date condition and '#start_attr'
    if (startDate) {
        params.KeyConditionExpression += ` AND #start_attr ${isBefore ? '<' : '>'} :start_date`;
        params.ExpressionAttributeNames['#start_attr'] = 'start';
        params.ExpressionAttributeValues[':start_date'] = startDate;
    }

    // Add program filter if eventCode is provided
    if (eventCode) {
        params.ExpressionAttributeNames['#program'] = 'program';
        params.ExpressionAttributeValues[':program_value'] = eventCode;
        params.FilterExpression = '#program = :program_value';
    }

    return params;
};

// Main Lambda handler function
export const handler = async (event: APIGatewayProxyEvent) => {
    console.log('Received event:', event);
    const numberOfEventsInput = event.queryStringParameters?.numberOfEvents || '10';
    const numberOfEvents = parseInt(numberOfEventsInput, 10);
    const startBefore = event.queryStringParameters?.start_before;
    const startAfter = event.queryStringParameters?.start_after;
    const isOngoingQuery = event.queryStringParameters?.status === 'ongoing';
    const eventCode = event.queryStringParameters?.program;

    // Validate eventCode
    // the only ones that are worth working with are (based on what robotevents even has on their website): VRC, VIQRC, WORKSHOP, VEXU, ADC, VAIRC, TVRC, TVIQRC
    const validEventCodes = ['VRC', 'VIQRC', 'WORKSHOP', 'VEXU', 'ADC', 'TVRC', 'TVIQRC', 'BellAVR', 'FAC', 'NRL', 'VAIRC']; 
    if (eventCode && !validEventCodes.includes(eventCode)) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: `Invalid 'program' parameter. Must be one of ${validEventCodes.join(', ')}.` })
        };
    }

    try {
        let id_array: number[] = [];
        if (isOngoingQuery) {
            id_array = await getOngoingEvents(eventCode);
        } else {
                let lastEvaluatedKey = undefined;
                do {
                    const params = buildQueryParams(startBefore || startAfter, numberOfEvents - id_array.length, eventCode, !!startBefore);
                    params.ExclusiveStartKey = lastEvaluatedKey; // Use the last evaluated key for pagination
                    const command = new QueryCommand(params);
                    const response = await docClient.send(command);
                    const items = response.Items as EventItem[];
                    id_array = [...id_array, ...items.map(item => item.id)];
                    lastEvaluatedKey = response.LastEvaluatedKey;
                } while (lastEvaluatedKey && id_array.length < numberOfEvents);
            }

        //console.log('Event items:', result);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(id_array)
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
