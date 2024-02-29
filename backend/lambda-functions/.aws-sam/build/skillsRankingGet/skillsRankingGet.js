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
const buildSeasonQuery = async (season, type, evaluateKey, fullFetch = false, grade, region, limit = 100) => {
    console.log("building season query");
    const params = {
        TableName: 'skills-ranking-data',
        IndexName: 'SeasonScoreIndex',
        KeyConditionExpression: '#season = :season_val',
        ExpressionAttributeNames: {
            '#season': 'season',
            '#type': 'type'
        },
        ExpressionAttributeValues: {
            ':season_val': season,
            ':type_val': type,
        },
        FilterExpression: '#type = :type_val',
        ScanIndexForward: false,
        Limit: limit
    };
    if (!fullFetch) {
        params.ProjectionExpression = 'team_id, score, #season, event_team_id, #type';
    }
    if (grade) {
        params.FilterExpression += ' AND #team_grade = :team_grade';
        params.ExpressionAttributeNames['#team_grade'] = 'team_grade';
        params.ExpressionAttributeValues[':team_grade'] = grade;
    }
    if (region) {
        params.FilterExpression += ' AND #region = :region';
        params.ExpressionAttributeNames['#region'] = 'region';
        params.ExpressionAttributeValues[':region'] = region;
    }
    if (evaluateKey) {
        params.ExclusiveStartKey = evaluateKey;
    }
    console.log("returning query");
    return params;
};
const fetchPage = async (season, skills_type, desiredPage, grade, region) => {
    const pageSize = 50;
    let items = [];
    let uniqueTeamIds = new Set();
    let lastEvaluatedKey = null;
    let specificEvaluatedKey = null;
    let fullFetch = false;
    let foundTeams = 0;
    const neededTeamsBeforeFullFetch = pageSize * (desiredPage - 1);
    console.log("In fetchpage");
    let done = false;
    if (desiredPage != 1) {
        while (true) {
            console.log("in while loop 1");
            const queryParameters = await buildSeasonQuery(season, skills_type, lastEvaluatedKey, fullFetch, grade, region);
            const command = new lib_dynamodb_1.QueryCommand(queryParameters);
            const response = await docClient.send(command);
            const filteredItems = response.Items || [];
            for (const item of filteredItems) {
                if (!uniqueTeamIds.has(item.team_id)) {
                    uniqueTeamIds.add(item.team_id);
                    foundTeams++;
                    if (foundTeams >= neededTeamsBeforeFullFetch) {
                        done = true;
                        lastEvaluatedKey = response.LastEvaluatedKey;
                        console.log(lastEvaluatedKey);
                        specificEvaluatedKey = {
                            'season': item.season,
                            'score': item.score,
                            'event_team_id': item.event_team_id,
                            'type': item.type
                        };
                        console.log(specificEvaluatedKey);
                        break;
                    }
                }
            }
            if (done) {
                break;
            }
            lastEvaluatedKey = response.LastEvaluatedKey;
        }
    }
    fullFetch = true;
    while (true) {
        console.log("in while loop 2");
        const queryParameters = await buildSeasonQuery(season, skills_type, specificEvaluatedKey, fullFetch, grade, region);
        const command = new lib_dynamodb_1.QueryCommand(queryParameters);
        const response = await docClient.send(command);
        const filteredItems = response.Items || [];
        for (const item of filteredItems) {
            if (!uniqueTeamIds.has(item.team_id)) {
                uniqueTeamIds.add(item.team_id);
                items.push(item);
                if (items.length == pageSize) {
                    return items;
                }
            }
        }
        specificEvaluatedKey = response.LastEvaluatedKey;
    }
    return items;
};
const handler = async (event) => {
    console.log('Received event:', event);
    const event_id = Number(event.queryStringParameters?.eventId);
    const team_id = Number(event.queryStringParameters?.teamId);
    const skills_type = event.queryStringParameters?.type || 'robot';
    const season = Number(event.queryStringParameters?.season);
    const page = Number(event.queryStringParameters?.page) || 1;
    const grade = event.queryStringParameters?.grade;
    const region = event.queryStringParameters?.region;
    // Build query parameters based on event_id, team_id, and skills_type
    let queryParameters;
    if (event_id && team_id) {
        console.log("eventId and teamId found");
        queryParameters = await buildEventTeamQuery(event_id, team_id, skills_type);
    }
    else if (event_id) {
        console.log("eventId found");
        queryParameters = await buildEventQuery(event_id, skills_type);
    }
    else if (team_id) {
        console.log("teamId found");
        queryParameters = await buildTeamQuery(team_id, skills_type, season);
    }
    else if (season) {
        console.log("Season query");
        const result = await fetchPage(season, skills_type, page, grade, region);
        if (skills_type === 'robot') {
            result.sort((a, b) => {
                const scoreA = Number(a.score.N);
                const scoreB = Number(b.score.N);
                const programmingScoreA = a.programming_score ? Number(a.programming_score.N) : 0;
                const programmingScoreB = b.programming_score ? Number(b.programming_score.N) : 0;
                // If scores are equal, sort by programming_score
                if (scoreA === scoreB) {
                    return programmingScoreB - programmingScoreA; // For descending order
                }
                // Otherwise, sort by score
                return scoreB - scoreA; // For descending order
            });
        }
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        };
    }
    let items = [];
    let lastEvaluatedKey = undefined;
    do {
        try {
            queryParameters.ExclusiveStartKey = lastEvaluatedKey;
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
