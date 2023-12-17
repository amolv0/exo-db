import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

// Initialize the S3 client
const s3Client = new S3Client({ region: "us-east-1" });

// Initialize DynamoDB Client
const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Initialize the API Gateway Management API client
const apiGwClient = new ApiGatewayManagementApiClient({
    region: "us-east-1",
    endpoint: "https://gruvv52k29.execute-api.us-east-1.amazonaws.com/dev"
});

const getAllConnections = async () => {
    const params = {
        TableName: 'websocket-connections',
    };

    try {
        const data = await docClient.send(new ScanCommand(params));
        return data.Items.map(item => item['connection-id']);
    } catch (error) {
        console.error('Error fetching connections:', error);
        throw error;
    }
};

const getOngoingEvents = async () => {
    const params = {
        TableName: 'event-data', // Replace with your DynamoDB table name
        IndexName: 'OngoingEventsIndex', // Specify the GSI name
        KeyConditionExpression: '#ongoingKey = :ongoingValue',
        ExpressionAttributeNames: {
            '#ongoingKey': 'ongoing', // Use the GSI partition key name
        },
        ExpressionAttributeValues: {
            ':ongoingValue': "true", // Note that this is a string
        },
    };

    try {
        const command = new QueryCommand(params);
        const data = await docClient.send(command);
        return data.Items;
    } catch (error) {
        console.error('Error querying DynamoDB:', error);
        throw error;
    }
};
export const handler = async (event) => {
    const endpoint = "wss://gruvv52k29.execute-api.us-east-1.amazonaws.com/dev/";

    let message = event.body ? JSON.parse(event.body) : {};

    if (message.action === 'ongoingEvents') {
        try {
            const ongoingEvents = await getOngoingEvents();
            const eventIds = ongoingEvents.map(event => event.id);
            console.log('Ongoing Event IDs:', eventIds);

            const postData = JSON.stringify(eventIds);

            // Fetch all active connections
            const connections = await getAllConnections();

            // Send updates to all connections
            await Promise.all(connections.map(connectionId => {
                return apiGwClient.send(new PostToConnectionCommand({
                    ConnectionId: connectionId,
                    Data: postData,
                    Endpoint: endpoint
                }));
            }));

            return { statusCode: 200, body: 'Data sent to all clients' };
        } catch (error) {
            console.error('Error:', error);

            // Error handling...
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Internal Server Error' })
            };
        }
    } else {
        // Handle other actions...
        return { statusCode: 400, body: 'Invalid action' };
    }
};