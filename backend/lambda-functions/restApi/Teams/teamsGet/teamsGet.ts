import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

// Main Lambda handler function
export const handler = async (event: APIGatewayProxyEvent) => {
    console.log('Received event:', event);
    
}