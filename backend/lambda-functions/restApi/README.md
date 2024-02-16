# REST API Documentation

MAKE SURE TO TURN LAMBDA PROXY INTEGRATION ON

Dev API link: `EXODB_API_GATEWAY_BASE_URL/dev`

## Events

Resource Path: `/events`.

Purpose: To handle information regarding events

Operations:

- GET /events to list events (with pagination)
- GET /events?numberOfEvents={number} to get n most recent events:  ex `EXODB_API_GATEWAY_BASE_URL/dev/events?numberOfEvents=10`
  - ?program={'program_code} - get n most recent events of a specific program code. (DONE)
  - ?start_after={'start_date'} - get n events that started after {'start_date'} (DONE)
  - ?start_before={'start_date'} - get n events that started before {'start_date'} (DONE)
  - ?status=ongoing to get all ongoing events: `EXODB_API_GATEWAY_BASE_URL/dev/events?status=ongoing`
  - ?region={'region'} to get events from a specific region
- POST /events/ {body: "[{event_id1}, {event_id2}, {event_id3}...]"} to get details for a set of specific events.

### Sub-Resource: eventId

Resource Path: `/events/{eventId}`

Purpose: Handle information regarding a defined set of events.

Operations:

- GET /events/{eventId} to get details for a specific event

### Sub-Sub-Resource: divisions

Resource Path: `/events/{eventId}/divisions`

Purpose: Get information regarding the divisions of a singular event

Operations:

- GET /events/{eventId}/divisions to get data for all divisions for a specific event

### Sub-Sub-Sub-Resource: divId

Resource Path: `/events/{eventId}/divisions/{divId}`

Purpose: Get information regarding a singular division at a singular event.

Operations:

- GET /events/{id}/divisions/{divisionId}: Get details of a specific division within an event

## Teams

Resource Path: `/teams`.

Purpose: To manage information about teams. Return a array of team ids that match the given parameters.

Operations:

- GET /teams to listregistered teams (with limit 500(update to be more maybe?))
  - GET /teams?region={region_name} to get teams from a specific region
  - GET /teams?registered=false to get nonregistered teams or ?registered=any to get registered and unregistered teams. Without inclusion, ?registered=true is defaulted to
  - GET /teams?program={'program_code'} to get teams from a specific program
  - GET /teams?responses={responses_number} to get a variable number of responses that match the given parameters. Defaults to 100, maxes at 500(?).
- POST /teams/ {body: "[{team_id1}, {team_id2}, {team_id3}...]"} to get details for a set of specific teams.

### Sub-Resource: teamId

Resource Path: `/teams/{teamId}`

Purpose: Handle information regarding a defined set of teams.

Operations:

- GET /teams/{teamId} to get details for a specific team

## Matches

Resource Path: `/matches`.

Purpose: To manage information about matches.

Operations:

- POST /matches/ {body: "[{match_id1}, {match_id2}, {match_id3}...]"} to get details for a set of specific matches.

### Sub-Resource: matchId

Resource Path: `/match/{matchid}`

Purpose: Handle information regarding a specific match

Operations:

- GET /matches/{matchId} to get details for a specific match

## Search

Resource Path: `/search`

Purpose: To handle search by providing an endpoint to easily query OpenSearch API

### Sub-Resource {queryTerm}

Resource Path: `/search/{queryTerm}`

Purpose: To handle specific search queries

Operations:

- GET /serach/{searchQuery} to make a specific search query

## Init new typescript API function

npm init -y

npm install --save-dev typescript @types/node

npm install dependencies

npx tsc --init

modify tsconfig.json
