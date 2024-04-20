import logging
import json
import requests
import time
import boto3
import os
from botocore.exceptions import ClientError

# This function will run occasionally and is meant to audit ongoing events to keep an event from fraudulently being set to true and never being corrected, resulting in it draining resources from other functions

API_KEY = os.getenv('API_KEY')
headers = {
    'accept': 'application/json',
    'Authorization': f'Bearer {API_KEY}'
}

logging = logging.getLogger()
logging.setLevel("INFO")

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
event_data_table = dynamodb.Table('event-data')


def make_request(event_id, url, headers, initial_delay = 5, retries = 3):    
    for _ in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json()
        elif response.status_code == 429:
            logging.info(f"Rate limit exceeded, Event id: {event_id}. Retrying in {initial_delay} seconds...")
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            logging.info(f"Request failed with status code: {response.status_code}")
            break

    return []

# Get the set of events with ongoing=="true"
def get_ongoing_events(table):
    response = table.query(
        IndexName='OngoingEventsIndex',
        KeyConditionExpression='ongoing = :val',
        ExpressionAttributeValues={
            ':val': 'true'
        },
    )
    items = response['Items']
    return items

def update_ongoing_attribute(table, event, ongoing):
    event_id = event['id']
    item_key = {'id': event_id}
    update_expression = 'SET #ongoing = :new_value'
    expression_attribute_names = {'#ongoing': 'ongoing'}
    expression_attribute_values = {':new_value': ongoing}
    response = table.update_item(
        Key=item_key,
        UpdateExpression=update_expression,
        ExpressionAttributeNames=expression_attribute_names,
        ExpressionAttributeValues=expression_attribute_values,
        ReturnValues="UPDATED_NEW"
    )
    return response

def handler(aws_event, context):
    logging.info("Begining ongoing events audit handler")
    ongoing_events = get_ongoing_events(event_data_table)

    for event in ongoing_events:
        response = make_request(event['id'], f"https://www.robotevents.com/api/v2/events/{event['id']}", headers=headers)
        if str(response['ongoing']).lower() == "false":
            logging.info(f"Corrected ongoing for event: {event['id']}")
            update_ongoing_attribute(event_data_table, event, "false")
    return {
        'statusCode': 200,
        'body': json.dumps('Process Completed Successfully')
    }