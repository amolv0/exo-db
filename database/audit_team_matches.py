import boto3

dynamodb = boto3.resource('dynamodb')
event_table = dynamodb.Table('event-data')
team_table = dynamodb.Table('team-data')

def update_team_matches():
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
        

def update_team_matches_for_event(event_id):
    print(f"Processing event {event_id}")
    response = event_table.get_item(Key={'id': event_id})
    event = response.get('Item')
    
    if not event:
        print(f"No event found with ID: {event_id}")
        return

    process_event(event)
    
def process_event(event):
    divisions = event.get('divisions', [])
    for division in divisions:
        matches = division.get('matches', [])
        for match in matches:
            update_teams_in_match(match)

def process_events(events):
    for event in events:
        divisions = event.get('divisions', [])
        for division in divisions:
            matches = division.get('matches', [])
            for match in matches:
                update_teams_in_match(match)

def update_teams_in_match(match):
    match_id = match.get('id')
    alliances = match.get('alliances', [])
    for alliance in alliances:
        teams = alliance.get('teams', [])
        for team in teams:
            team_item = team.get('team')
            team_id = team_item.get('id')
            update_team_match_list(team_id, match_id)

def update_team_match_list(team_id, match_id):
    response = team_table.get_item(Key={'id': team_id})
    team_data = response.get('Item')
    
    if team_data:
        matches = team_data.get('matches', [])
        if match_id not in matches:
            matches.append(match_id)
            team_table.update_item(
                Key={'id': team_id},
                UpdateExpression='SET matches = :val',
                ExpressionAttributeValues={
                    ':val': matches
                }
            )

if __name__ == "__main__":
    update_team_matches()
    # update_team_matches_for_event(54701)
