import logging
import json
import requests
import time
import boto3
from botocore.exceptions import ClientError

# This function will run occasionally and is meant to audit ongoing events to keep an event from fraudulently being set to true and never being corrected, resulting in it draining resources from other functions

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