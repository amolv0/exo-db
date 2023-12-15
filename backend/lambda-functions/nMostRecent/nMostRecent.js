import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

// Initialize the S3 client
const s3Client = new S3Client({ region: "us-east-1" });

// Initialize DynamoDB Client
const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

//AWS.config.update({ region: 'us-east-1' });

const getRecentEvents = async (numberOfEvents) => {
    const params = {
        TableName: 'event-data', // replace with your DynamoDB table name
        IndexName: 'EventsByStartDateGSI', // GSI name
        KeyConditionExpression: '#partition_key = :partition_value',
        ExpressionAttributeNames: {
            '#partition_key': 'gsiPartitionKey', // partition key name used in GSI
            '#id': 'id' // Attribute to project
        },
        ExpressionAttributeValues: {
            ':partition_value': 'ALL_EVENTS', // partition key value
        },
        ProjectionExpression: '#id', // Only return the 'id' attribute
        ScanIndexForward: false, // false for descending order
        Limit: numberOfEvents
    };

    try {
        const command = new QueryCommand(params);
        const data = await docClient.send(command);
        return data.Items;
    } catch (error) {
        console.error('Error fetching recent events:', error);
        throw error;
    }
};

export const handler = async (event) => {
    if (!event.numberOfEvents) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing parameter: numberOfEvents' })
        };
    }

    try {
        const numberOfEvents = parseInt(event.numberOfEvents, 10);
        if (isNaN(numberOfEvents) || numberOfEvents <= 0) {
            throw new Error("Invalid 'numberOfEvents' parameter. Must be a positive number.");
        }

        const recentEvents = await getRecentEvents(numberOfEvents);
        console.log('Recent Events:', recentEvents);
        return {
            statusCode: 200,
            body: JSON.stringify(recentEvents)
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'Failed to fetch recent events' })
        };
    }
};