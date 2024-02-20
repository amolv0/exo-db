import boto3

## Update match items in event-data table and remove 'events' and 'division' attributes, and then post them all to match-data. 

# Initialize the DynamoDB resource
dynamodb = boto3.resource('dynamodb')
event_table = dynamodb.Table('event-data')
match_table = dynamodb.Table('match-data')

def update_matches_for_all_events():
    page = 0
    count = 0
    scan_kwargs = {}
    while True:
        page += 1
        print(f"Scanning page {page}")
        response = event_table.scan(**scan_kwargs)
        for item in response.get('Items', []):
            count += 1
            print(f"Updating matches for event {item['id']}. {count} events processed")
            update_event_matches(item['id'])
        
        # Check for pagination
        if 'LastEvaluatedKey' in response:
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
        else:
            break

def update_event_matches(event_id):
    event_item = event_table.get_item(Key={'id': event_id}).get('Item')
    if not event_item:
        print(f"No event found with ID: {event_id}")
        return

    divisions = event_item.get('divisions', [])
    for division in divisions:
        matches = division.get('matches', [])
        with match_table.batch_writer() as batch:
            for match in matches:
                # Remove 'event' and 'division' attributes if present
                match.pop('event', None)
                match.pop('division', None)
                # Add the updated match to the batch write
                batch.put_item(Item=match)

    # Update the event item with the modified matches
    event_table.update_item(
        Key={'id': event_id},
        UpdateExpression='SET divisions = :divisions',
        ExpressionAttributeValues={':divisions': divisions}
    )
    # print(f"Matches updated for event ID: {event_id}")

def update_matches_for_single_event(event_id):
    print(f"Starting update for event {event_id}")
    update_event_matches(event_id)
    print(f"Update complete for event {event_id}")

print("Starting process to update matches")

# update_matches_for_single_event(32559)
update_matches_for_all_events()

print("Process to update matches for all events complete")