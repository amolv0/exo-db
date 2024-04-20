from datetime import datetime, timedelta
from decimal import Decimal
import pytz
import logging
import json
import requests
import time
import boto3
import os
from botocore.exceptions import ClientError

# This lambda function is meant to periodically check events in a start/end date range based on the current date. It is meant to make currently running events that were not previously recorded as ongoing that have become ongoing
# since recorded properly and vice-versa. This function is meant to run periodically but more often than the updateFutureEvents func which runs once a day, as a result it must look at as small a window of events as possible. 
# To account for multi-day competitions (worlds, sigs) it is currently set to an 8 day window. In most cases, this is less than 500 events (so only 2 pages). It should only need as many API calls as pages,
# because ongoing is referenced directly in the events call and not events/{eventId} through RobotEvents. 

# The logic after determining the windowed URL is similar to updateFutureEventsDataProcessor, but is reimplemented to keep issues like overqueueing that function and to maintain seperate RobotEvents API keys for 
# seperate uses. 


API_KEY = os.getenv('API_KEY')
headers = {
    'accept': 'application/json',
    'Authorization': f'Bearer {API_KEY}'
}

logging = logging.getLogger()
logging.setLevel("INFO")

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
event_data_table = dynamodb.Table('event-data')
updates = 0

def make_request(url, headers, initial_delay=5, retries = 5):
    for _ in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response
        elif response.status_code == 429:
            logging.info(f"Rate limit exceeded when requesting events. Retrying in {initial_delay} seconds...")
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            logging.info(f"Request for events failed with status code: {response.status_code}")
            break

    return []

# DynamoDB functions
    
def update_ongoing_attribute_if_changed(table, event):
    global updates
    event_id = event['id']
    new_ongoing_value = str(event['ongoing']).lower()  # Convert ongoing to a lowercase string
    
    # First, fetch the existing item from DynamoDB
    try:
        response = table.get_item(Key={'id': event_id})
        if 'Item' in response:
            current_ongoing_value = str(response['Item'].get('ongoing', '')).lower()
            # Proceed with the update only if the ongoing attribute differs
            if current_ongoing_value != new_ongoing_value:
                update_expression = 'SET #ongoing = :new_value'
                expression_attribute_names = {'#ongoing': 'ongoing'}
                expression_attribute_values = {':new_value': new_ongoing_value}
                update_response = table.update_item(
                    Key={'id': event_id},
                    UpdateExpression=update_expression,
                    ExpressionAttributeNames=expression_attribute_names,
                    ExpressionAttributeValues=expression_attribute_values,
                    ReturnValues="UPDATED_NEW"
                )
                logging.info(f"Updated ongoing for event: {event_id} from {current_ongoing_value} to {new_ongoing_value}")
                updates += 1
                return update_response
            else:
                logging.info(f"No update needed for event: {event_id}, ongoing value remains {current_ongoing_value}")
        else:
            logging.error(f"Event ID {event_id} not found in DynamoDB")
    except ClientError as e:
        logging.error(e.response['Error']['Message'])

def handler(aws_event, context):
    logging.info("Beginning ongoing events updater handler")

    current_utc_datetime = datetime.now(pytz.utc)
    left_window = (current_utc_datetime - timedelta(days=4)).strftime('%Y-%m-%dT%H:%M:%SZ')
    right_window = (current_utc_datetime + timedelta(days=4)).strftime('%Y-%m-%dT%H:%M:%SZ')
    logging.info(f"Left window: {left_window}")
    logging.info(f"Right window: {right_window}")
    page = 0
    count = 0
    finished = False
    
    while not finished:
        page += 1
        response = make_request(f"https://www.robotevents.com/api/v2/events?start={left_window}&end={right_window}&page={page}&per_page=250", headers)
        if response and response.status_code == 200:
            events_data = response.json()
            finished = events_data.get('meta', {}).get('last_page', 0) == page
            for event in events_data.get('data', []):
                update_ongoing_attribute_if_changed(event_data_table, event)
                count += 1
        else:
            logging.error(f"Failed to fetch events for page {page}")
            break

    logging.info(f"Window consists of {page} pages")
    logging.info(f"Processed {count} events, {updates} updates made.")
    logging.info(f"Function duration: {datetime.now(pytz.utc) - current_utc_datetime}")
    return {
        'statusCode': 200,
        'body': json.dumps('Process Completed Successfully')
    }