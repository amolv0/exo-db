"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const axios_1 = __importDefault(require("axios"));
const aws4 = __importStar(require("aws4"));
// CORS headers
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
};
const handler = async (event) => {
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
    const host = 'search-team-data-search-xaeptdqqk2djjjmer2bq63eetq.us-east-1.es.amazonaws.com';
    const path = '/_search';
    const service = 'es';
    const region = 'us-east-1';
    let query;
    if (!searchType) {
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
        };
    }
    else if (searchType == "event") {
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
        };
    }
    else if (searchType == "team") {
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
        };
    }
    else {
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
        body: JSON.stringify(query), // Stringify your query payload
        region: region,
        service: service,
    };
    // Sign the request
    aws4.sign(request); // This modifies the `request` object in place
    try {
        const response = await (0, axios_1.default)({
            method: 'POST', // Set method explicitly
            url: `https://${request.host}${request.path}`, // Construct URL from host and path
            headers: request.headers, // Cast headers to match axios expectations
            data: request.body,
        });
        console.log("Success");
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response.data),
        };
    }
    catch (error) {
        console.error('Error querying OpenSearch:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to query OpenSearch' }),
        };
    }
};
exports.handler = handler;
