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
const buildEventQuery = async (event_id, type) => {
    const params = {
        TableName: 'skills-ranking-data',
        IndexName: 'EventIdScoreIndex',
        KeyConditionExpression: '#event_id = :event_id_val',
        ExpressionAttributeNames: {
            '#event_id': 'event_id',
        },
        ExpressionAttributeValues: {
            ':event_id_val': event_id,
        },
        ScanIndexForward: false,
    };
    // If 'type' is provided, add a filter expression
    if (type) {
        params.FilterExpression = '#type = :type_val';
        params.ExpressionAttributeNames['#type'] = 'type';
        params.ExpressionAttributeValues[':type_val'] = type;
    }
    return params;
};
const buildTeamQuery = async (team_id, type, season) => {
    const params = {
        TableName: 'skills-ranking-data',
        IndexName: 'TeamIdTypeIndex',
        KeyConditionExpression: '#team_id = :team_id_val',
        ExpressionAttributeNames: {
            '#team_id': 'team_id',
        },
        ExpressionAttributeValues: {
            ':team_id_val': team_id,
        },
        ScanIndexForward: false,
    };
    // Include 'type' in the KeyConditionExpression if provided
    if (type) {
        params.KeyConditionExpression += ' AND #type = :type_val';
        params.ExpressionAttributeNames['#type'] = 'type';
        params.ExpressionAttributeValues[':type_val'] = type;
    }
    if (season) {
        params.FilterExpression = '#season = :season_val';
        params.ExpressionAttributeNames['#season'] = 'season';
        params.ExpressionAttributeValues[':season_val'] = season;
    }
    return params;
};
const buildEventTeamQuery = async (event_id, team_id, type) => {
    const eventTeamId = `${event_id}-${team_id}`;
    const params = {
        TableName: 'skills-ranking-data',
        KeyConditionExpression: '#event_team_id = :event_team_val',
        ExpressionAttributeNames: {
            '#event_team_id': 'event_team_id',
        },
        ExpressionAttributeValues: {
            ':event_team_val': eventTeamId,
        },
        ScanIndexForward: false,
    };
    if (type) {
        params.KeyConditionExpression += ' AND #type = :type_val';
        params.ExpressionAttributeNames['#type'] = 'type';
        params.ExpressionAttributeValues[':type_val'] = type;
    }
    return params;
};
const buildSeasonQuery = (season, type, lastEvaluatedKey) => {
    const params = {
        TableName: 'skills-ranking-data',
        IndexName: 'SeasonScoreIndex',
        KeyConditionExpression: '#season = :season_val',
        ExpressionAttributeNames: {
            '#season': 'season',
        },
        ExpressionAttributeValues: {
            ':season_val': season,
        },
        ScanIndexForward: false,
    };
    if (type) {
        params.FilterExpression = '#type = :type_val';
        params.ExpressionAttributeNames['#type'] = 'type';
        params.ExpressionAttributeValues[':type_val'] = type;
    }
    if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
    }
    return params;
};
const handler = async (event) => {
    console.log('Received event:', event);
    const event_id = parseInt(event.queryStringParameters?.eventId);
    const team_id = parseInt(event.queryStringParameters?.teamId);
    const skills_type = event.queryStringParameters?.type;
    const season = parseInt(event.queryStringParameters?.season);
    const number_of_responses = parseInt(event.queryStringParameters?.responses || '100');
    // Build query parameters based on event_id, team_id, and skills_type
    let queryParameters;
    let items = [];
    let lastEvaluatedKey = undefined;
    if (event_id && team_id) {
        queryParameters = await buildEventTeamQuery(event_id, team_id, skills_type);
    }
    else if (event_id) {
        console.log("doing event query");
        queryParameters = await buildEventQuery(event_id, skills_type);
    }
    else if (team_id) {
        console.log("doing team query");
        queryParameters = await buildTeamQuery(team_id, skills_type, season);
    }
    else if (season) {
        console.log("doing season query");
        // Get the 'numberOfResponses' of top global skills rankings
        queryParameters = await buildSeasonQuery(season, skills_type, lastEvaluatedKey);
        let accumulatedResponses = 0;
        do {
            try {
                const command = new lib_dynamodb_1.QueryCommand(queryParameters);
                const response = await docClient.send(command);
                const filteredItems = response.Items || [];
                accumulatedResponses += filteredItems.length;
                items = items.concat(filteredItems);
                if (accumulatedResponses >= number_of_responses) {
                    items = items.slice(0, number_of_responses);
                    break;
                }
                lastEvaluatedKey = response.LastEvaluatedKey;
            }
            catch (error) {
                console.error("Error querying data:", error);
                throw error;
            }
        } while (lastEvaluatedKey && accumulatedResponses < number_of_responses);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(items)
        };
    }
    else {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "A required paramter is not set. Either eventId, teamId, or season MUST be included" })
        };
    }
    do {
        try {
            const command = new lib_dynamodb_1.QueryCommand(queryParameters);
            const response = await docClient.send(command);
            items = items.concat(response.Items || []);
            lastEvaluatedKey = response.LastEvaluatedKey;
        }
        catch (error) {
            console.error('Error querying skills-ranking-data:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: "Error fetching data" })
            };
        }
    } while (lastEvaluatedKey);
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(items)
    };
};
exports.handler = handler;
