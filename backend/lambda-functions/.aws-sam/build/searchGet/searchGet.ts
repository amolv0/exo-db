import axios from 'axios';
import * as aws4 from 'aws4';

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
};

interface LambdaEvent {
    pathParameters: {
        queryTerm?: string;
    }
    queryStringParameters: {
      searchType?: string;
    }
}

interface LambdaResponse {
    statusCode: number;
    headers: {};
    body: string;
}


export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
    const queryString = event.pathParameters?.queryTerm;
    const searchType = event.queryStringParameters?.searchType;

    const queryTerm = queryString ? decodeURIComponent(queryString) : null;
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
    let query;
    if (!searchType){
      query = {
          "size": 10,
          "query": {
              "function_score": {
              "query": {
                  "bool": {
                  "should": [
                      {
                      "multi_match": {
                          "query": queryTerm,
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
                          "query": "high school",
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
                              "team_registerred": true
                          }
                      },
                      "weight": 1.1
                  },
                  {
                    "filter": {
                      "range": {
                        "event_start": {
                          "gte": "now-1y",
                          "lte": "now"
                        }
                      }
                    },
                    "weight": 1.1
                  },
                  {
                  "filter": {
                      "match_phrase": {
                      "event_name": "VEX Robotics World Championship"
                      }
                  },
                  "weight": 1.5
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
                    "weight": 1.2
                  }
              ],
              "boost_mode": "multiply"
              }
          }
      }
    } else if(searchType == "event"){
      query  = {
        "size": 10,
        "query": {
          "function_score": {
            "query": {
              "bool": {
                "should": [
                  {
                    "multi_match": {
                      "query": queryTerm,
                      "fields": ["event_name^3.5"],
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
                        "query": "high school",
                        "boost": 1.1
                      }
                    }
                  }
                ],
                "filter": {
                  "exists": {
                    "field": "event_id"
                  }
                }
              }
            },
            "functions": [
              {
                "filter": {
                  "range": {
                    "event_start": {
                      "gte": "now-1y",
                      "lte": "now"
                    }
                  }
                },
                "weight": 1.1
              },
              {
                "filter": {
                  "match_phrase": {
                    "event_name": "VEX Robotics World Championship"
                  }
                },
                "weight": 1.5
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
                "weight": 1.2
              }
            ],
            "boost_mode": "multiply"
          }
        }
      }
    } else if(searchType == "team"){
      query = {
        "size": 10,
        "query": {
          "function_score": {
            "query": {
              "bool": {
                "should": [
                  {
                    "multi_match": {
                      "query": queryTerm,
                      "fields": ["team_name^3", "team_number^4"],
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
                  }
                ],
                "filter": {
                  "exists": {
                    "field": "team_id"
                  }
                }
              }
            },
            "functions": [
              {
                "filter": {
                  "term": {
                    "team_registered": true
                  }
                },
                "weight": 1.1
              }
            ],
            "boost_mode": "multiply"
          }
        }
      }
    } else{
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Search type invalid.' }),
      };
    }
    // Construct the request object for signing
    let request = {
        host: host,
        method: 'POST',
        path: path,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
        region: region,
        service: service, 
    };

    aws4.sign(request);

    try {
        const response = await axios({
            method: 'POST',
            url: `https://${request.host}${request.path}`,
            headers: request.headers as Record<string, string>,
            data: request.body,
        });
        console.log("Success")
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