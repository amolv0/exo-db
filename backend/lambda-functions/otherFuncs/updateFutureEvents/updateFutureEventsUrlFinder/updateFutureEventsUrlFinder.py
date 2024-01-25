import requests
import json
import logging
import boto3
import time
from datetime import datetime, timedelta
import pytz
# This lambda function together with UpdateFutureEventsDataProcessor.py is meant to run periodically to iterate through the most recent events and update DynamoDB accordingly. This is meant to update team sign-ups for events logged in the future. Probably do this once a day?
# Events will be updated in real-time when they are 'ongoing' and so updating events in the past should not be required. 

# This lambda function will determine which RobotEvents API URLs need to be checked. It will then pass those URLs to updateFutureEventsDataProcessor.py which will individually check each URL one at a time
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

sqs_client = boto3.client('sqs')

def get_last_page(time_to_check, initial_delay=5, retries=5):
    for _ in range(retries):
        response = requests.get(f"https://www.robotevents.com/api/v2/events?start={time_to_check}&page=1&per_page=250", headers=headers)

        if response.status_code == 200:
            return response.json().get('meta', [])['last_page']
        elif response.status_code == 429:
            logging.info(f"Rate limit exceeded when attempting to find last page. Retrying in {initial_delay} seconds...")
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            logging.info(f"Request for last page failed with status code: {response.status_code}")
            break
    return -1

def send_url_to_sqs(url, queue_url):
    sqs_client.send_message(QueueUrl=queue_url, MessageBody=json.dumps({'url': url}))


def url_finder_handler(aws_event, context):
    logging.info("Begining url finder handler")
    queue_url = 'https://sqs.us-east-1.amazonaws.com/228049799584/updateFutureEventsUrlQueue'

    current_utc_datetime = datetime.now(pytz.utc)
    time_to_check = (current_utc_datetime - timedelta(hours=48)).strftime('%Y-%m-%dT%H:%M:%SZ')
    last_page = get_last_page(time_to_check, headers)

    event_urls = []
    for i in range(1, last_page + 1):
        url = f'https://www.robotevents.com/api/v2/events?start={time_to_check}&page={i}&per_page=250'
        event_urls.append(url)

    # Send URLs to SQS
    # URLs are then passed to UpdateFutureEventsDataProcessor.py
    for url in event_urls:
        send_url_to_sqs(url, queue_url)
    logging.info(f"{len(event_urls)} URLs sent to SQS")
    return {
        'statusCode': 200,
        'body': json.dumps(f"{len(event_urls)} URLs sent to SQS")
    }