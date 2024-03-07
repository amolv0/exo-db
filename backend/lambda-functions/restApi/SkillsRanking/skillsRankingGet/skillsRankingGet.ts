import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchGetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { spec } from 'node:test/reporters';

// Initialize DynamoDB Client
const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

// CORS headers
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Interface for Lambda event structure
interface LambdaEvent {
    httpMethod: string;
    queryStringParameters?: {
        eventId?: number;
        teamId?: number;
        type?: string;
        season?: number;
        page?: number;
        grade?: string;
        region?: string;
        country?: string
    };
}

// Interface for the response structure
interface LambdaResponse {
    statusCode: number;
    headers: {};
    body: string;
}

const buildEventQuery = async (event_id: number, type?: string) => {
    const params: any = {
        TableName: 'skills-ranking-data',
        IndexName: 'EventIdScoreIndex',
        KeyConditionExpression: '#event_id = :event_id_val',
        ExpressionAttributeNames: {
            '#event_id': 'event_id',
        },
        ExpressionAttributeValues: {
            ':event_id_val': event_id,
        },
        ScanIndexForward: false,
    };

    // If 'type' is provided, add a filter expression
    if (type) {
        params.FilterExpression = '#type = :type_val';
        params.ExpressionAttributeNames['#type'] = 'type'; 
        params.ExpressionAttributeValues[':type_val'] = type;
    }
    return params;
}


const buildTeamQuery = async (team_id: number, type?: string, season?: number) => {
    const params: any = {
        TableName: 'skills-ranking-data',
        IndexName: 'TeamIdTypeIndex',
        KeyConditionExpression: '#team_id = :team_id_val',
        ExpressionAttributeNames: {
            '#team_id': 'team_id',
        },
        ExpressionAttributeValues: {
            ':team_id_val': team_id,
        },
        ScanIndexForward: false,
    };
    
    // Include 'type' in the KeyConditionExpression if provided
    if (type) {
        params.KeyConditionExpression += ' AND #type = :type_val';
        params.ExpressionAttributeNames['#type'] = 'type';
        params.ExpressionAttributeValues[':type_val'] = type;
    }
    if (season) {
        params.FilterExpression = '#season = :season_val';
        params.ExpressionAttributeNames['#season'] = 'season'; 
        params.ExpressionAttributeValues[':season_val'] = season;
    }
    
    return params;
}

const buildEventTeamQuery = async (event_id: number, team_id: number, type?: string) => {
    const eventTeamId = `${event_id}-${team_id}`;

    const params: any = {
        TableName: 'skills-ranking-data',
        KeyConditionExpression: '#event_team_id = :event_team_val',
        ExpressionAttributeNames: {
            '#event_team_id': 'event_team_id', 
        },
        ExpressionAttributeValues: {
            ':event_team_val': eventTeamId, 
        },
        ScanIndexForward: false, 
    };

    if (type) {
        params.KeyConditionExpression += ' AND #type = :type_val';
        params.ExpressionAttributeNames['#type'] = 'type';
        params.ExpressionAttributeValues[':type_val'] = type; 
    }

    return params;
}

const buildSeasonQuery = async (season: number, type: string, evaluateKey?: any, fullFetch = false, grade?: string, regions?: string[], limit = 100) => {
    // Initialize the basic query parameters
    const params: any = {
        TableName: 'skills-ranking-data',
        IndexName: 'SeasonScoreIndex',
        KeyConditionExpression: '#season = :season_val',
        ExpressionAttributeNames: {
            '#season': 'season',
            '#type': 'type'
        },
        ExpressionAttributeValues: {
            ':season_val': season,
            ':type_val': type,
        },
        FilterExpression: '#type = :type_val',
        ScanIndexForward: false,
        Limit: limit
    };

    if (!fullFetch) {
        params.ProjectionExpression = 'team_id, score, #season, event_team_id, #type';
    }

    if (grade) {
        params.FilterExpression += ' AND #team_grade = :team_grade';
        params.ExpressionAttributeNames['#team_grade'] = 'team_grade'; 
        params.ExpressionAttributeValues[':team_grade'] = grade;
    }
    if (regions && regions.length > 0) {

        const regionFilters = regions.map((_, index) => `#region = :region${index}`).join(' OR ');
        params.FilterExpression += ` AND (${regionFilters})`;


        regions.forEach((region, index) => {
            params.ExpressionAttributeNames[`#region`] = 'region';
            params.ExpressionAttributeValues[`:region${index}`] = region;
        });
    }

    if (evaluateKey) {
        params.ExclusiveStartKey = evaluateKey;
    }

    return params;
};

