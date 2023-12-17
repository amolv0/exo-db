import { DynamoDBClient, DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

// Initialize DynamoDB Client
const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Initialize the API Gateway Management API client
const apiGwClient = new ApiGatewayManagementApiClient({
    region: "us-east-1",
    endpoint: "wss://aarnwsrtbl.execute-api.us-east-1.amazonaws.com/dev"
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

const notifyClients = async (message) => {
    const connections = await getAllConnections();
    const postData = JSON.stringify(message);

    // Send updates to all connections
    await Promise.all(connections.map(connectionId => {
        return apiGwClient.send(new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: postData,
            Endpoint: apiGwClient.config.endpoint
        }));
    }));
};

export const handler = async (event) => {
    try {
        for (const record of event.Records) {
            if (record.eventName === 'MODIFY') {
                const oldItem = record.dynamodb.OldImage;
                const newItem = record.dynamodb.NewImage;

                // Check if 'ongoing' attribute changed
                if (oldItem.ongoing.BOOL !== newItem.ongoing.BOOL) {
                    console.log(`Ongoing attribute changed for item with id: ${newItem.id.S}`);
                    // Notify clients about the change
                    await notifyClients({ action: 'ongoingUpdate', eventId: newItem.id.S, ongoing: newItem.ongoing.BOOL });
                }
            }
        }
    } catch (error) {
        console.error('Error processing DynamoDB Stream:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }

    return { statusCode: 200, body: 'Stream processed successfully' };
};
