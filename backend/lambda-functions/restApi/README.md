# REST API Documentation

## Events

Resource Path: `/events`.

Purpose: To handle information regarding events

Operations:

    - GET /events to list events.
    - GET /events/{eventId} to get details of a specific event.
    - POST /events to create a new event. 
    - PUT /events/{eventId} to update an existing event.
    - DELETE /events/{eventId} to delete an event.

### Sub-Resource: Divisions of an Event

Resource Path: `/events/{eventId}/divisions`

Operations:

    - GET /events/{eventId}/divisions: List all divisions for a specific event.
    - GET /events/{eventId}/divisions/{divisionId}: Get details of a specific division within an event.
    - POST /events/{eventId}/divisions: Create a new division for a specific event.
    - PUT /events/{eventId}/divisions/{divisionId}: Update a division within an event.
    - DELETE /events/{eventId}/divisions/{divisionId}: Delete a division from an event.

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