const fetchPage = async (season: number, skills_type: string, desiredPage: number, grade?: string, region?: string[]) => {
    const pageSize = 50;
    let items = [];
    let uniqueTeamIds = new Set();
    let lastEvaluatedKey = null;
    let specificEvaluatedKey = null;
    let fullFetch = false;
    let foundTeams = 0
    const neededTeamsBeforeFullFetch = pageSize*(desiredPage-1);
    // console.log("In fetchpage");
    let done = false;
    if(desiredPage != 1){
        while (true){
            // console.log("in while loop 1");
            const queryParameters = await buildSeasonQuery(season, skills_type, lastEvaluatedKey, fullFetch, grade, region);
            const command = new QueryCommand(queryParameters);
            const response = await docClient.send(command);
            const filteredItems = response.Items || [];
            lastEvaluatedKey = response.LastEvaluatedKey;
            for (const item of filteredItems){
                if(!uniqueTeamIds.has(item.team_id)){
                    uniqueTeamIds.add(item.team_id);
                    foundTeams++;
                    if (foundTeams >= neededTeamsBeforeFullFetch){
                        done = true;
                        lastEvaluatedKey = response.LastEvaluatedKey;
                        // console.log(lastEvaluatedKey);
                        specificEvaluatedKey = {
                            'season': item.season,
                            'score': item.score,
                            'event_team_id': item.event_team_id,
                            'type': item.type
                        }
                        // console.log(specificEvaluatedKey);
                        break;
                    }
                }
            }
            if(!lastEvaluatedKey){
                break;
            }
            if(done){
                break;
            }
        }
    }
    fullFetch = true;
    while (true){
        // console.log("in while loop 2");
        const queryParameters = await buildSeasonQuery(season, skills_type, specificEvaluatedKey, fullFetch, grade, region);
        const command = new QueryCommand(queryParameters);
        const response = await docClient.send(command);
        const filteredItems = response.Items || [];
        specificEvaluatedKey = response.LastEvaluatedKey

        for (const item of filteredItems){
            if(!uniqueTeamIds.has(item.team_id)){
                uniqueTeamIds.add(item.team_id);
                items.push(item)
                if(items.length == pageSize || !specificEvaluatedKey){
                    return items;
                }
            }
        }
        if(!specificEvaluatedKey){
            break;
        }
    }
    return items;
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
    const event_id = Number(event.queryStringParameters?.eventId);
    const team_id = Number(event.queryStringParameters?.teamId);
    const skills_type = event.queryStringParameters?.type || 'robot';
    const season = Number(event.queryStringParameters?.season);
    const page = Number(event.queryStringParameters?.page) || 1;
    const grade = event.queryStringParameters?.grade;
    const region = event.queryStringParameters?.region;

    let regions_array;

    // Build query parameters based on event_id, team_id, and skills_type
    let queryParameters;

    if(event_id && team_id){
        // console.log("eventId and teamId found");
        queryParameters = await buildEventTeamQuery(event_id, team_id, skills_type)
    } else if(event_id){
        // console.log("eventId found");
        queryParameters = await buildEventQuery(event_id, skills_type);
    } else if(team_id){
        // console.log("teamId found");
        queryParameters = await buildTeamQuery(team_id, skills_type, season)
    } else if(season){
        // console.log("Season query");
        if(region){
            regions_array = await determineRegions(region)
        }
        const result = await fetchPage(season, skills_type, page, grade, regions_array);
        if(result.length == 0){
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify("Error: Page does not exist")
            }
        }
        if(skills_type === 'robot'){
            result.sort((a, b) => {
                const scoreA = Number(a.score);
                const scoreB = Number(b.score);

                const programmingScoreA = a.programming_component ? Number(a.programming_component) : 0;
                const programmingScoreB = b.programming_component ? Number(b.programming_component) : 0;
                // If scores are equal, sort by programming_score
                if (scoreA === scoreB) {
                    return programmingScoreB - programmingScoreA; // For descending order
                }
        
                // Otherwise, sort by score
                return scoreB - scoreA; // For descending order
            });
        }
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        }
    }

    let items: any[] = [];
    let lastEvaluatedKey = undefined;
    do {
        try {
            queryParameters.ExclusiveStartKey = lastEvaluatedKey;
            const command = new QueryCommand(queryParameters);
            const response = await docClient.send(command);
            items = items.concat(response.Items || []);
            lastEvaluatedKey = response.LastEvaluatedKey;
        } catch (error) {
            console.error('Error querying skills-ranking-data:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: "Error fetching data" })
            };
        }
    } while (lastEvaluatedKey)

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(items)
    };
};