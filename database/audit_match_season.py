import boto3

dynamodb = boto3.resource('dynamodb')
event_table = dynamodb.Table('event-data')
match_table = dynamodb.Table('match-data')

def update_match_seasons_for_event(event_id):
    response = event_table.get_item(Key={'id': event_id})
    event = response.get('Item')
    
    if not event:
        print(f"No event found with ID: {event_id}")
        return

    process_event(event)
    
def process_event(event):
    season_id = event.get('season', {}).get('id', None)
    if season_id:
        divisions = event.get('divisions', [])
        for division in divisions:
            matches = division.get('matches', [])
            for match in matches:
                match_id = match.get('id')
                update_match_data(match_id, season_id)

def update_match_seasons():
    count = 1
    response = event_table.scan()
    
    while True:
        print(f"Scanning page {count}")
        count += 1
        process_events(response['Items'])
        
        if 'LastEvaluatedKey' in response:
            response = event_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        else:
            break

def process_events(events):
    for event in events:
        season_id = event.get('season', {}).get('id', None)
        if season_id:
            divisions = event.get('divisions', [])
            for division in divisions:
                matches = division.get('matches', [])
                for match in matches:
                    match_id = match.get('id')
                    update_match_data(match_id, season_id)

def update_match_data(match_id, season_id):
    response = match_table.get_item(Key={'id': match_id})
    match_data = response.get('Item')
    

    if not match_data or 'season' not in match_data:
        match_table.update_item(
            Key={'id': match_id},
            UpdateExpression='SET season = :val',
            ExpressionAttributeValues={
                ':val': season_id
            }
        )

if __name__ == "__main__":
    update_match_seasons_for_event(54701)
