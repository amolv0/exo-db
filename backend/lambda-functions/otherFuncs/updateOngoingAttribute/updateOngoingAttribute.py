from datetime import datetime, timedelta
from decimal import Decimal
import pytz
import logging
import json
import requests
import time
import boto3
from botocore.exceptions import ClientError

# This lambda function is meant to periodically check events in a start/end date range based on the current date. It is meant to make currently running events that were not previously recorded as ongoing that have become ongoing
# since recorded properly and vice-versa. This function is meant to run periodically but more often than the updateFutureEvents func which runs once a day, as a result it must look at as small a window of events as possible. 
# To account for multi-day competitions (worlds, sigs) it is currently set to an 8 day window. In most cases, this is less than 500 events (so only 2 pages). It should only need as many API calls as pages,
# because ongoing is referenced directly in the events call and not events/{eventId} through RobotEvents. 

# The logic after determining the windowed URL is similar to updateFutureEventsDataProcessor, but is reimplemented to keep issues like overqueueing that function and to maintain seperate RobotEvents API keys for 
# seperate uses. 


# Unique API Key
API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiYWMwYTkxMWE4YzFhNGRjZjkyZTIxMDQwYTgzMzE1ZTgxNzcxY2RjYzM3ZjQ3YmU2ZGU1ZmQzODQxNThiYjU0MDdjNzAwZGFlMTBlOWE4YzEiLCJpYXQiOjE3MDYzODEwMTcuNjcwMzUyOSwibmJmIjoxNzA2MzgxMDE3LjY3MDM1NiwiZXhwIjoyNjUzMTUyMjE3LjY2NDQxMTEsInN1YiI6IjkwODM3Iiwic2NvcGVzIjpbXX0.ZuktNdhqYX5SmB0dJkIA0z4DShawWFlhSQwEv2DnQkFoT0FoNuEn-zvVE1IzGq35EB9EbrDe1sTPrSvEvet6q9I80yeX8JHJURbnN2-CFk0kSUK1o75ORcW33n805Fr3qyFz-E_75O3UVTqttFgzlTsS41NO49pTNlKdef0rFdgUQD13DqPKbTqS4vWXPuwWwHblYhU692OW-rRw3xdujTqhQ3MOf8GQYJ08RV79bPM8QrY4OndEbhPjNd0XzSiAFSi3EtLBFciPNglnleyRNV56ykK5kb77I9rwLg2OyjR7zcrNo3qfpD_rieBhOGxcK_irkLd1EHIKt6SHpEU_Lj7FtbCK1ZaQp5ggkg6ily3tj0elvem3eqDmySHfK7GDO6ULIYpApJi_NWVAqlS29rr-BORjruQjLWMg6EYexBipk0Z6Tp084K9TA2OVIHcsoZWNlt4s0ZgtQOSrc0I_Fb1G__Zf0EFcIGyG00UP_lkd60E5mLgHiDP4MdbAck0r69cMY0BZ3kvqYiPsu1QrJceaWZ6GhC5NXfnkIJGdHA7xBIys2cOYLesGBn-yB0atYh4M_IcXTS6Z1oPSsBAQtxwkl2U98cGlJEp6BwxCII5uBH7-gkWiFt47UNieo5_zEIHPRIPtbJkxYnsH7Su87FA_P9HadqkJ7ICTg_wrBCM'
headers = {
    'accept': 'application/json',
    'Authorization': f'Bearer {API_KEY}'
}

logging = logging.getLogger()
logging.setLevel("INFO")

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
event_data_table = dynamodb.Table('event-data')

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
    logging.info(f"Processed {count} events")
    logging.info(f"Function duration: {datetime.now(pytz.utc) - current_utc_datetime}")
    return {
        'statusCode': 200,
        'body': json.dumps('Process Completed Successfully')
    }