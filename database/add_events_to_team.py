import boto3

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
event_data_table = dynamodb.Table('event-data')
team_data_table = dynamodb.Table('team-data')
count = 0

def process_event_page(events):
    global count
    for event in events:
        count += 1
        event_id = event['id']
        print(f"Processing event {event_id}, {count} events processsed")
        teams = event.get('teams', [])

        for team_id in teams:
            team_response = team_data_table.get_item(Key={'id': team_id})
            team_item = team_response.get('Item', {})

            if 'id' not in team_item:
                team_item['id'] = team_id

            if 'events' not in team_item:
                team_item['events'] = []

            if event_id not in team_item['events']:
                # Include all the required attributes
                team_item['events'].append(event_id)
                team_data_table.put_item(Item=team_item)

def update_team_events_with_event(event_id=None):
    if event_id:
        # Process a single event specified by event_id
        response = event_data_table.get_item(Key={'id': event_id})
        events = [response['Item']] if 'Item' in response else []
        process_event_page(events)
    else:
        # Process all events one page at a time
        page = 0
        scan_kwargs = {}
        done = False
        start_key = None

        while not done:
            page += 1
            print(f"Scanning page {page}")
            if start_key:
                scan_kwargs['ExclusiveStartKey'] = start_key
            response = event_data_table.scan(**scan_kwargs)
            events = response.get('Items', [])

            # Process the current page of events
            process_event_page(events)

            start_key = response.get('LastEvaluatedKey', None)
            done = start_key is None

# For testing with a specific event
# update_team_events_with_event(53751)

# To run for all events

print("Starting process")
update_team_events_with_event(31671)
