# REST API Documentation

MAKE SURE TO TURN LAMBDA PROXY INTEGRATION ON

Dev API link: `EXODB_API_GATEWAY_BASE_URL/dev`

## Events

Resource Path: `/events`.

Purpose: To handle information regarding events

Operations:

- GET /events to list events (with pagination)
- GET /events?numberOfEvents={number} to get n most recent events:  ex `EXODB_API_GATEWAY_BASE_URL/dev/events?numberOfEvents=10`
  - ?program={'program_code} - get n most recent events of a specific program code. (TBD)
  - ?start_after={'start_date'} - get n events that started after {'start_date'} (TBD)
  - ?start_before={'start_date'} - get n events that started before {'start_date'} (TBD)
- GET /events?status=ongoing to get all ongoing events: `EXODB_API_GATEWAY_BASE_URL/dev/events?status=ongoing`
- POST /events/ {body: "[{event_id1}, {event_id2}, {event_id3}...]"} to get details for a set of specific events.

### Sub-Resource: eventId

Resource Path: `/events/{eventId}`

Purpose: Handle information regarding a singlular event.

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

Purpose: To manage information about teams participating in the events.

Operations:

- GET /teams to list all teams.
- GET /teams/{teamId} to get details of a specific team.
- POST /teams to add a new team.
- PUT /teams/{teamId} to update a team’s details.
- DELETE /teams/{teamId} to remove a team.

## Regions (TBD, WILL NEED GSIs)

Resource Path: `/regions`.

Purpose: To manage information about events and maybe teams from a specified region

Operations:

- GET /regions to get all regions
- GET /regions/{regionString}/teams to get all teams from a specific region
- GET /regions/{regionString}/events to get all events from a specific region
- (tbd)
