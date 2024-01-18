import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB Client
const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const saveConnection = async (connectionId, domainName, stage) => {
    const params = {
        TableName: 'websocket-connections',
        Item: {
            'connection-id': connectionId, // Corrected key name to match DynamoDB table schema
            DomainName: domainName,
            Stage: stage,
            ConnectedAt: new Date().toISOString()
        }
    };

    try {
        const command = new PutCommand(params);
        await docClient.send(command);
        console.log('Connection saved to DynamoDB');
    } catch (error) {
        console.error('Error saving connection:', error);
        throw error;
    }
};

export const handler = async (event) => {
    console.log('WebSocket connect event:', event);

    const connectionId = event.requestContext.connectionId;
    const domainName = event.requestContext.domainName;
    const stage = event.requestContext.stage; 

    try {
        await saveConnection(connectionId, domainName, stage);

        return { statusCode: 200, body: 'Connected.' };
    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500, body: 'Failed to connect.' };
    }
};
