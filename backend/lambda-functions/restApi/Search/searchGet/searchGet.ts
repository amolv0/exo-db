import axios from 'axios';
import * as aws4 from 'aws4';

// CORS headers
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Interface for the event parameter
interface LambdaEvent {
    pathParameters: {
        queryTerm?: string;
    }
}

// Interface for the response structure
interface LambdaResponse {
    statusCode: number;
    headers: {};
    body: string;
}


export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
    const queryTerm = event.pathParameters?.queryTerm;

    if (!queryTerm) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Query term is required as a path parameter.' }),
        };
    }

    const host = 'search-team-data-search-xaeptdqqk2djjjmer2bq63eetq.us-east-1.es.amazonaws.com'
    const path = '/_search';
    const service = 'es';
    const region = 'us-east-1';

    const query = {
        "size": 10,
        "query": {
            "query_string": {
                "query": `((team_name:\"${queryTerm}\"^4 OR team_name:${queryTerm}*^3 OR team_name:*${queryTerm}*^1.5 OR team_number:${queryTerm}^5 OR team_number:${queryTerm}*^3.5 OR team_number:*${queryTerm}*^1.75 AND (team_registered:true^1.5 OR team_registered:false) AND NOT event_name:*) OR ((event_name:\"${queryTerm}\"^6 OR event_name:${queryTerm}*^3 OR event_name:*${queryTerm}*^1.5) AND NOT team_name:* AND (event_name:* AND (event_start:[now-1y TO now]^2 OR event_start:[now+1y TO now]^2 OR event_start:[now-2y TO now-1y]^1.5 OR event_start:[now-3y TO now-2y]^1.2 OR event_start:[now-4y TO now-3y]^1.1 OR event_start:[now-5y TO now-4y]^1)))) AND (program:VRC^2 OR program:*VRC*^2 OR *:* AND NOT program:WORKSHOP)`
            }
        }
    };

    // Construct the request object for signing
    let request = {
        host: host,
        method: 'POST',
        path: path,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(query), // Stringify your query payload
        region: region,
        service: service,
    };

    // Sign the request
    aws4.sign(request); // This modifies the `request` object in place

    try {
        const response = await axios({
            method: 'POST', // Set method explicitly
            url: `https://${request.host}${request.path}`, // Construct URL from host and path
            headers: request.headers as Record<string, string>, // Cast headers to match axios expectations
            data: request.body,
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response.data),
        };
    } catch (error) {
        console.error('Error querying OpenSearch:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to query OpenSearch' }),
        };
    }
};