import requests
import json

def search_opensearch(queryTerm):
    # OpenSearch endpoint
    url = 'https://search-team-data-search-xaeptdqqk2djjjmer2bq63eetq.us-east-1.es.amazonaws.com/search-index/_search'
    
    # Headers for the request (adjust if you have additional headers, like authentication)
    headers = {
        'Content-Type': 'application/json',
        # Add authentication headers here if needed
    }
    
    # Constructing the query
    query = {
        "query": {
            "query_string": {
                "query": f"((team_name:\"{queryTerm}\"^8 OR team_name:{queryTerm}*^6 OR team_name:*{queryTerm}*^3 OR team_number:{queryTerm}^10 OR team_number:{queryTerm}*^7 OR team_number:*{queryTerm}*^3.5 AND (team_registered:true^1.5 OR team_registered:false) AND NOT event_name:*) OR ((event_name:\"{queryTerm}\"^6 OR event_name:{queryTerm}*^3 OR event_name:*{queryTerm}*^1.5) AND NOT team_name:* AND (event_name:* AND (event_start:[now-1y TO now]^2 OR event_start:[now+1y TO now]^2 OR event_start:[now-2y TO now-1y]^1.5 OR event_start:[now-3y TO now-2y]^1.2 OR event_start:[now-4y TO now-3y]^1.1 OR event_start:[now-5y TO now-4y]^1)))) AND (program:VRC^2.5 OR program:*VRC*^2.5 OR *:* AND NOT program:WORKSHOP)"
            }
        }
    }

    query2 = {
        "query": {
            "bool": {
                "should": [
                {
                    "bool": {
                    "should": [
                        {"prefix": {"team_name": {"value": "${queryTerm}", "boost": 6}}},
                        {"wildcard": {"team_name": {"value": "*${queryTerm}*", "boost": 3}}},
                        {"match": {"team_number": {"query": "${queryTerm}", "boost": 10}}}
                    ],
                    "filter": [
                        {"bool": {
                        "should": [
                            {"term": {"team_registered": True}},
                            {"term": {"team_registered": False}}
                        ]
                        }}
                    ],
                    "must_not": [
                        {"wildcard": {"event_name": "*"}}
                    ]
                    }
                },
                {
                    "bool": {
                    "should": [
                        {"match_phrase": {"event_name": {"query": "${queryTerm}", "boost": 6}}},
                        {"prefix": {"event_name": {"value": "${queryTerm}", "boost": 3}}},
                        {"wildcard": {"event_name": {"value": "*${queryTerm}*", "boost": 1.5}}}
                    ],
                    "filter": [
                        {"range": {"event_start": {"gte": "now-5y", "lte": "now"}}}
                    ],
                    "must_not": [
                        {"wildcard": {"team_name": "*"}}
                    ]
                    }
                }
                ],
                "filter": [
                {"bool": {
                    "should": [
                    {"term": {"program": "VRC"}},
                    {"wildcard": {"program": {"value": "*VRC*"}}}
                    ],
                    "must_not": [
                    {"term": {"program": "WORKSHOP"}}
                    ]
                }}
                ]
            }
        }
    }




    # Making the POST request
    response = requests.post(url, headers=headers, data=json.dumps(query))

    # Checking the response
    if response.status_code == 200:
        # Parsing the response JSON
        results = response.json()
        # Do something with the results
        return results
    else:
        print(f"Failed to query OpenSearch: {response.status_code} - {response.text}")
        return None

# Example usage
queryTerm = "Washington State High"  # This is the programmatically assigned query term
results = search_opensearch(queryTerm)
if results:
    print(json.dumps(results, indent=2))



