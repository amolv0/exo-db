import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB Client
const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const deleteConnection = async (connectionId) => {
    const params = {
        TableName: 'websocket-connections', // Replace with your table name
        Key: {
            'connection-id': connectionId,  // Ensure this matches the primary key name in the DynamoDB table
        }
    };

    try {
        const command = new DeleteCommand(params);
        await docClient.send(command);
        console.log('Connection deleted from DynamoDB');
    } catch (error) {
        console.error('Error deleting connection:', error);
        throw error;
    }
};

export const handler = async (event) => {
    console.log('WebSocket disconnect event:', event);

    const connectionId = event.requestContext.connectionId;

    try {
        await deleteConnection(connectionId);

        return { statusCode: 200, body: 'Disconnected.' };
    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500, body: 'Failed to disconnect.' };
    }
};
