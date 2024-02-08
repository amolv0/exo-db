"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
// Initialize DynamoDB Client
const ddbClient = new client_dynamodb_1.DynamoDBClient({ region: 'us-east-1' });
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(ddbClient);
// CORS headers
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
};
// Function to query ongoing events with optional program filtering and limit
const getOngoingEvents = async (eventCode) => {
    let accumulatedItems = [];
    let lastEvaluatedKey = undefined;
    do {
        const params = {
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
        const command = new lib_dynamodb_1.QueryCommand(params);
        const response = await docClient.send(command);
        const items = response.Items;
        accumulatedItems = [...accumulatedItems, ...items.map(item => item.id)];
        lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey); // Continue until all items are fetched
    return accumulatedItems;
};
// Function to build query parameters dynamically
const buildQueryParams = (startDate, numberOfEvents = 10, eventCode, isBefore) => {
    const params = {
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
// Function to query events by region with optional program filtering and limit
const getEventsByRegion = async (region, startDate, numberOfEvents = 10, eventCode, isBefore) => {
    let accumulatedItems = [];
    let lastEvaluatedKey = undefined;
    do {
        const params = {
            TableName: 'event-data',
            IndexName: 'RegionStartIndex',
            KeyConditionExpression: '#region = :regionVal',
            ExpressionAttributeNames: {
                '#region': 'region',
            },
            ExpressionAttributeValues: {
                ':regionVal': region,
            },
            ProjectionExpression: 'id',
            ScanIndexForward: startDate ? !isBefore : false,
            Limit: numberOfEvents,
            ExclusiveStartKey: lastEvaluatedKey,
        };
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
        const command = new lib_dynamodb_1.QueryCommand(params);
        const response = await docClient.send(command);
        const items = response.Items;
        accumulatedItems = [...accumulatedItems, ...items.map(item => item.id)];
        lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey && accumulatedItems.length < numberOfEvents);
    return accumulatedItems;
};
// Main Lambda handler function
const handler = async (event) => {
    console.log('Received event:', event);
    const numberOfEventsInput = event.queryStringParameters?.numberOfEvents || '10';
    const numberOfEvents = parseInt(numberOfEventsInput, 10);
    const startBefore = event.queryStringParameters?.start_before;
    const startAfter = event.queryStringParameters?.start_after;
    const isOngoingQuery = event.queryStringParameters?.status === 'ongoing';
    const eventCode = event.queryStringParameters?.program;
    const eventRegion = event.queryStringParameters?.region;
    const allowedParams = ['numberOfEvents', 'start_before', 'start_after', 'status', 'program', 'region'];
    const queryParams = Object.keys(event.queryStringParameters || {});
    const invalidParams = queryParams.filter(param => !allowedParams.includes(param));
    if (invalidParams.length > 0) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: `Invalid query parameters provided: ${invalidParams.join(', ')}.` })
        };
    }
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
    // Validate startBefore and startAfter dates format if provided
    const datetimeRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|([+-]\d{2}:\d{2})))?$/;
    if (startBefore && !datetimeRegex.test(startBefore)) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Invalid 'start_before' parameter. Must be a date in 'YYYY-MM-DD' format." })
        };
    }
    if (startAfter && !datetimeRegex.test(startAfter)) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Invalid 'start_after' parameter. Must be a date in 'YYYY-MM-DD' format." })
        };
    }
    try {
        let id_array = [];
        if (isOngoingQuery) {
            id_array = await getOngoingEvents(eventCode);
        }
        else if (eventRegion) {
            id_array = await getEventsByRegion(eventRegion, startBefore || startAfter, numberOfEvents, eventCode, !!startBefore);
        }
        else {
            let lastEvaluatedKey = undefined;
            do {
                const params = buildQueryParams(startBefore || startAfter, numberOfEvents - id_array.length, eventCode, !!startBefore);
                params.ExclusiveStartKey = lastEvaluatedKey; // Use the last evaluated key for pagination
                const command = new lib_dynamodb_1.QueryCommand(params);
                const response = await docClient.send(command);
                const items = response.Items;
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
    }
    catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Failed to fetch events' })
        };
    }
};
exports.handler = handler;
