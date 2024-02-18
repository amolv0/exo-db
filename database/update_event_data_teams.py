import requests
import time
import boto3

API_KEY = 'REDACTED_API_KEY'
headers = {
    'accept': 'application/json',
    'Authorization': f'Bearer {API_KEY}'
}
count = 0

def make_request(url, headers, initial_delay=5, retries=15):
    for _ in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json()
        elif response.status_code == 429:  # Rate limit exceeded
            print(f"Rate limit exceeded. Retrying in {initial_delay} seconds...")
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            print(f"Request failed with status code: {response.status_code}")
            return None

    return None

def get_api_teams(event_id):
    base_url = f"https://www.robotevents.com/api/v2/events/{event_id}/teams"
    teams = []
    page = 1

    while True:
        url = f"{base_url}?per_page=250&page={page}"
        data = make_request(url, headers)

        if not data or 'data' not in data:
            break

        teams.extend(data['data'])
        if not data['meta']['next_page_url']:
            break
        page += 1

    return teams

def update_event_teams_in_dynamodb(event_id, dynamodb=None):
    if not dynamodb:
        dynamodb = boto3.resource('dynamodb')

    event_data_table = dynamodb.Table('event-data')
    global count
    count += 1
    # Fetch event item from DynamoDB
    response = event_data_table.get_item(Key={'id': event_id})
    if 'Item' not in response:
        print(f"No event found with ID: {event_id}")
        return

    event_item = response['Item']
    existing_teams = set(event_item.get('teams', []))
    existing_team_numbers = set(event_item.get('team_numbers', []))

    # Fetch teams from API
    api_teams = get_api_teams(event_id)
    new_teams = {team['id'] for team in api_teams if team['id'] not in existing_teams}
    new_team_numbers = {team['number'] for team in api_teams if team['number'] not in existing_team_numbers}

    # Update DynamoDB item if new teams are found
    if new_teams or new_team_numbers:
        updated_teams = list(existing_teams.union(new_teams))
        updated_team_numbers = list(existing_team_numbers.union(new_team_numbers))

        event_data_table.update_item(
            Key={'id': event_id},
            UpdateExpression='SET teams = :teams, team_numbers = :team_numbers',
            ExpressionAttributeValues={
                ':teams': updated_teams,
                ':team_numbers': updated_team_numbers,
            }
        )
        print(f"Updated event {event_id} with new teams: {new_teams} and new team numbers: {new_team_numbers}. Events procesed: {count}")
    else:
        print(f"No new teams to update for event {event_id}. Events Processed: {count}")

def update_all_events(dynamodb=None):
    page = 0
    if not dynamodb:
        dynamodb = boto3.resource('dynamodb')
    event_data_table = dynamodb.Table('event-data')

    # Initialize the scan with no ExclusiveStartKey
    scan_kwargs = {}
    while True:
        page += 1
        print(f"Scanned page {page}")
        response = event_data_table.scan(**scan_kwargs)
        for item in response.get('Items', []):
            event_id = item['id']
            update_event_teams_in_dynamodb(event_id, dynamodb)
            print(f"Processed event {event_id}")

        # Check if there are more items to fetch
        if 'LastEvaluatedKey' in response:
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
        else:
            break  # No more items to fetch, exit the loop

    print("Completed updating all events.")


# update_event_teams_in_dynamodb(31671)
       
update_all_events()
