from datetime import datetime, timedelta
from decimal import Decimal
import pytz
import logging
import json
import requests
import time
import boto3
from botocore.exceptions import ClientError


# This lambda function is meant to run periodically to iterate through the most recent events and update DynamoDB accordingly. This is meant to update team sign-ups for events logged in the future
# Events will be updated in real-time when they are 'ongoing' and so updating events in the past should not be required. 

# Unique API Key
API_KEY = 'REDACTED_API_KEY'
headers = {
    'accept': 'application/json',
    'Authorization': f'Bearer {API_KEY}'
}

logging.basicConfig(level=logging.INFO)
logging.basicConfig(level=logging.ERROR)

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
event_data_table = dynamodb.Table('event-data')

def make_request_base(url, headers, initial_delay=5, retries = 5):
    for _ in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json().get('data', [])
        elif response.status_code == 429:
            print(f"Rate limit exceeded. Retrying in {initial_delay} seconds...")
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            print(f"Request failed with status code: {response.status_code}")
            break

    return []


def make_request(event_id, url, headers, initial_delay = 5, retries = 5):    
    for _ in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json().get('data', [])
        elif response.status_code == 429:
            print(f"Rate limit exceeded, Event id: {event_id}. Retrying in {initial_delay} seconds...")
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            print(f"Request failed with status code: {response.status_code}")
            break

    return []


def get_teams(event_id):
    page = 1
    all_teams = []
    while True:
        api_url = f"https://www.robotevents.com/api/v2/events/{event_id}/teams?page={page}&per_page=250"
        teams_data = make_request(event_id, api_url, headers={'Authorization': f'Bearer {API_KEY}'})
        if teams_data:
            team_ids = [team['id'] for team in teams_data]
            all_teams.extend(team_ids)
            last_page = teams_data[0].get('meta', {}).get('last_page', 0)
            if page >= last_page:
                break
            else:
                page += 1
        else:
            break
    return all_teams

def get_last_page(time_to_check, initial_delay=5, retries=5):
    for _ in range(retries):
        response = requests.get(f"https://www.robotevents.com/api/v2/events?start={time_to_check}&page=1&per_page=250", headers=headers)

        if response.status_code == 200:
            return response.json().get('meta', [])['last_page']
        elif response.status_code == 429:
            print(f"Rate limit exceeded. Retrying in {initial_delay} seconds...")
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            print(time_to_check)
            print(f"Request failed with status code: {response.status_code}")
            break
    return -1



# DynamoDB functions

def put_item_in_dynamodb(table, item_data):
    item_data = convert_values(item_data)
    try:
        response = table.put_item(Item=item_data)
        return response
    except ClientError as e:
        print(e.response['Error']['Message'])
        return None
    
def convert_values(obj): # Convert floats to decimals and 'ongoing' to a string
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        for key, value in obj.items():
            if key == 'ongoing' and isinstance(value, bool):
                obj[key] = str(value)
            else:
                obj[key] = convert_values(value)
    elif isinstance(obj, list):
        return [convert_values(v) for v in obj]
    return obj

def handler(aws_event, context):
    current_utc_datetime = datetime.now(pytz.utc)
    time_to_check = (current_utc_datetime - timedelta(hours=2)).strftime('%Y-%m-%dT%H:%M:%SZ') # get 2 hours prior to the function being called
    last_page = get_last_page(time_to_check)

    if(last_page == -1): # this indicates a rate limit that isnt resolved through delays, shouldnt happen
        return
    combined_data = []
    for i in range(1, last_page+1): # Iterate through every event that starts after the current time (minus 2 hours)
        url = f'https://www.robotevents.com/api/v2/events?start={time_to_check}&page={i}&per_page=250' #250 is the max to show per page
        print(f"Got events page {i}")
        data = make_request_base(url, headers)
        combined_data += data
    

    
    for event in combined_data:
        event_id = event['id']
        # Do not add matches, these events are in the future and should have no associated matches
        # Add teams to events, do this for all events
        event['teams'] = get_teams(event_id)

        # Add GSI partition key (used for sorting by start date)
        event['gsiPartitionKey'] = "ALL_EVENTS"

        # Post to DynamoDB. DynamoDB automatically updates the item if it already exists, otherwise will create a new entry
        response = put_item_in_dynamodb(event_data_table, event)
        if response:
            logging.info(f"Event id {event_id} successfully posted to DynamoDB")
            print(f"Event id {event_id} successfully posted to DynamoDB")
        else:
            logging.info(f"Event id {event_id} failed to post DynamoDB")
            print(f"Event id {event_id} failed to post to DynamoDB")

    print("Process finished")
    logging.info("Process Finished")
    return {
        'statusCode': 200,
        'body': json.dumps('Process Completed Successfully')
    }
    
if __name__ == "__main__":
    main()
    
