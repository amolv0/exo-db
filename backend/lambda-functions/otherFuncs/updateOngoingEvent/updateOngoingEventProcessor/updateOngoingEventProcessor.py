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

logging = logging.getLogger()
logging.setLevel("ERROR")

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
event_data_table = dynamodb.Table('event-data')


def make_request_base(url, headers, initial_delay=5, retries = 3):
    for _ in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json()
        elif response.status_code == 429:
            # logging.info(f"Rate limit exceeded when requesting events. Retrying in {initial_delay} seconds...")
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            logging.error(f"Request for events failed with status code: {response.status_code}")
            break

    return []

def fetch_match_data(event_id, base_url):
    division_data = []
    page = 1
    while True:
        url = f"{base_url}?page={page}"
        response = make_request(event_id, url, headers=headers)
        division_data.extend(response['data'])
        if page==response['meta']['last_page']:
            break
        page += 1
    return division_data

def make_request(event_id, url, headers, initial_delay = 5, retries = 3):    
    for _ in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json()
        elif response.status_code == 429:
            # logging.info(f"Rate limit exceeded, Event id: {event_id}. Retrying in {initial_delay} seconds...")
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            logging.error(f"Request failed with status code: {response.status_code}")
            break

    return []

def handler(aws_event, context):
    start_time = time.time()

    for record in aws_event['Records']:
        message = json.loads(record['body'])
        event_id = message['id']
        logging.info(f"Processing event ID: {event_id}")
        event_data = make_request_base(f"https://www.robotevents.com/api/v2/events/{event_id}", headers=headers)
        if event_data is None:
            return {
            'statusCode': 200,
            'body': json.dumps('Process timed out, will be updated in next pass')
        } # requests timed out, just don't do anything and let the next queue message take care of this
    
        # Ensure event_data['divisions'] is a list before proceeding
        if not isinstance(event_data.get('divisions'), list):
            logging.error(f"No divisions found for event ID: {event_id}")
            continue

        for division in event_data['divisions']:
            # logging.info(f"Examining division: {division.get('id')}")
            matches = fetch_match_data(event_id, f"https://www.robotevents.com/api/v2/events/{event_id}/divisions/{division.get('id')}/matches?&per_page=250")
            # Directly update the division dictionary
            division['matches'] = matches  # Update the matches directly

        # Update the divisions attribute in DynamoDB

        item_key = {'id': event_id}
        response = event_data_table.update_item(
            Key=item_key,
            UpdateExpression='SET divisions = :divisionsVal',
            ExpressionAttributeValues={':divisionsVal': event_data['divisions']},
            ReturnValues="UPDATED_NEW"
        )
        # logging.info(f"DynamoDB update response: {response}")

    # logging.info("Process Finished")
    # logging.info(f"Elapsed Time in seconds: {time.time() - start_time}")
    return {
        'statusCode': 200,
        'body': json.dumps('Process Completed Successfully')
    }

# For local testing, remove context param

# test_message = {

#     "Records": [
#         {
#             "body": "{\"id\": 39267}",
#         }
#     ]
# }

# handler(test_message)