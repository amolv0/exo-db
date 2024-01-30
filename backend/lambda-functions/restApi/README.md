# REST API Documentation

MAKE SURE TO TURN LAMBDA PROXY INTEGRATION ON

Dev API link: `https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev`

## Events

Resource Path: `/events`.

Purpose: To handle information regarding events

Operations:

- GET /events to list events (with pagination)
- GET /events?numberOfEvents={number} to get n most recent events:  ex `https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/events?numberOfEvents=10`
- GET /events?status=ongoing to get all ongoing events: `https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/events?status=ongoing`
- GET /events/{eventId} to get details of a specific event. (including division information): ex `https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/events?eventId=42634` (CHANGE THIS)
- POST /events to create a new event.
- PUT /events/{eventId} to update an existing event.
- DELETE /events/{eventId} to delete an event.

### Sub-Resource: eventId

Resource Path: `/events/{eventId}`

Operations:

- GET /events/{eventId} to get details for a specific event

### Sub-Sub-Resource: divisions

Resource Path: `/events/{eventId}/divisions`

Operations:

- GET /events/{eventId}/divisions to get a list of divisions for a specific event

### Sub-Sub-Sub-Resource: divId

Resource Path: `/events/{eventId}/divisions/{divId}`

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