import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB Client
const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event) => {
    try {
        console.log('Received WebSocket message:', event);
        // Query the DynamoDB table for events with ongoing == "true"
        const params = {
            TableName: 'event-data', // Replace with your table name
            IndexName: 'OngoingEventsIndex', // Replace with your GSI name if you have one
            KeyConditionExpression: 'ongoing = :ongoing',
            ExpressionAttributeValues: {
                ':ongoing': 'true'
            },
            ProjectionExpression: 'id' // Add this line to specify which attribute(s) to return
        };

        const command = new QueryCommand(params);
        const result = await docClient.send(command);

        // Extract the event IDs from the query result
        const eventIds = result.Items.map(item => item.id);
        console.log(eventIds);
        // Return the list of event IDs as a response
        const response = {
            statusCode: 200,
            body: JSON.stringify(eventIds)
        };
        console.log('Sending WebSocket response:', response);
        return response;
    } catch (error) {
        // Handle any errors gracefully
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
};
