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
const fetchPage = async (season, desiredPage = 1, regions) => {
    const pageSize = 50;
    // Increase the fetch limit if a region filter is applied to account for filtered items
    const fetchLimit = regions ? pageSize * 5 : pageSize;
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
    if (regions && regions.length > 0) {
        // Construct the filter expression for regions
        const regionFilters = regions.map((_, index) => `#region${index} = :region${index}`).join(' OR ');
        baseParams.FilterExpression = `(${regionFilters})`;
        // Ensure ExpressionAttributeNames is initialized
        baseParams.ExpressionAttributeNames = {};
        // Add each region to the expression attributes
        regions.forEach((region, index) => {
            baseParams.ExpressionAttributeNames[`#region${index}`] = 'region';
            baseParams.ExpressionAttributeValues[`:region${index}`] = region;
        });
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
const determineRegions = async (input) => {
    const regions = {
        // Detailed regions for specific countries
        "United States": [
            "Alabama",
            "Alaska",
            "Arizona",
            "Arkansas",
            "California",
            "Colorado",
            "Connecticut",
            "Delaware",
            "District of Columbia",
            "Florida",
            "Georgia",
            "Hawaii",
            "Idaho",
            "Illinois",
            "Indiana",
            "Iowa",
            "Kansas",
            "Kentucky",
            "Louisiana",
            "Maine",
            "Maryland",
            "Massachusetts",
            "Michigan",
            "Minnesota",
            "Mississippi",
            "Missouri",
            "Montana",
            "Nebraska",
            "Nevada",
            "New Hampshire",
            "New Jersey",
            "New Mexico",
            "New York",
            "North Carolina",
            "North Dakota",
            "Ohio",
            "Oklahoma",
            "Oregon",
            "Pennsylvania",
            "Puerto Rico",
            "Rhode Island",
            "South Carolina",
            "South Dakota",
            "Tennessee",
            "Texas",
            "Utah",
            "Vermont",
            "Virginia",
            "Washington",
            "West Virginia",
            "Wisconsin",
            "Wyoming"
        ],
        "Canada": [
            "Alberta",
            "British Columbia",
            "Manitoba",
            "Ontario",
            "Quebec",
            "Saskatchewan",
        ],
        "China": [
            "Beijing",
            "Fujian",
            "Gansu",
            "Guangdong",
            "Guizhou",
            "Hainan",
            "Hebei",
            "Henan",
            "Hong Kong", // Don't
            "Jiangsu",
            "Jiangxi",
            "Jilin",
            "Macau", // Cancel Me!
            "Shaanxi",
            "Shandong",
            "Shanghai",
            "Sichuan",
            "Tianjin",
            "Zhejiang"
        ],
        "Germany": [
            "Baden-Württemberg",
            "Berlin",
            "Hamburg",
            "Niedersachsen",
            "Nordrhein-Westfalen",
            "Rheinland-Pfalz"
        ],
        "Ireland": [
            "Cork",
            "Donegal",
            "Limerick",
            "Offaly"
        ],
        "Mexico": [
            "Aguascalientes",
            "Baja California",
            "Chiapas",
            "Chihuahua",
            "Coahuila",
            "Guanajuato",
            "Hidalgo",
            "Jalisco",
            "Mexico City",
            "Mexico State",
            "Michoacán",
            "Morelos",
            "Nuevo León",
            "Quintana Roo",
            "San Luis Potosí",
            "Tamaulipas",
            "Tabasco",
            "Tlaxcala",
            "Veracruz",
            "Yucatán"
        ],
        "Spain": [
            "Barcelona",
            "Girona",
            "Guipuzcoa",
            "Madrid",
            "Vizcaya", // p sure
        ],
        "Switzerland": [
            "Aargau",
            "Basel-Landschaft",
            "Basel-Stadt",
            "Rhône" // this is a river? what?
        ],
        // Countries as their own regions
        "Andorra": ["Andorra"],
        "Australia": ["Australia"],
        "Azerbaijan": ["Azerbaijan"],
        "Bahrain": ["Bahrain"],
        "Belgium": ["Belgium"],
        "Brazil": ["Brazil"],
        "Chile": ["Chile"],
        "Colombia": ["Colombia"],
        "Egypt": ["Egypt"],
        "Ethiopia": ["Ethiopia"],
        "Finland": ["Finland"],
        "France": ["France"],
        "Ghana": ["Ghana"],
        "Indonesia": ["Indonesia"],
        "Japan": ["Japan"],
        "Jordan": ["Jordan"],
        "Kazakhstan": ["Kazakhstan"],
        "Korea, Republic of": ["Korea, Republic of"],
        "Kuwait": ["Kuwait"],
        "Lebanon": ["Lebanon"],
        "Luxembourg": ["Luxembourg"],
        "Malaysia": ["Malaysia"],
        "Morocco": ["Morocco"],
        "New Zealand": ["New Zealand"],
        "Oman": ["Oman"],
        "Panama": ["Panama"],
        "Paraguay": ["Paraguay"],
        "Philippines": ["Philippines"],
        "Qatar": ["Qatar"],
        "Russia": ["Russia"],
        "Saudi Arabia": ["Saudi Arabia"],
        "Singapore": ["Singapore"],
        "Slovakia": ["Slovakia"],
        "Taiwan": ["Taiwan"],
        "Thailand": ["Thailand"],
        "Tunisia": ["Tunisia"],
        "Türkiye": ["Türkiye"],
        "United Arab Emirates": ["United Arab Emirates"],
        "United Kingdom": ["United Kingdom"],
        "Vietnam": ["Vietnam"],
        // Add other countries and their regions if necessary
    };
    // Dynamically determine if the country should be treated as its own region or has specific regions
    if (regions.hasOwnProperty(input)) {
        return regions[input];
    }
    else {
        // Check if input is a region in any of the countries
        for (const countryRegions of Object.values(regions)) {
            if (countryRegions.includes(input)) {
                // Input is a region
                return [input];
            }
        }
        // Input is not recognized as a country or a region in the predefined list
        // Returning input as a potential region or country not explicitly handled
        return [input];
    }
};
const handler = async (event) => {
    console.log('Received event:', event);
    const season = Number(event.queryStringParameters?.season) || 181;
    const region = event.queryStringParameters?.region;
    const page = Number(event.queryStringParameters?.page) || 1;
    let regions_array;
    if (region) {
        regions_array = await determineRegions(region);
    }
    try {
        const pageData = await fetchPage(season, page, regions_array);
        if (pageData.length == 0) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify("Error: Page does not exist")
            };
        }
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
