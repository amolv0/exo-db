import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
};

interface LambdaEvent {
    httpMethod: string;
    queryStringParameters?: {
        season: number
        region?: string
        page?: number
    };
}

interface LambdaResponse {
    statusCode: number;
    headers: {};
    body: string;
}

const fetchPage = async (season: number, desiredPage: number = 1, regions?: string[]) => {
    const pageSize = 25;
    // Increase the fetch limit if a region filter is applied to account for filtered items
    const fetchLimit = regions ? pageSize * 5 : pageSize;
    let ExclusiveStartKey: any = undefined;
    const results: any[] = [];
    let totalFetchedItems = 0;

    const baseParams: any = {
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
        const regionFilters = regions.map((_, index) => `#region${index} = :region${index}`).join(' OR ');
        baseParams.FilterExpression = `(${regionFilters})`;
        baseParams.ExpressionAttributeNames = {};
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

        const response = await docClient.send(new QueryCommand(params));

        if (response.Items) {
            for (const item of response.Items) {
                if (itemsToSkip > 0) {
                    itemsToSkip--;
                } else {
                    results.push(item);
                    if (results.length === pageSize) {
                        break;
                    }
                }
            }
        }

        ExclusiveStartKey = response.LastEvaluatedKey;
        itemsFetched += response.Items?.length || 0;
        if (!ExclusiveStartKey || (results.length >= pageSize)) {
            break;
        }
    }

    const pageStartIndex = (desiredPage - 1) * pageSize;
    console.log("Length:", results.length);
    return results;
};

// We should consider making this an external function that is importable
const determineRegions = async (input: string): Promise<string[]> => {
    const regions: { [key: string]: string[] } = {
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
            "Macau",   // Cancel Me!
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
            "Vizcaya",
        ],
    
        "Switzerland": [
            "Aargau",
            "Basel-Landschaft",
            "Basel-Stadt",
            "Rhône"
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
    };

    // Dynamically determine if the country should be treated as its own region or has specific regions
    if (regions.hasOwnProperty(input)) {
        return regions[input];
    } else {
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

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
    console.log('Received event:', event);
    const season = Number(event.queryStringParameters?.season) || 181;
    const region = event.queryStringParameters?.region;
    const page = Number(event.queryStringParameters?.page) || 1;

    let regions_array;
    if(region){
        regions_array = await determineRegions(region)
    }
    try {
        const pageData = await fetchPage(season, page, regions_array);
        if(pageData.length == 0){
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify("Error: Page does not exist")
            }
        }
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: pageData, page, season, region }),
        };
    } catch (error) {
        console.error('Error fetching page data:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};