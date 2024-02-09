import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchGetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB Client
const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);



// CORS headers
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
};

const getTeamDetails = async (query: string, queryType: string): Promise<any> => {
    if(queryType == "id"){
        const numbericTeamId = Number(query); // Convert teamId to a Number
        const params = {
            TableName: 'team-data',
            KeyConditionExpression: 'id = :teamIdValue',
            ExpressionAttributeValues: {
                ':teamIdValue': numbericTeamId, // Use numbericTeamId here
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
                    Keys: numericTeamids, // Use numericEventIds here
                }
            }
        };
        try {
            const command = new BatchGetCommand(params);
            const result = await docClient.send(command);
            return result.Responses?.['event-data'];
        } catch (error) {
            console.error('Error fetching teams:', error);
            throw error;
        }
    } else{
        const numericTeamids = queries.map(number => ({ number: number }));
        const params = {
            RequestItems: {
                'team-data': {
                    Keys: numericTeamids, // Use numericEventIds here
                }
            }
        };
        try {
            const command = new BatchGetCommand(params);
            const result = await docClient.send(command);
            return result.Responses?.['event-data'];
        } catch (error) {
            console.error('Error fetching teams:', error);
            throw error;
        }
    }
};

// Main Lambda handler function
export const handler = async (event: APIGatewayProxyEvent) => {
    console.log('Received event:', event);
    const queryType = event.queryStringParameters?.query_type === 'number' ? "number" : "id";
    const httpMethod = event.httpMethod;

    try {
        if(httpMethod === 'GET'){
            const pathParam = event.pathParameters?.teamId;
            if (pathParam) {
                const teamDetails = await getTeamDetails(pathParam, queryType);
                return {
                    statusCode: 200,
                    headers: headers,
                    body: JSON.stringify(teamDetails)
                };
            } else {
                throw new Error("Team id/number not properly provided through path parameters");
            }
        } else if(httpMethod === 'POST'){
            let queries: string[];
            // Parse the JSON string from the request body
            try {
                const parsedBody = JSON.parse(event.body || '[]');
                if (Array.isArray(parsedBody)) {
                    queries = parsedBody;
                } else {
                    throw new Error("Request body is not an array");
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
            body: JSON.stringify({ error: (error as Error).message || 'Failed to fetch team(s)' })
        };
    }
}