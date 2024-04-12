import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export const handler = async (event: APIGatewayProxyEvent) => {
    console.log('Received event:', event);
    const region = event.queryStringParameters?.region;
    const program = event.queryStringParameters?.program;
    const registered = event.queryStringParameters?.registered;
    let responsesParam = parseInt(event.queryStringParameters?.responses || '100', 10);
    responsesParam = isNaN(responsesParam) ? 100 : responsesParam;
    const maxResponses = Math.min(responsesParam, 500); // Cap at 500, remove later?
    let accumulatedItems = [];
    let lastEvaluatedKey = undefined;

    const baseParams: any = {
        TableName: 'team-data',
        ProjectionExpression: 'id',
        Limit: maxResponses, // Control the number of items per fetch
    };

    let command;

    if (registered === 'any') {
        // When registered=any, do not filter by registered status
        if (region) {
            let queryParams = {
                ...baseParams,
                IndexName: 'RegionRegisteredIndex',
                KeyConditionExpression: '#region = :region',
                ExpressionAttributeNames: { '#region': 'region' },
                ExpressionAttributeValues: { ':region': region },
            };
    
            if (program) {
                queryParams.FilterExpression = '#program = :program';
                queryParams.ExpressionAttributeNames['#program'] = 'program';
                queryParams.ExpressionAttributeValues[':program'] = program; 
            }
    
            command = new QueryCommand(queryParams);
        } else if (program) {
            // If only program is specified, use ProgramRegisteredIndex without registered filter
            command = new QueryCommand({
                ...baseParams,
                IndexName: 'ProgramRegisteredIndex',
                KeyConditionExpression: '#program = :program',
                ExpressionAttributeNames: { '#program': 'program' },
                ExpressionAttributeValues: { ':program': program },
            });
        } else {
            command = new ScanCommand(baseParams);
        }
    } else {
        // Handle cases with specific registered values or when registered is not provided
        const registeredValue = registered === 'false' ? 'false' : 'true';

        if (region) {
            // Use RegionRegisteredIndex to filter by region
            let queryParams = {
                ...baseParams,
                IndexName: 'RegionRegisteredIndex',
                KeyConditionExpression: '#region = :region AND #registered = :registered',
                ExpressionAttributeNames: {
                    '#region': 'region',
                    '#registered': 'registered',
                },
                ExpressionAttributeValues: {
                    ':region': region,
                    ':registered': registeredValue,
                },
            };
        
            if (program) {
                queryParams.FilterExpression = '#program = :program';
                queryParams.ExpressionAttributeNames['#program'] = 'program';
                queryParams.ExpressionAttributeValues[':program'] = program; 
            }
        
            command = new QueryCommand(queryParams);
        } else if (program) {
            command = new QueryCommand({
                ...baseParams,
                IndexName: 'ProgramRegisteredIndex',
                KeyConditionExpression: '#program = :program AND #registered = :registered',
                ExpressionAttributeNames: {
                    '#program': 'program',
                    '#registered': 'registered',
                },
                ExpressionAttributeValues: {
                    ':program': program,
                    ':registered': registeredValue,
                },
            });
        } else {
            // Query using RegisteredIndex with registered filter if no region or program is specified
            command = new QueryCommand({
                ...baseParams,
                IndexName: 'RegisteredIndex',
                KeyConditionExpression: '#registered = :registered',
                ExpressionAttributeNames: { '#registered': 'registered' },
                ExpressionAttributeValues: { ':registered': registeredValue },
            });
        }
    }

    do {
        const response = await docClient.send(command);

        if (response.Items) {
            accumulatedItems.push(...response.Items.map(item => item.id));
        }

        if (accumulatedItems.length >= maxResponses) {
            accumulatedItems = accumulatedItems.slice(0, maxResponses);
            break;
        }

        lastEvaluatedKey = response.LastEvaluatedKey;
        if (command.input) {
            command.input.ExclusiveStartKey = lastEvaluatedKey;
            command.input.Limit = maxResponses - accumulatedItems.length; // Adjust limit for subsequent fetches
        }

    } while (lastEvaluatedKey && accumulatedItems.length < maxResponses);

    return {
        statusCode: 200,
        body: JSON.stringify(accumulatedItems),
        headers
    };
};
