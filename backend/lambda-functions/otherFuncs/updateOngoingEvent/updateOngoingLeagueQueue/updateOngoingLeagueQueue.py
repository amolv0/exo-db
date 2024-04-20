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

# This function, along with updateOngoingEventProcessor, is designed to update any non-league events in real-time.
# This function will query the dynamodb table every minute and determine event-ids that are currently ongoing and are not leagues (ie, for now any event with a difference between start and end time of <5 days)
# It will then send those ids to SQS queue
# A seperate lambda function, updateOngoingEventProcessor will process messages from that queue. It will update dynamodb with data from that event. 

# The front-end will then be notified of updates (via websocket?) and be able to display event updates in real-time.
# All events with the 'ongoing' attribute set to true will be iterated over and their data will be posted to dynamodb, including match data. Whenever the table is updated, through dynamodb streams a subscriber will be notified, if the update
# includes the eventid of a event a user is viewing, the websocket will issue an update. 

API_KEY = os.getenv('API_KEY')
headers = {
    'accept': 'application/json',
    'Authorization': f'Bearer {API_KEY}'
}

logging = logging.getLogger()
logging.setLevel("INFO")

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
event_data_table = dynamodb.Table('event-data')
sqs_client = boto3.client('sqs')


def determine_is_league(event):
    start_time = datetime.fromisoformat(event['start'])
    end_time = datetime.fromisoformat(event['end'])
    return abs(end_time-start_time).days < 5 or start_time == end_time # return False if the absolute difference between the start and end time is 5 or more days, meaning it is an leage we will add to queue

def get_ongoing_events(table):
    ongoing_events = []
    last_evaluated_key = None
    while True:
        if last_evaluated_key:
            response = table.query(
                IndexName='OngoingEventsIndex',
                KeyConditionExpression='ongoing = :val',
                ExpressionAttributeValues={
                    ':val': 'true'
                },
                ExclusiveStartKey=last_evaluated_key
            )
        else:
            response = table.query(
                IndexName='OngoingEventsIndex',
                KeyConditionExpression='ongoing = :val',
                ExpressionAttributeValues={
                    ':val': 'true'
                }
            )

        ongoing_events.extend(response['Items'])
        last_evaluated_key = response.get('LastEvaluatedKey')
        if not last_evaluated_key:
            break

    return ongoing_events


def handler(aws_event, context):
    # logging.info("Begining updateOngoingEventQueue function")
    queue_url = f"{os.getenv('SQS_BASE_URL')}/OngoingEventsQueue"

    events = get_ongoing_events(event_data_table)
    count = 0
    for event in events:
        if determine_is_league(event): # returns true if it is not a league
            continue
        try:
            sqs_client.send_message(
                QueueUrl=queue_url,
                MessageBody=json.dumps({'id': int(event['id'])})
            )
            # logging.info(f"Sent event: {event['id']} to queue")  
            count += 1
        except Exception as e:
            logging.info(f"Error occured sending message to queue: {e}")
        
    logging.info(f"Currently {len(events)} events ongoing, of which {count} events are leagues and were sent to queue") 
    return {
        'statusCode': 200,
        'body': json.dumps(f'Process Completed Successfully. Currently {len(events)} events ongoing, of which {count} events are leagues and were sent to queue')
    }