import json
import requests
import boto3
import time
import sys

# DynamoDB and API setup
# Replace 'your-access-key-id' and 'your-secret-access-key' with your AWS access key ID and secret access key
aws_access_key_id = 'REDACTED'
aws_secret_access_key = 'REDACTED_API_KEY'
aws_region = 'us-east-1'
table_name = 'event-data'

# Create a DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name=aws_region, aws_access_key_id=aws_access_key_id, aws_secret_access_key=aws_secret_access_key)

events_table = dynamodb.Table('event-data')  # Replace with your DynamoDB table name

API_KEY = 'REDACTED_API_KEY'
API_KEY_2 = 'REDACTED_API_KEY'

def log_message(message):
    with open("output.log", "a") as log_file:
        log_file.write(message + "\n")
        log_file.flush()  # Flush the file buffer immediately
    sys.stdout.write(message + "\n")
    sys.stdout.flush()  # Flush the stdout buffer immediately

sys.stdout = open("output.log", "w")
sys.stderr = sys.stdout

def make_request(url, headers, retries=10, initial_delay=5):
    for attempt in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            
            #print(f"Remaining Limit: {response.headers.get('x-ratelimit-remaining')}. ", end = '')
            log_message(f"Remaining Limit: {response.headers.get('x-ratelimit-remaining')}. ")
            time.sleep(1)
            return response.json().get('data', [])
        elif response.status_code == 429:
            remaining_limit = int(response.headers.get('x-ratelimit-remaining', 0))
            #print(f"Rate limit exceeded. Remaining limit: {remaining_limit}. ", end = '')
            log_message(f"Rate limit exceeded. Remaining limit: {remaining_limit}. ")
            if remaining_limit == 0:
                #print(f"No remaining limit, attempt: {attempt+1}. Retrying after delay of {initial_delay}...")
                log_message(f"No remaining limit, attempt: {attempt+1}. Retrying after delay of {initial_delay}...")
                time.sleep(initial_delay)
                initial_delay *= 2
            else:
                #print(f"Retrying in {initial_delay} seconds...")
                log_message(f"Retrying in {initial_delay} seconds...")
                time.sleep(initial_delay)
        else:
            #print(f"Request failed with status code: {response.status_code}")
            log_message(f"Request failed with status code: {response.status_code}")
            break

    return []

def get_matches(event_id, division_id):
    page = 1
    all_matches = []
    while True:
        api_url = f"https://www.robotevents.com/api/v2/events/{event_id}/divisions/{division_id}/matches?page={page}"
        matches_data = make_request(api_url, headers={'Authorization': f'Bearer {API_KEY}'})
        
        if matches_data:
            all_matches.extend(matches_data)

            # Check if there are more pages
            last_page = matches_data[0].get('meta', {}).get('last_page', 0)
            if page >= last_page:
                break
            else:
                page += 1
        else:
            break
    return all_matches

def update_dynamodb(event):
    for division in event.get('divisions', {'L': []}).get('L', []):
        division_id = division.get('M', {}).get('id', {}).get('N')
        if division_id:
            matches = get_matches(event['id']['N'], division_id)
            
            # Check if 'matches' item exists in the division, if not, create it
            if 'matches' not in division.get('M', {}):
                division['M']['matches'] = {'L': []}
            
            # Add the matches to the 'matches' item
            division['M']['matches']['L'].extend(matches)

            # Update the DynamoDB table with the new division data
            response = events_table.update_item(
                Key={'id': event['id']['N']},
                UpdateExpression='SET divisions = :d',
                ExpressionAttributeValues={':d': event['divisions']},
                ReturnValues='UPDATED_NEW'
            )
            log_message(f'Updated DynamoDB for Event ID: {event["id"]["N"]}, Division ID: {division_id}')


def scan_events():
    response = events_table.scan()
    events = response.get('Items', [])
    
    # Handling pagination
    while 'LastEvaluatedKey' in response:
        response = events_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        events.extend(response.get('Items', []))
    
    return events

def iterate_and_update_events():
    events_data = scan_events()
    for event in events_data:
        update_dynamodb(event)

if __name__ == "__main__":
    iterate_and_update_events()