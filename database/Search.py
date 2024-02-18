import requests
import json

def search_opensearch(query_term):
    # OpenSearch endpoint
    url = 'OPENSEARCH_API_ENDPOINT/_search'
    
    # Headers for the request (adjust if you have additional headers, like authentication)
    headers = {
        'Content-Type': 'application/json',
        # Add authentication headers here if needed
    }
    
    # Constructing the query
    query = {
        "query": {
            "query_string": {
                "query": f"((team_name:\"{query_term}\"^4 OR team_name:{query_term}*^3 OR team_name:*{query_term}*^1.5 OR team_number:{query_term}^5 OR team_number:{query_term}*^3.5 OR team_number:*{query_term}*^1.75 AND (team_registered:true^1.5 OR team_registered:false) AND NOT event_name:*) OR ((event_name:\"{query_term}\"^6 OR event_name:{query_term}*^3 OR event_name:*{query_term}*^1.5) AND NOT team_name:* AND (event_name:* AND (event_start:[now-1y TO now]^2 OR event_start:[now+1y TO now]^2 OR event_start:[now-2y TO now-1y]^1.5 OR event_start:[now-3y TO now-2y]^1.2 OR event_start:[now-4y TO now-3y]^1.1 OR event_start:[now-5y TO now-4y]^1)))) AND (program:VRC^2 OR program:*VRC*^2 OR *:* AND NOT program:WORKSHOP)"
            }
        }
    }

    query2 = {
        "query": {
            "bool": {
                "should": [
                    {
                        "match_phrase_prefix": {
                            "event_name": f"{query_term}"
                        }
                    }
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
query_term = "EXODK"  # This is the programmatically assigned query term
results = search_opensearch(query_term)
if results:
    print(json.dumps(results, indent=2))



