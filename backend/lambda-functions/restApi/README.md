# REST API Documentation

MAKE SURE TO TURN LAMBDA PROXY INTEGRATION ON

Dev API link: `https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev`

## Events

Resource Path: `/events`.

Purpose: To handle information regarding events

Operations:

- GET /events to list events (with pagination)
- GET /events?numberOfEvents={number} to get n most recent events:  ex `https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/events?numberOfEvents=10`
  - ?program={'program_code} - get n most recent events of a specific program code. (DONE)
  - ?start_after={'start_date'} - get n events that started after {'start_date'} (DONE)
  - ?start_before={'start_date'} - get n events that started before {'start_date'} (DONE)
  - ?status=ongoing to get all ongoing events: `https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/events?status=ongoing`
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

## Teams (IN PROGRESS)

Resource Path: `/teams`.

Purpose: To manage information about teams participating in the events.

Operations:

- GET /teams to list teams (with pagination)
- POST /teams/ {body: "[{team_id1}, {team_id2}, {team_id3}...]"} to get details for a set of specific teamss.

### Sub-Resource: teamId

Resource Path: `/teams/{teamId}`

Purpose: Handle information regarding a defined set of teams.

Operations:

- GET /teams/{teamId} to get details for a specific team

## Init new typescript API

npm init -y

npm install --save-dev typescript @types/node

npm install dependencies

npx tsc --init

modify tsconfig.json
