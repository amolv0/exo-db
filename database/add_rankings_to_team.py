import boto3

## Add rankings from event-data to team-data as IDs. 


# Initialize the DynamoDB resource
dynamodb = boto3.resource('dynamodb')



def process_rankings_for_all_events():
    page = 0
    count = 0
    event_table = dynamodb.Table('event-data')
    scan_kwargs = {}
    while True:
        page += 1
        print(f"Scanning page {page}")
        response = event_table.scan(**scan_kwargs)
        for item in response.get('Items', []):
            count += 1
            print(f"Processing event {item['id']}. {count} events processed")
            process_event_rankings(item)
        
        # Check for pagination
        if 'LastEvaluatedKey' in response:
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
        else:
            break

def process_event_rankings(event_item):
    divisions = event_item.get('divisions', [])
    for division in divisions:
        rankings = division.get('rankings', [])
        for ranking in rankings:
            process_ranking(ranking)

def process_ranking(ranking):
    team_table = dynamodb.Table('team-data')
    rankings_table = dynamodb.Table('rankings-data')
    
    # Process each team in the ranking
    team_id = ranking['team']['id']
    
    # Update team-data table
    response = team_table.get_item(Key={'id': team_id})
    team_item = response.get('Item', {})
    current_rankings = team_item.get('rankings', [])
    
    # Append the ranking ID only if it does not already exist in the 'rankings' list
    if ranking['id'] not in current_rankings:
        updated_rankings = current_rankings + [ranking['id']]
        team_table.update_item(
            Key={'id': team_id},
            UpdateExpression='SET rankings = :updated_rankings',
            ExpressionAttributeValues={':updated_rankings': updated_rankings},
        )
    
    # Post to rankings-data table
    # rankings_table.put_item(Item=ranking)

def process_rankings_for_single_event(event_id):
    event_table = dynamodb.Table('event-data')
    response = event_table.get_item(Key={'id': event_id})
    event_item = response.get('Item')
    
    if event_item:
        process_event_rankings(event_item)
    else:
        print(f"No event found with ID: {event_id}")

print("Starting process")
# process_rankings_for_single_event(43321)
process_rankings_for_all_events()
print("Process complete")
