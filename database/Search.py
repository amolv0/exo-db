import requests
import json
import os

def search_opensearch(queryTerm):
    # OpenSearch endpoint
    url = os.getenv('OPENSEARCH_API_URL')
    
    headers = {
        'Content-Type': 'application/json',
    }

    query = {
        "query": {
            "query_string": {
                "query": f"((team_name:\"{queryTerm}\"^8 OR team_name:{queryTerm}*^6 OR team_name:*{queryTerm}*^3 OR team_number:{queryTerm}^10 OR team_number:{queryTerm}*^7 OR team_number:*{queryTerm}*^3.5 AND (team_registered:true^1.5 OR team_registered:false) AND NOT event_name:*) OR ((event_name:\"{queryTerm}\"^6 OR event_name:{queryTerm}*^3 OR event_name:*{queryTerm}*^1.5 AND event_name:*high school*^1.2) AND NOT team_name:* AND (event_name:* AND (event_start:[now-6m TO now+6m] OR event_start:[now-1y TO now+1y]^1.75 OR event_start:[now-2y TO now-1y]^1.5 OR event_start:[now-3y TO now-2y]^1.2 OR event_start:[now-4y TO now-3y]^1.1 OR event_start:[now-5y TO now-4y]^1)))) AND (program:VRC^2.5 OR program:*VRC*^2.5 OR *:* AND NOT program:WORKSHOP)"
            }
        }
    }

    query2 = {
        "query": {
            "function_score": {
            "query": {
                "bool": {
                "should": [
                    {
                    "multi_match": {
                        "query": f"{queryTerm}",
                        "fields": ["team_name^3", "team_number^4", "event_name^3.5"],
                        "type": "best_fields",
                        "fuzziness": "AUTO",
                        "prefix_length": 1
                    }
                    },
                    {
                    "match": {
                        "program": {
                        "query": "VRC",
                        "boost": 2
                        }
                    }
                    },
                    {
                    "match_phrase": {
                        "event_name": {
                        "query": "High School",
                        "boost": 1.1
                        }
                    }
                    }
                ],
                }
            },
            "functions": [
                {
                    "filter": {
                        "term": {
                            "team_registerred": True
                        }
                    },
                    "weight": 1.1
                },
                {
                "gauss": {
                    "event_start": {
                    "origin": "now",
                    "scale": "365d",
                    "offset": "0d",
                    "decay": 0.5
                    }
                }
                },
                {
                "filter": {
                    "match_phrase": {
                    "event_name": "VEX Robotics World Championship"
                    }
                },
                "weight": 2.5
                },
                {
                "filter": {
                    "bool": {
                    "should": [
                        {
                        "match_phrase": {
                            "event_name": "regional"
                        }
                        },
                        {
                        "match_phrase": {
                            "event_name": "state"
                        }
                        },
                        {
                        "match_phrase": {
                            "event_name": "national"
                        }
                        }
                    ]
                    }
                },
                "weight": 1.1
                }
            ],
            "boost_mode": "multiply"
            }
        }
    }





    # Making the POST request
    response = requests.post(url, headers=headers, data=json.dumps(query2))


    if response.status_code == 200:
        results = response.json()
        return results
    else:
        print(f"Failed to query OpenSearch: {response.status_code} - {response.text}")
        return None

# Example usage
queryTerm = "2024 vex"  # This is the programmatically assigned query term
results = search_opensearch(queryTerm)
if results:
    print(json.dumps(results, indent=2))



