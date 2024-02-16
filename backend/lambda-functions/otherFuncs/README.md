# Scheduled Events

## Every 1 hour

updateOngoingAttributeScheduler

- Update the "ongoing" attribute to either make it true or false for all events in an 6 day window, 4 days back and 2 days forward, of the current date.
- Run this every hour to catch the ending of signature events/worlds
- Initially was running every 10 minutes at a 10 day window, was expensive: (~6$ a day?)

## Every 2(0) minutes

updateOngoingEventQueueScheduler

- Send a set of event-ids for currently ongoing="true" events to an SQS queue to be processed by an updater.
- Every event-id sent will then have its matches updated by updateOngoingEventsProcessor.

## Every day (at 3AM EST)

updateFutureEventsEvent

- Update details of all events that have not yet taken place (in the future)
- Primarily to update team sign ups and changes in location, timings, etc.

## Every day (at 1AM EST)

auditTeamData

- Updates team data such as team_name, robot_name, registered value that can change at any time
- Only looks at registered teams, and this process will set registered to false when needed
  - When looking at future events, teams that are registered false but signed up for an event will have registered set to true.

## Every 12 hours

auditOngoing

- Audit every ongoing="true" event to make sure it is really ongoing to make sure the above functions dont drain resources on events that are not really going to be changing in real-time.
