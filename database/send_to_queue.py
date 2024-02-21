import requests
import json
import logging
import boto3

## Code to send events to the ongoingevents SQS queue, for whatever reason.

# Configuration
API_KEY = 'REDACTED_API_KEY'
QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/228049799584/OngoingEventsQueue'
START_DATE = '2024-02-01T00:00:00Z'

# Set up logging
logging.basicConfig(level=logging.INFO)

# Initialize AWS SQS client
sqs_client = boto3.client('sqs')

# Headers for the RobotEvents API request
headers = {
    'accept': 'application/json',
    'Authorization': f'Bearer {API_KEY}'
}

def fetch_events(start_date, page=1):
    url = f"https://www.robotevents.com/api/v2/events?start={start_date}&page={page}&per_page=250"
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        logging.error(f"Failed to fetch events with status code: {response.status_code}")
        return None

def send_event_id_to_sqs(event_id):
    try:
        message_body = json.dumps({'id': int(event_id)})
        sqs_client.send_message(
            QueueUrl=QUEUE_URL, 
            MessageBody=message_body
        )
        logging.info(f"Sent event ID {event_id} to SQS")
    except Exception as e:
        logging.error(f"Error occurred sending event ID {event_id} to SQS: {e}")

def process_events(start_date):
    page = 1
    while True:
        events_data = fetch_events(start_date, page)
        if not events_data:
            break

        for event in events_data.get('data', []):
            send_event_id_to_sqs(event['id'])

        # Check for more pages
        if page >= events_data.get('meta', {}).get('last_page', 0):
            break
        page += 1

if __name__ == '__main__':
    logging.info("Starting to process events...")
    process_events(START_DATE)
    # send_event_id_to_sqs(55413)
    logging.info("Finished processing events.")