# Exo DB Workflow/Reference

## Databases

- All databases are DynamoDB, a noSQL database
- Our databases are fairly large. An important consideration for both minimzing costs and maximizing speed is to minimize scans and maximize querys by optimizing database structure/GSIs.

### event-data

- Database to hold data for all events
- Ideal for querying information to show on a event page
- Structure:
  - Partition-Key: N: id -> event ID
  - Two GSIs:
    - EventsByStartDateIndex
      - Partition Key: gsiPartitionKey -> is set to ALL_EVENTS for every entry
      - Sort Key: start -> event start date
      - This setup allows us to query events sorted by their start date
    - OngoingEventsIndex
      - Partition Key: ongoing (from RobotEvents API this comes as a Boolean, we convert to a string representation because DynamoDB does not support Boolean partition keys)
      - This setup allows us to query events with ongoing=="true"

to connect to ec2:

large:
`ssh -i "/home/amol/keys/ec2-key-1.pem" ubuntu@ec2-44-204-42-176.compute-1.amazonaws.com`
