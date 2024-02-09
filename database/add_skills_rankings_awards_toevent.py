import boto3
import time
import requests
from botocore.exceptions import ClientError
from decimal import Decimal
import json

# Script to populate event-data table with rankings, awards, and skills data for every event. 
# Run with nohup: nohup python3 -u database/add_skills_rankings_awards_toevent.py > ./logs/output.log 2>&1 &
# Find elapsed time with: ps -p $(pgrep -f database/add_skills_rankings_awards_toevent.py) -o etime=


# Initialize a DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('event-data')
count = 0

API_KEY = 'REDACTED_API_KEY'
headers = {
    'accept': 'application/json',
    'Authorization': f'Bearer {API_KEY}'
}

# Function to make API requests with rate limiting handling
def make_request(url, headers, initial_delay=10, retries=15):
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

# General function to fetch data not bound to a division for an event (skills, awards)
def fetch_event_data(event_id, data_type):
    data = []
    page = 1
    while True:
        base_url = f"https://www.robotevents.com/api/v2/events/{event_id}/{data_type}?page={page}&per_page=250"
        response_json = make_request(base_url, headers)

        if response_json is None:
            print(f"Failed to fetch {data_type} for event {event_id} at page {page}")
            break

        page_data = response_json.get('data', [])
        data.extend(page_data)

        if not response_json.get('meta', {}).get('next_page_url'):
            break  # No more pages to fetch

        page += 1

    return data

# Function to fetch rankings data, which is bound to a division
def fetch_ranking_data(event_id, division_id):
    data = []
    page = 1
    while True:
        base_url = f"https://www.robotevents.com/api/v2/events/{event_id}/divisions/{division_id}/rankings?page={page}&per_page=250"
        # print(base_url)
        response_json = make_request(base_url, headers)

        if response_json is None:
            print(f"Failed to fetch rankings data for event {event_id} in division {division_id} at page {page}")
            break

        page_data = response_json.get('data', [])
        data.extend(page_data)

        if not response_json.get('meta', {}).get('next_page_url'):
            break  # No more pages to fetch

        page += 1

    return data

def convert_floats_to_decimals(obj):
    if isinstance(obj, list):
        for i in range(len(obj)):
            obj[i] = convert_floats_to_decimals(obj[i])
        return obj
    elif isinstance(obj, dict):
        for k in obj:
            obj[k] = convert_floats_to_decimals(obj[k])
        return obj
    elif isinstance(obj, float):
        return Decimal(str(obj))
    else:
        return obj


# Main function to process each event
def process_events():
    done = False
    start_key = None
    page_count = 1
    global count
    while not done:
        scan_kwargs = {
            'ProjectionExpression': 'id',
        }
        if start_key:
            scan_kwargs['ExclusiveStartKey'] = start_key

        response = table.scan(**scan_kwargs)
        events = response.get('Items', [])
        print(f"Processing page {page_count} with {len(events)} events")

        for event in events:
            event_id = event['id']
            event_data = table.get_item(Key={'id': event_id}).get('Item')
            if not event_data:
                # print(f"Event {event_id} not found in DynamoDB.")
                continue

            # Process skills and awards data
            for data_type in ['skills', 'awards']:
                data = fetch_event_data(event_id, data_type)
                event_data[data_type] = data
                # print(f"Updated {data_type} for event {event_id}")

            # Process divisions and their rankings
            if 'divisions' in event_data:
                for division in event_data['divisions']:
                    division_id = division['id']
                    division_rankings = fetch_ranking_data(event_id, division_id)
                    division['rankings'] = division_rankings

            # Convert all floats to Decimals
            event_data = convert_floats_to_decimals(event_data)

            # Update the entire event object in DynamoDB
            try:
                table.put_item(Item=event_data)
                count += 1
                print(f"Successfully updated event {event_id} with all changes. {count} events updated")
            except ClientError as e:
                print(f"Error updating event {event_id} in DynamoDB: {e.response['Error']['Message']}")

        # Check if there are more pages to fetch
        start_key = response.get('LastEvaluatedKey', None)
        done = start_key is None
        page_count += 1

# Main function to process a single event
def process_single_event(event_id):
    try:
        # Fetch the existing event data from DynamoDB
        response = table.get_item(Key={'id': event_id})
    except ClientError as e:
        print(f"Error fetching event {event_id} from DynamoDB: {e.response['Error']['Message']}")
        return

    event = response.get('Item')
    if not event:
        print(f"Event {event_id} not found in DynamoDB.")
        return

    # Process skills and awards data
    for data_type in ['skills', 'awards']:
        data = fetch_event_data(event_id, data_type)
        event[data_type] = data 

    # Process divisions and their rankings
    if 'divisions' in event:
        for division in event['divisions']:
            division_id = division['id']
            division_rankings = fetch_ranking_data(event_id, division_id)
            division['rankings'] = division_rankings  # Store fetched rankings in the division object

    event = convert_floats_to_decimals(event)
    # Update the entire event object in DynamoDB with a single update
    try:
        response = table.put_item(Item=event)  # Using put_item to replace the entire item
        print(f"Successfully updated event {event_id} with all changes.")
    except ClientError as e:
        print(f"Error updating event {event_id} in DynamoDB: {e.response['Error']['Message']}")



# process_single_event(53595)
process_events()