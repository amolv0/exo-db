from datetime import datetime, timedelta
from decimal import Decimal
import pytz
import logging
import json
import requests
import time
import boto3
from botocore.exceptions import ClientError

# This function, along with updateOngoingEventProcessor, is designed to update any non-league events in real-time.
# This function will poll messages from an SQS queue consisting of event ids that are currently ongoing
# It will then update the dynamoDB table entry for that specific event. It is designed to run quickly and often

# The front-end will then be notified of updates (via websocket?) and be able to display event updates in real-time.
# All events with the 'ongoing' attribute set to true will be iterated over and their data will be posted to dynamodb, including match data. Whenever the table is updated, through dynamodb streams a subscriber will be notified, if the update
# includes the eventid of a event a user is viewing, the websocket will issue an update. 

# Unique API Key
API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiOTY2YjE4YjE1ZDJhODBlYzkwMDQxOTUwZDkyNDdhYTdhZjYwYzU3YWE5MzM3MjkwOGY5YTQzNTQ2ZTJmMmViYmU5NDY3YTc1MWM1OTRlYTMiLCJpYXQiOjE3MDY0MTA1NTMuOTk4MjcxLCJuYmYiOjE3MDY0MTA1NTMuOTk4Mjc0MSwiZXhwIjoyNjUzMTgxNzUzLjk4NjY3LCJzdWIiOiI5MDgzNyIsInNjb3BlcyI6W119.MPjrqYvFXKL667kIuXdJNadoLeTXgLKRxhpIV1ZFX1xBYbUMmTF_XYPInvfbUanDc4jDpzhOjG7e8gL-9BlORPChGMimhii6kTm0aw2CEeHoydB596ZrKnGxk67dzZU9W6zSNq_MYB6Bx04O_GBsAbOaHw5r7f8j4GZ-Eo4OmqDh2Qju54XsExUF4UyJUF2k6q88p6DiFpi-GNqU6RCBb9H2lI1VYJbkBpMdorxnAAjTdIL7fmSoSjgKtq3LaYo8U9wCwaUGXif7BEi11tAGmVv7nSnjCeYmYC0wLgpeTK6yxRrKruz7H8OiKxqUejpR_bbmJwVXmet5xX4mgJlibzglBv9JJA6WEPa1Eqq0FIZaa7htU-WfndJQyWcYxlWlW_29wCAuq9WzslWa5rx-6SAoniLzciVfT0Y37rbMOpAFV_xrvuRwSEfJX8pSC4qMZtS3ORUWagqpFTk3o5_t4HbvExW4f1_1IWf87UXJNoR6mGJNsUWFJWfyKObT-FmnoV2ireip2UMe_WrJ1vtyDq4WBlqmQckhf_rI3b6fva8PyOB00LtFCpknlGYt0RW3VosfpACE8-KYByvg8R6-Jk3xXr-Fu4jO1gyBQCq4ydKE_RP58OaxrCyQoKmTQV-S4XdrHXZ4KZmE3o3Z7hW10bIyzTwJ0dllzDKUa_Bn0Qg'
headers = {
    'accept': 'application/json',
    'Authorization': f'Bearer {API_KEY}'
}

# logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
# logging = logging.getLogger(__name__)


logging = logging.getLogger()
logging.setLevel("INFO")

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
event_data_table = dynamodb.Table('event-data')


def make_request(url, headers, initial_delay=5, retries=3):
    for _ in range(retries):
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 429:
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            logging.error(f"Request failed with status code: {response.status_code}")
            break
    return None

def fetch_event_data(event_id):
    url = f"https://www.robotevents.com/api/v2/events/{event_id}"
    return make_request(url, headers)

def fetch_division_matches(event_id, division_id):
    matches = []
    page = 1
    while True:
        url = f"https://www.robotevents.com/api/v2/events/{event_id}/divisions/{division_id}/matches?page={page}&per_page=250"
        response = make_request(url, headers)
        if response:
            matches.extend(response['data'])
            if page >= response['meta']['last_page']:
                break
            page += 1
        else:
            break
    # logging.info(f"Found {len(matches)} matches")
    return matches

def update_if_changed(event_id, new_data):
    # Read the current event data from DynamoDB
    try:
        response = event_data_table.get_item(Key={'id': event_id})
        current_data = response.get('Item', {})
    except ClientError as e:
        logging.error(e.response['Error']['Message'])
        return

    # Compare and construct update expression
    update_expression = "SET "
    expression_attribute_values = {}
    for key, value in new_data.items():
        if current_data.get(key) != value:
            update_expression += f"{key} = :{key}, "
            expression_attribute_values[f":{key}"] = value

    # Remove trailing comma and space
    update_expression = update_expression.rstrip(', ')

    if expression_attribute_values:
        # Update DynamoDB if there are changes
        try:
            response = event_data_table.update_item(
                Key={'id': event_id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_attribute_values,
                ReturnValues="UPDATED_NEW"
            )
            logging.info(f"Updated event {event_id} with changes.")
        except ClientError as e:
            logging.error(e.response['Error']['Message'])

def handler(event, context):
    for record in event['Records']:
        message = json.loads(record['body'])
        event_id = message['id']
        logging.info(f"Processing event ID: {event_id}")

        # Fetch new event data from the API
        event_data = fetch_event_data(event_id)
        if event_data:
            # logging.info("found event data")
            divisions = event_data.get('divisions', [])
            for division in divisions:
                # logging.info(f"Examining division id {division.get('id')}")
                division_id = division.get('id')
                if division_id:
                    division['matches'] = fetch_division_matches(event_id, division_id)

            # Compare and update DynamoDB if there are changes
            update_if_changed(event_id, {'divisions': divisions})
        else:
            logging.error(f"Failed to fetch data for event ID: {event_id}")

    return {
        'statusCode': 200,
        'body': json.dumps('Process Completed Successfully')
    }

# For local testing, remove context param

# test_message = {

#     "Records": [
#         {
#             "body": "{\"id\": 52538}",
#         }
#     ]
# }

# handler(test_message)