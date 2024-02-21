import requests
import json
import logging
import boto3

## Code to send events to the ongoingevents SQS queue, for whatever reason.

# Configuration
API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiODU4MTYxMzQ1MmUyMjE2YjE5MWEwY2Q5NjVkMmE4YThkNWZkYjZhNjI4ZWEwNjM3YzMyNjM1OWVkMmRiZWU3ODdjMjBiNDcyMDhiM2ZkMjUiLCJpYXQiOjE3MDIxMDAyNDguNDA4MjA1LCJuYmYiOjE3MDIxMDAyNDguNDA4MjA3OSwiZXhwIjoyNjQ4ODcxNDQ4LjM5OTk1OTEsInN1YiI6IjkwODM3Iiwic2NvcGVzIjpbXX0.Tk_BPVkoN42aEdJDMH_tAOnhhVZZiZ93VJVxELdwEw3npoJFWoqPKYgCPrPOt4X5YvyOQn82-UBJCUmXbPEJSGWK6gERFKLygi48afODQc-c9s5GnWJKT2Z5OQ608RJm9ZgDzzr7jk6nVJm-6gI9UJ4AUwFxlBTY4D6_uATPJNycD4EqJ7Wu9_jOBhW2Oek84fU9XzYrodTRpfwSmr5-g4mblM_1_r_hxrtIG4y22Gjt-qbRnAaIAnhehF5Z-9K82CQ7x95gLQXC1tzs-AWtv3upLjBqVM_mDiERlztNE08qJZ7o8etRJU9j5m1xFHPk9MF7vrNh2QdkL7JTYkNBoOEB-z-LfF4SJ2vlftFMvhiyxxnQ0YYmzjyBD5utjm5Tn-oZZ3umDmxQuc08yy2K_t21Pf8bTgMLKDs8RUdC6hxLgmNOy7fa1w2lYU7-NhjiZATNNqJ9WTTBoJxUqux290jXtPC2zzJcqFniV5DA4vdYWcFCHQAglPAUe3W5FfiLJ4CVZ4Sd6Kfb7euKVAG7DvuVxF7BwCQspBI8O31L9F0dKp2t-W9YBB0xjRbrQOnVOSPuTQdc1O4-R1OLz7Vr1BzKsNBBwSzt8ejqed3rpnpdrbm-rUJBj3UD7UGJgAYDeFIgNuB1i5MWd5dzfcQMXGQ_a8WGOCKGbXeLZC7WOoU'
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