"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
// Initialize DynamoDB Client
const ddbClient = new client_dynamodb_1.DynamoDBClient({ region: 'us-east-1' });
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(ddbClient);
// CORS headers
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
};
const fetchPage = async (season, desiredPage = 1, region) => {
    const pageSize = 50;
    // Increase the fetch limit if a region filter is applied to account for filtered items
    const fetchLimit = region ? pageSize * 5 : pageSize;
    let ExclusiveStartKey = undefined;
    const results = [];
    let totalFetchedItems = 0; // Total fetched items that match the filter
    const baseParams = {
        TableName: "trueskill-rankings",
        IndexName: "SeasonMuIndex",
        KeyConditionExpression: "season = :s",
        ExpressionAttributeValues: {
            ":s": season,
        },
        ScanIndexForward: false,
        Limit: fetchLimit,
    };
    if (region) {
        baseParams.FilterExpression = "#region = :r";
        baseParams.ExpressionAttributeValues[":r"] = region;
        baseParams.ExpressionAttributeNames = { "#region": "region" };
    }
    let itemsToSkip = (desiredPage - 1) * pageSize;
    console.log("Items to skip", itemsToSkip);
    let itemsFetched = 0;
    while (results.length < pageSize * desiredPage) {
        const params = { ...baseParams, ExclusiveStartKey };
        const response = await docClient.send(new lib_dynamodb_1.QueryCommand(params));
        if (response.Items) {
            for (const item of response.Items) {
                if (itemsToSkip > 0) {
                    // Skip items until reaching the start of the desired page
                    itemsToSkip--;
                }
                else {
                    // Start adding items to the results once the correct offset is reached
                    results.push(item);
                    if (results.length === pageSize) {
                        // Stop if the page is filled
                        break;
                    }
                }
            }
        }
        ExclusiveStartKey = response.LastEvaluatedKey;
        itemsFetched += response.Items?.length || 0;
        // Break the loop if there are no more items to fetch or we've already collected enough items
        if (!ExclusiveStartKey || (results.length >= pageSize)) {
            break;
        }
    }
    // Return only the items for the desired page
    const pageStartIndex = (desiredPage - 1) * pageSize;
    console.log("Length:", results.length);
    return results;
};
const handler = async (event) => {
    console.log('Received event:', event);
    const season = Number(event.queryStringParameters?.season) || 181;
    const region = event.queryStringParameters?.region;
    const page = Number(event.queryStringParameters?.page) || 1;
    try {
        const pageData = await fetchPage(season, page, region);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: pageData, page, season, region }),
        };
    }
    catch (error) {
        console.error('Error fetching page data:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};
exports.handler = handler;
