import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
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
    const connectionId = event.requestContext.connectionId;
    const endpoint = "wss://gruvv52k29.execute-api.us-east-1.amazonaws.com/dev/";
    
    // Initialize postData
    let postData;

    // Parse the incoming message
    let message = event.body ? JSON.parse(event.body) : {};

    // Check if the action is 'ongoingEvents'
    if (message.action === 'ongoingEvents') {
        try {
            const ongoingEvents = await getOngoingEvents();
            console.log('Ongoing Events:', ongoingEvents);

            postData = JSON.stringify(ongoingEvents);

            // Sending message back to the client
            await apiGwClient.send(new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: postData,
                Endpoint: endpoint,
            }));

            return { statusCode: 200, body: 'Data sent to the client' };
        } catch (error) {
            console.error('Error:', error);

            // Optionally, inform the client in case of an error
            postData = JSON.stringify({ error: 'Failed to query DynamoDB' });
            await apiGwClient.send(new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: postData,
                Endpoint: endpoint,
            }));

            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to query DynamoDB' })
            };
        }
    } else {
        return { statusCode: 400, body: 'Invalid action' };
    }
};
