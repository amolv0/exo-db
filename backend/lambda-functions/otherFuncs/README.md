# Scheduled Events

## Every 10 minutes

updateOngoingEventsScheduler

- Update the "ongoing" attribute to either make it true or false for all events in an 10 day window of the current date.
- Run this every 10 minutes to catch the ending of signature events/worlds

## Every 2 minutes

updateOngoingEventQueueScheduler

- Send a set of event-ids for currently ongoing="true" events to an SQS queue to be processed by an updater.
- Every event-id sent will then have its matches updated by updateOngoingEventsProcessor.

## Every day (at 3AM EST)

updateFutureEventsEvent

- Update details of all events that have not yet taken place (in the future)
- Primarily to update team sign ups and changes in location, timings, etc.

## Every 12 hours

auditOngoing

- Audit every ongoing="true" event to make sure it is really ongoing to make sure the above functions dont drain resources on events that are not really going to be changing in real-time.
