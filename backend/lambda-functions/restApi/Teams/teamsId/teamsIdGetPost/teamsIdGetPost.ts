import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchGetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
};

interface LambdaEvent {
    httpMethod: string;
    pathParameters?: {
        teamId?: string;
    };
    queryStringParameters?: {
        [key: string]: string; // This allows any key-value pair in queryStringParameters
    };
    body?: string;
}

interface LambdaResponse {
    statusCode: number;
    headers: {};
    body: string;
}

const getTeamDetails = async (query: string, queryType: string): Promise<any> => {
    if(queryType == "id"){
        const numbericTeamId = Number(query);
        const params = {
            TableName: 'team-data',
            KeyConditionExpression: 'id = :teamIdValue',
            ExpressionAttributeValues: {
                ':teamIdValue': numbericTeamId,
            },
        };
        try {
            const command = new QueryCommand(params);
            const result = await docClient.send(command);
            return result.Items;
        } catch (error) {
            console.error('Error fetching team:', error);
            throw error;
        }
    } else if (queryType == "number") {
        console.log(query);
        const params = {
            TableName: 'team-data',
            IndexName: 'TeamNumberIndex',
            KeyConditionExpression: '#teamNumber = :teamNumberValue',
            ExpressionAttributeNames: {
                '#teamNumber': 'number',
            },
            ExpressionAttributeValues: {
                ':teamNumberValue': query,
            },
        };
        try {
            const command = new QueryCommand(params);
            const result = await docClient.send(command);
            return result.Items;
        } catch (error) {
            console.error('Error fetching team data:', error);
            throw error;
        }
    }
}

// Function to get details for multiple teams for a POST request
const getMultipleTeamDetails = async (queries: string[], queryType: string): Promise<any> => {
    if(queryType === 'id'){
        const numericTeamids = queries.map(id => ({ id: Number(id) })); // Convert each teamId to a number if the query is of ids
        const params = {
            RequestItems: {
                'team-data': {
                    Keys: numericTeamids,
                }
            }
        };
        try {
            const command = new BatchGetCommand(params);
            const result = await docClient.send(command);
            return result.Responses?.['team-data'];
        } catch (error) {
            console.error('Error fetching teams:', error);
            throw error;
        }
    } else if(queryType === 'number'){
        try {
            const results: Record<string, any>[] = []; 
            for (let teamNumber of queries) {
                const params = {
                    TableName: 'team-data',
                    IndexName: 'TeamNumberIndex', 
                    KeyConditionExpression: "#num = :numVal", 
                    ExpressionAttributeNames: {
                        "#num": "number" 
                    },
                    ExpressionAttributeValues: {
                        ":numVal": teamNumber 
                    }
                };
                const command = new QueryCommand(params); 
                const result = await docClient.send(command);
                if (result.Items) { 
                    results.push(...result.Items);
                }
            }
            return results;
        } catch (error) {
            console.error('Error fetching teams:', error);
            throw error;
        }
    }
};

// Main Lambda handler function
export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
    console.log('Received event:', event);
    const queryType = event.queryStringParameters?.query_type === 'number' ? "number" : "id";
    const httpMethod = event.httpMethod;

    try {
        if (httpMethod === 'GET') {
            const pathParam = event.pathParameters?.teamId;
            if (pathParam) {
                const teamDetails = await getTeamDetails(pathParam, queryType);
                return {
                    statusCode: 200,
                    headers: headers,
                    body: JSON.stringify(teamDetails),
                };
            } else {
                return {
                    statusCode: 400,
                    headers: headers,
                    body: JSON.stringify({ error: "Team id/number not properly provided through path parameters" }),
                };
            }
        } else if (httpMethod === 'POST') {
            let queries: string[];
            try {
                const parsedBody = JSON.parse(event.body || '[]');
                if (Array.isArray(parsedBody)) {
                    queries = parsedBody;
                } else {
                    return {
                        statusCode: 400,
                        headers: headers,
                        body: JSON.stringify({ error: "Request body is not an array" }),
                    };
                }
            } catch (parseError) {
                console.error('Parsing error:', parseError);
                return {
                    statusCode: 400,
                    headers: headers,
                    body: JSON.stringify({ error: "Failed to parse request body as JSON array" }),
                };
            }
            const teamDetails = await getMultipleTeamDetails(queries, queryType);
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify(teamDetails),
            };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: (error as Error).message || 'Failed to fetch team(s)' }),
        };
    }
    return {
        statusCode: 405,
        headers: headers,
        body: JSON.stringify({ error: "Method Not Allowed" }),
    };
};