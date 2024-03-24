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
const getOngoingEvents = async (eventCode, eventLevel, eventRegion) => {
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
        let filterExpressions = [];
        if (eventCode) {
            params.ExpressionAttributeNames['#program'] = 'program';
            params.ExpressionAttributeValues[':program_value'] = eventCode;
            filterExpressions.push('#program = :program_value');
        }
        // Constructing FilterExpression for eventLevel
        if (eventLevel) {
            params.ExpressionAttributeNames['#level'] = 'level';
            if (eventLevel === 'Regional') {
                // Includes both 'Regional' and 'State'
                params.ExpressionAttributeValues[':level_value_regional'] = 'Regional';
                params.ExpressionAttributeValues[':level_value_state'] = 'State';
                filterExpressions.push('(#level = :level_value_regional OR #level = :level_value_state)');
            }
            else {
                // Single eventLevel
                params.ExpressionAttributeValues[':level_value'] = eventLevel;
                filterExpressions.push('#level = :level_value');
            }
        }
        if (eventRegion) {
            params.ExpressionAttributeNames['#region'] = 'region';
            params.ExpressionAttributeValues[':region_value'] = eventRegion;
            filterExpressions.push('#region = :region_value');
        }
        if (filterExpressions.length > 0) {
            params.FilterExpression = filterExpressions.join(' AND ');
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
const buildQueryParams = (startDate, numberOfEvents = 10, eventCode, eventLevel, isBefore) => {
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
    let filterExpressions = [];
    if (eventCode) {
        params.ExpressionAttributeNames['#program'] = 'program';
        params.ExpressionAttributeValues[':program_value'] = eventCode;
        filterExpressions.push('#program = :program_value');
    }
    // Constructing FilterExpression for eventLevel
    if (eventLevel) {
        params.ExpressionAttributeNames['#level'] = 'level';
        if (eventLevel === 'Regional') {
            // Includes both 'Regional' and 'State'
            params.ExpressionAttributeValues[':level_value_regional'] = 'Regional';
            params.ExpressionAttributeValues[':level_value_state'] = 'State';
            filterExpressions.push('(#level = :level_value_regional OR #level = :level_value_state)');
        }
        else {
            // Single eventLevel
            params.ExpressionAttributeValues[':level_value'] = eventLevel;
            filterExpressions.push('#level = :level_value');
        }
    }
    // Combine all filter expressions
    if (filterExpressions.length > 0) {
        params.FilterExpression = filterExpressions.join(' AND ');
    }
    return params;
};
// Function to query events by region with optional program filtering and limit
const getEventsByRegion = async (region, startDate, numberOfEvents = 10, eventCode, eventLevel, isBefore) => {
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
        let filterExpressions = [];
        if (eventCode) {
            params.ExpressionAttributeNames['#program'] = 'program';
            params.ExpressionAttributeValues[':program_value'] = eventCode;
            filterExpressions.push('#program = :program_value');
        }
        // Constructing FilterExpression for eventLevel
        if (eventLevel) {
            params.ExpressionAttributeNames['#level'] = 'level';
            if (eventLevel === 'Regional') {
                // Includes both 'Regional' and 'State'
                params.ExpressionAttributeValues[':level_value_regional'] = 'Regional';
                params.ExpressionAttributeValues[':level_value_state'] = 'State';
                filterExpressions.push('(#level = :level_value_regional OR #level = :level_value_state)');
            }
            else {
                // Single eventLevel
                params.ExpressionAttributeValues[':level_value'] = eventLevel;
                filterExpressions.push('#level = :level_value');
            }
        }
        if (filterExpressions.length > 0) {
            params.FilterExpression = filterExpressions.join(' AND ');
        }
        const command = new lib_dynamodb_1.QueryCommand(params);
        const response = await docClient.send(command);
        const items = response.Items;
        accumulatedItems = [...accumulatedItems, ...items.map(item => item.id)];
        lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey && accumulatedItems.length < numberOfEvents);
    return accumulatedItems;
};
const getEventsByCountry = async (regions, startDate, numberOfEvents = 10, eventCode, eventLevel, isBefore) => {
    let accumulatedItems = [];
    let lastEvaluatedKey = undefined;
    do {
        const params = {
            TableName: 'event-data',
            IndexName: 'EventsByStartDateGSI',
            KeyConditionExpression: '#partition_key = :partition_value',
            ExpressionAttributeNames: {
                '#partition_key': 'gsiPartitionKey',
            },
            ExpressionAttributeValues: {
                ':partition_value': 'ALL_EVENTS',
            },
            ProjectionExpression: 'id',
            ScanIndexForward: startDate ? !isBefore : false,
            Limit: numberOfEvents,
            ExclusiveStartKey: lastEvaluatedKey,
        };
        // Add start date condition
        if (startDate) {
            params.KeyConditionExpression += ` AND #start_attr ${isBefore ? '<' : '>'} :start_date`;
            params.ExpressionAttributeNames['#start_attr'] = 'start';
            params.ExpressionAttributeValues[':start_date'] = startDate;
        }
        let filterExpressions = [];
        if (eventCode) {
            params.ExpressionAttributeNames['#program'] = 'program';
            params.ExpressionAttributeValues[':program_value'] = eventCode;
            filterExpressions.push('#program = :program_value');
        }
        if (eventLevel) {
            params.ExpressionAttributeNames['#level'] = 'level';
            if (eventLevel === 'Regional') {
                // Includes both 'Regional' and 'State'
                params.ExpressionAttributeValues[':level_value_regional'] = 'Regional';
                params.ExpressionAttributeValues[':level_value_state'] = 'State';
                filterExpressions.push('(#level = :level_value_regional OR #level = :level_value_state)');
            }
            else {
                // Single eventLevel
                params.ExpressionAttributeValues[':level_value'] = eventLevel;
                filterExpressions.push('#level = :level_value');
            }
        }
        // Combine all filter expressions
        if (filterExpressions.length > 0) {
            params.FilterExpression = filterExpressions.join(' AND ');
        }
        if (!params.FilterExpression) {
            params.FilterExpression = '';
        }
        if (regions && regions.length > 0) {
            const regionFilters = regions.map((region, index) => `#region${index} = :regionVal${index}`).join(' OR ');
            if (params.FilterExpression.length > 0) {
                params.FilterExpression += ' AND ';
            }
            params.FilterExpression += `(${regionFilters})`;
            regions.forEach((region, index) => {
                params.ExpressionAttributeNames[`#region${index}`] = 'region';
                params.ExpressionAttributeValues[`:regionVal${index}`] = region;
            });
        }
        const command = new lib_dynamodb_1.QueryCommand(params);
        const response = await docClient.send(command);
        const items = response.Items;
        accumulatedItems = [...accumulatedItems, ...items.map(item => item.id)];
        lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey && accumulatedItems.length < numberOfEvents);
    return accumulatedItems;
};
const determineRegions = async (input) => {
    const regions = {
        // Detailed regions for specific countries
        "United States": [
            "Alabama",
            "Alaska",
            "Arizona",
            "Arkansas",
            "California",
            "Colorado",
            "Connecticut",
            "Delaware",
            "District of Columbia",
            "Florida",
            "Georgia",
            "Hawaii",
            "Idaho",
            "Illinois",
            "Indiana",
            "Iowa",
            "Kansas",
            "Kentucky",
            "Louisiana",
            "Maine",
            "Maryland",
            "Massachusetts",
            "Michigan",
            "Minnesota",
            "Mississippi",
            "Missouri",
            "Montana",
            "Nebraska",
            "Nevada",
            "New Hampshire",
            "New Jersey",
            "New Mexico",
            "New York",
            "North Carolina",
            "North Dakota",
            "Ohio",
            "Oklahoma",
            "Oregon",
            "Pennsylvania",
            "Puerto Rico",
            "Rhode Island",
            "South Carolina",
            "South Dakota",
            "Tennessee",
            "Texas",
            "Utah",
            "Vermont",
            "Virginia",
            "Washington",
            "West Virginia",
            "Wisconsin",
            "Wyoming"
        ],
        "Canada": [
            "Alberta",
            "British Columbia",
            "Manitoba",
            "Ontario",
            "Quebec",
            "Saskatchewan",
        ],
        "China": [
            "Beijing",
            "Fujian",
            "Gansu",
            "Guangdong",
            "Guizhou",
            "Hainan",
            "Hebei",
            "Henan",
            "Hong Kong", // Don't
            "Jiangsu",
            "Jiangxi",
            "Jilin",
            "Macau", // Cancel Me!
            "Shaanxi",
            "Shandong",
            "Shanghai",
            "Sichuan",
            "Tianjin",
            "Zhejiang"
        ],
        "Germany": [
            "Baden-Württemberg",
            "Berlin",
            "Hamburg",
            "Niedersachsen",
            "Nordrhein-Westfalen",
            "Rheinland-Pfalz"
        ],
        "Ireland": [
            "Cork",
            "Donegal",
            "Limerick",
            "Offaly"
        ],
        "Mexico": [
            "Aguascalientes",
            "Baja California",
            "Chiapas",
            "Chihuahua",
            "Coahuila",
            "Guanajuato",
            "Hidalgo",
            "Jalisco",
            "Mexico City",
            "Mexico State",
            "Michoacán",
            "Morelos",
            "Nuevo León",
            "Quintana Roo",
            "San Luis Potosí",
            "Tamaulipas",
            "Tabasco",
            "Tlaxcala",
            "Veracruz",
            "Yucatán"
        ],
        "Spain": [
            "Barcelona",
            "Girona",
            "Guipuzcoa",
            "Madrid",
            "Vizcaya", // p sure
        ],
        "Switzerland": [
            "Aargau",
            "Basel-Landschaft",
            "Basel-Stadt",
            "Rhône" // this is a river? what?
        ],
        // Countries as their own regions
        "Andorra": ["Andorra"],
        "Australia": ["Australia"],
        "Azerbaijan": ["Azerbaijan"],
        "Bahrain": ["Bahrain"],
        "Belgium": ["Belgium"],
        "Brazil": ["Brazil"],
        "Chile": ["Chile"],
        "Colombia": ["Colombia"],
        "Egypt": ["Egypt"],
        "Ethiopia": ["Ethiopia"],
        "Finland": ["Finland"],
        "France": ["France"],
        "Ghana": ["Ghana"],
        "Indonesia": ["Indonesia"],
        "Japan": ["Japan"],
        "Jordan": ["Jordan"],
        "Kazakhstan": ["Kazakhstan"],
        "Korea, Republic of": ["Korea, Republic of"],
        "Kuwait": ["Kuwait"],
        "Lebanon": ["Lebanon"],
        "Luxembourg": ["Luxembourg"],
        "Malaysia": ["Malaysia"],
        "Morocco": ["Morocco"],
        "New Zealand": ["New Zealand"],
        "Oman": ["Oman"],
        "Panama": ["Panama"],
        "Paraguay": ["Paraguay"],
        "Philippines": ["Philippines"],
        "Qatar": ["Qatar"],
        "Russia": ["Russia"],
        "Saudi Arabia": ["Saudi Arabia"],
        "Singapore": ["Singapore"],
        "Slovakia": ["Slovakia"],
        "Taiwan": ["Taiwan"],
        "Thailand": ["Thailand"],
        "Tunisia": ["Tunisia"],
        "Türkiye": ["Türkiye"],
        "United Arab Emirates": ["United Arab Emirates"],
        "United Kingdom": ["United Kingdom"],
        "Vietnam": ["Vietnam"],
        // Add other countries and their regions if necessary
    };
    // Dynamically determine if the country should be treated as its own region or has specific regions
    if (regions.hasOwnProperty(input)) {
        return regions[input];
    }
    else {
        // Check if input is a region in any of the countries
        for (const countryRegions of Object.values(regions)) {
            if (countryRegions.includes(input)) {
                // Input is a region
                return [input];
            }
        }
        // Input is not recognized as a country or a region in the predefined list
        // Returning input as a potential region or country not explicitly handled
        return [input];
    }
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
    const eventLevel = event.queryStringParameters?.level;
    const allowedParams = ['numberOfEvents', 'start_before', 'start_after', 'status', 'program', 'region', 'level', 'grade'];
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
    // Validate eventLevel
    const validEventLevels = ['Regional', 'National', 'Signature', 'World'];
    if (eventLevel && !validEventLevels.includes(eventLevel)) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Invalid 'level' parameter. Must be one of ['Regional', 'National', 'Signature', 'World']" })
        };
    }
    try {
        let id_array = [];
        if (isOngoingQuery) {
            id_array = await getOngoingEvents(eventCode, eventLevel, eventRegion);
        }
        else if (eventRegion) {
            const regions = await determineRegions(eventRegion);
            if (regions.length > 1) {
                id_array = await getEventsByCountry(regions, startBefore || startAfter, numberOfEvents, eventCode, eventLevel, !!startBefore);
            }
            else {
                id_array = await getEventsByRegion(eventRegion, startBefore || startAfter, numberOfEvents, eventCode, eventLevel, !!startBefore);
            }
        }
        else {
            let lastEvaluatedKey = undefined;
            do {
                const params = buildQueryParams(startBefore || startAfter, numberOfEvents - id_array.length, eventCode, eventLevel, !!startBefore);
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
