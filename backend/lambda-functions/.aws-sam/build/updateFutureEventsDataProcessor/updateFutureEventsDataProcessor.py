from datetime import datetime, timedelta
from decimal import Decimal
import pytz
import logging
import json
import requests
import time
import boto3
from botocore.exceptions import ClientError

# This lambda function together with UpdateFutureEventsUrlFinder.py is meant to run periodically to iterate through the most recent events and update DynamoDB accordingly. This is meant to update team sign-ups for events logged in the future. Probably do this once a day?
# Events will be updated in real-time when they are 'ongoing' and so updating events in the past should not be required. 

# This lambda function will determine which RobotEvents API URLs need to be checked. It will then pass those URLs to updateFutureEventsUrlFinder.py which will individually check each URL one at a time
# Processing one page of events takes ~10 minutes, meaning processing more than 1 page will go over the Lambda function time limit of 15 minutes
# When a user accesses an event page, the event data will also be updated then. 

# Unique API Key
API_KEY = 'REDACTED_API_KEY'
headers = {
    'accept': 'application/json',
    'Authorization': f'Bearer {API_KEY}'
}

logging = logging.getLogger()
logging.setLevel("INFO")

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
event_data_table = dynamodb.Table('event-data')

def make_request_base(url, headers, initial_delay=5, retries = 5):
    for _ in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json().get('data', [])
        elif response.status_code == 429:
            logging.info(f"Rate limit exceeded when requesting events. Retrying in {initial_delay} seconds...")
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            logging.info(f"Request for events failed with status code: {response.status_code}")
            break

    return []


def make_request(event_id, url, headers, initial_delay = 5, retries = 5):    
    for _ in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json().get('data', [])
        elif response.status_code == 429:
            logging.info(f"Rate limit exceeded, Event id: {event_id}. Retrying in {initial_delay} seconds...")
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            logging.info(f"Request failed with status code: {response.status_code}")
            break

    return []


def get_teams(event_id):
    page = 1
    all_teams = []
    all_team_numbers = []
    while True:
        api_url = f"https://www.robotevents.com/api/v2/events/{event_id}/teams?page={page}&per_page=75"
        teams_data = make_request(event_id, api_url, headers={'Authorization': f'Bearer {API_KEY}'})
        if teams_data:
            team_ids = [team['id'] for team in teams_data]
            team_numbers = [team['number'] for team in teams_data]  # Collecting team numbers
            all_teams.extend(team_ids)
            all_team_numbers.extend(team_numbers)  # Adding team numbers to the list
            last_page = teams_data[0].get('meta', {}).get('last_page', 0)
            if page >= last_page:
                break
            else:
                page += 1
        else:
            break
    return all_teams, all_team_numbers  # Returning both team IDs and team numbers

def get_awards(event_id):
    page = 1
    all_awards = []
    while True:
        api_url = f"https://www.robotevents.com/api/v2/events/{event_id}/awards?page={page}&per_page=75"
        awards_data = make_request(event_id, api_url, headers={'Authorization': f'Bearer {API_KEY}'})
        if awards_data:
            all_awards.extend(awards_data)  # Adding all awards from the current page to the list
            last_page = awards_data[0].get('meta', {}).get('last_page', 0)
            if page >= last_page:
                break
            else:
                page += 1
        else:
            break
    return all_awards  # Returning the compiled list of awards

# DynamoDB functions
    
def convert_values(obj): # Convert floats to decimals and 'ongoing' to a string
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        for key, value in obj.items():
            if key == 'ongoing' and isinstance(value, bool):
                obj[key] = str(value).lower()
            else:
                obj[key] = convert_values(value)
    elif isinstance(obj, list):
        return [convert_values(v) for v in obj]
    return obj



def get_item_from_dynamodb(table, event_id):
    try:
        response = table.get_item(Key={'id': event_id})
        return response.get('Item')
    except ClientError as e:
        logging.error(e.response['Error']['Message'])
        return None

def update_item_in_dynamodb(table, event_id, update_expression, expression_attribute_values):
    try:
        response = table.update_item(
            Key={'id': event_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues="UPDATED_NEW"
        )
        return response
    except ClientError as e:
        logging.error(e.response['Error']['Message'])
        return None

def handler(aws_event, context):
    start_time = time.time()
    for record in aws_event['Records']:
        message = json.loads(record['body'])
        url = message.get('url')
        data = make_request_base(url, headers)

        logging.info(f"{len(data)} Events to process")
        for event in data:
            event_id = event['id']

            # Fetch the current event data from DynamoDB
            current_event_data = get_item_from_dynamodb(event_data_table, event_id)

            # Initialize update flags and update parameters
            update_expression = "SET "
            expression_attribute_values = {}
            updated = False
            
            # Check and update 'teams' and 'team_numbers'
            teams, team_numbers = get_teams(event_id)
            if current_event_data is None or 'teams' not in current_event_data or current_event_data['teams'] != teams:
                update_expression += "teams = :teams, "
                expression_attribute_values[':teams'] = teams
                updated = True

            if current_event_data is None or 'team_numbers' not in current_event_data or current_event_data['team_numbers'] != team_numbers:
                update_expression += "team_numbers = :teamNumbers, "
                expression_attribute_values[':teamNumbers'] = team_numbers
                updated = True

            # Check and update 'awards'
            awards = get_awards(event_id)
            if current_event_data is None or 'awards' not in current_event_data or current_event_data['awards'] != awards:
                update_expression += "awards = :awards, "
                expression_attribute_values[':awards'] = awards
                updated = True

            # Check and update 'divisions' and ensure each division has an empty 'rankings' list
            divisions_changed = False
            if 'divisions' in event:
                for division in event['divisions']:
                    if 'rankings' not in division:
                        division['rankings'] = []  # Ensure each division has an empty 'rankings' list
                        divisions_changed = True  # Mark divisions as changed if any division didn't have 'rankings'

                # Check if divisions have changed compared to what's stored in DynamoDB
                if current_event_data is None or 'divisions' not in current_event_data or current_event_data['divisions'] != event['divisions']:
                    divisions_changed = True

            if divisions_changed:
                update_expression += "divisions = :divisions, "
                expression_attribute_values[':divisions'] = event['divisions']
                updated = True

            # Finalize update expression and perform update if necessary
            if updated:
                update_expression = update_expression.rstrip(", ")  # Remove the trailing comma and space
                
                # Apply convert_values to each value in expression_attribute_values
                expression_attribute_values = {k: convert_values(v) for k, v in expression_attribute_values.items()}

                response = update_item_in_dynamodb(event_data_table, event_id, update_expression, expression_attribute_values)
                if response:
                    logging.info(f"Event id {event_id} successfully updated in DynamoDB.")
                else:
                    logging.info(f"Failed to update event id {event_id} in DynamoDB.")
            else:
                logging.info(f"No updates required for event id {event_id}.")

    logging.info("Process Finished")
    logging.info(f"Elapsed Time in seconds: {time.time() - start_time}")
    return {
        'statusCode': 200,
        'body': json.dumps('Process Completed Successfully')
    }