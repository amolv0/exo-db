import boto3

# Initialize the DynamoDB resource
dynamodb = boto3.resource('dynamodb')

count = 0

def process_awards_for_all_events():
    page = 0
    event_table = dynamodb.Table('event-data')
    scan_kwargs = {}
    while True:
        page += 1
        print(f"Scanned page {page}")
        response = event_table.scan(**scan_kwargs)
        for item in response.get('Items', []):
            process_event_awards(item)
        
        # Check for pagination
        if 'LastEvaluatedKey' in response:
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
        else:
            break

def process_event_awards(event_item):
    global count
    count += 1
    print(f"Processing event: {event_item['id']}. {count} events procesesed")
    awards = event_item.get('awards', [])
    for award in awards:
        process_award(award, event_item)

def process_award(award, event_item):
    team_table = dynamodb.Table('team-data')
    award_table = dynamodb.Table('award-data')
    
    # Process each team winner
    for team_winner in award.get('teamWinners', []):
        team_id = team_winner['team']['id']

        # Retrieve the current awards list for the team
        team_response = team_table.get_item(Key={'id': team_id})
        team_item = team_response.get('Item', {})
        current_awards = team_item.get('awards', [])
        
        # Append the award ID only if it does not already exist in the 'awards' list
        if award['id'] not in current_awards:
            updated_awards = current_awards + [award['id']]
            team_table.update_item(
                Key={'id': team_id},
                UpdateExpression='SET awards = :updated_awards',
                ExpressionAttributeValues={':updated_awards': updated_awards},
            )
    
    # Adjust award object
    adjusted_award = award.copy()
    if 'season' in event_item and 'id' in event_item['season']:
        adjusted_award['season'] = event_item['season']['id']
    if 'program' in event_item:
        adjusted_award['program'] = event_item['program']
    
    # Post to award-data table
    award_table.put_item(Item=adjusted_award)

def process_awards_for_single_event(event_id):
    event_table = dynamodb.Table('event-data')
    response = event_table.get_item(Key={'id': event_id})
    event_item = response.get('Item')
    
    if event_item:
        process_event_awards(event_item)
    else:
        print(f"No event found with ID: {event_id}")

# process_awards_for_single_event(53751)
        
print("Starting process")
# process_awards_for_all_events()
print("Process complete")
        
