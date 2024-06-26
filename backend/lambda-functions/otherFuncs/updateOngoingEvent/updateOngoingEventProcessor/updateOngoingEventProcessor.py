from datetime import datetime, timedelta
import pytz
import numpy as np
from scipy.linalg import cho_factor, cho_solve
from decimal import Decimal, ROUND_HALF_UP
import logging
import json
import requests
import time
import boto3
import os
from botocore.exceptions import ClientError
from datetime import datetime

# This function, along with updateOngoingEventProcessor, is designed to update any non-league events in real-time.
# This function will poll messages from an SQS queue consisting of event ids that are currently ongoing
# It will then update the dynamoDB table entry for that specific event. It is designed to run quickly and often

# All events with the 'ongoing' attribute set to true will be iterated over and their data will be posted to dynamodb, including match data. Whenever the table is updated, through dynamodb streams a subscriber will be notified.


API_KEY = os.getenv('API_KEY')
headers = {
    'accept': 'application/json',
    'Authorization': f'Bearer {API_KEY}'
}

# logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
# logging = logging.getLogger(__name__)


logging = logging.getLogger()
logging.setLevel("INFO")

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
event_data_table = dynamodb.Table('event-data')
s3 = boto3.client('s3')
DynamoDBSizeLimit = 400 * 1024  # 400 KB

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)  # Convert Decimal to float
    elif isinstance(obj, dict):
        # Recursively process dictionary
        return {k: decimal_default(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        # Recursively process list
        return [decimal_default(v) for v in obj]
    else:
        return obj

def put_divisions_in_s3(event_id, divisions_data):
    s3_bucket_name = "exodb-event-data-storage"  # Using a common bucket with unique keys
    s3_key = f"event-{event_id}/divisions"
    divisions_json = json.dumps(decimal_default(divisions_data))
    try:
        s3.put_object(Bucket=s3_bucket_name, Key=s3_key, Body=divisions_json)
        logging.info(f"Divisions data for event {event_id} stored in S3.")
        return f"s3://{s3_bucket_name}/{s3_key}"
    except ClientError as e:
        logging.error(f"Failed to store divisions in S3: {e}")
        return None
    
def make_request(url, headers, initial_delay=5, retries=3):
    for _ in range(retries):
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 429:
            logging.info(f"429, waiting for {initial_delay} seconds")
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            logging.error(f"Request failed with status code: {response.status_code}")
            break
    return None

def fetch_event_data(event_id):
    url = f"https://www.robotevents.com/api/v2/events/{event_id}"
    return make_request(url, headers)

def fetch_division_matches(event_id, division_id):
    matches = []
    page = 1
    while True:
        url = f"https://www.robotevents.com/api/v2/events/{event_id}/divisions/{division_id}/matches?page={page}&per_page=250"
        response = make_request(url, headers)
        if response:
            matches.extend(response['data'])
            if page >= response['meta']['last_page']:
                break
            page += 1
        else:
            break
    # logging.info(f"Found {len(matches)} matches")
    return matches

def fetch_division_rankings(event_id, division_id):
    rankings = []
    page = 1
    while True:
        url = f"https://www.robotevents.com/api/v2/events/{event_id}/divisions/{division_id}/rankings?page={page}&per_page=250"
        response = make_request(url, headers)
        if response:
            rankings.extend(response['data'])
            if page >= response['meta']['last_page']:
                break
            page += 1
        else:
            break
    return rankings

def fetch_event_skills(event_id):
    skills = []
    page = 1
    while True:
        url = f"https://www.robotevents.com/api/v2/events/{event_id}/skills?page={page}&per_page=250"
        response = make_request(url, headers)
        if response:
            skills.extend(response['data'])
            if page >= response['meta']['last_page']:
                break
            page += 1
        else:
            break
    return skills

def update_if_changed(event_id, new_data):
    divisions_data = new_data.pop('divisions', None)

    try:
        response = event_data_table.get_item(Key={'id': event_id})
        current_data = response.get('Item', {})
    except ClientError as e:
        logging.error(e.response['Error']['Message'])
        return

    update_expression = "SET "
    expression_attribute_values = {}
    for key, value in new_data.items():
        if current_data.get(key) != value:
            update_expression += f"{key} = :{key}, "
            expression_attribute_values[f":{key}"] = value

    if divisions_data:
        serialized_divisions = divisions_data 
        if isinstance(current_data.get('divisions'), dict) and 'divisions_s3_reference' in current_data.get('divisions', {}):
            # Update directly in S3 if already referencing an S3 object
            s3_reference = put_divisions_in_s3(event_id, serialized_divisions)
            expression_attribute_values[":divisions"] = {"divisions_s3_reference": s3_reference, "divisions_last_changed": datetime.now().isoformat(), }
            update_expression += "divisions = :divisions, "
        else:
            try:
                # Check if the direct update to DynamoDB would work
                test_update_expression = "SET divisions = :divisions_test"
                test_response = event_data_table.update_item(
                    Key={'id': event_id},
                    UpdateExpression=test_update_expression,
                    ExpressionAttributeValues={":divisions_test": serialized_divisions},
                    ReturnValues="NONE",
                    ConditionExpression="attribute_not_exists(divisions_s3_reference)"  # Ensure not to overwrite S3 reference if testing
                )
                # If the direct update test passes, prepare the actual update
                expression_attribute_values[":divisions"] = divisions_data
                update_expression += "divisions = :divisions, "
            except ClientError as e:
                # If error due to size, fallback to S3 and update reference in DynamoDB
                if e.response['Error']['Code'] in ['ValidationException', 'RequestEntityTooLarge']:
                    s3_reference = put_divisions_in_s3(event_id, serialized_divisions)
                    if s3_reference:
                        expression_attribute_values[":divisions"] = {"divisions_s3_reference": s3_reference, "divisions_last_changed": datetime.now().isoformat(), }
                        update_expression += "divisions = :divisions, "

    update_expression = update_expression.rstrip(', ')  # Remove trailing comma and space

    if expression_attribute_values:
        try:
            event_data_table.update_item(
                Key={'id': event_id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_attribute_values,
                ReturnValues="UPDATED_NEW"
            )
            logging.info(f"Updated event {event_id} with changes.")
        except ClientError as e:
            logging.error(f"Failed to update DynamoDB: {e}")

                    
                    
def fetch_event_awards(event_id):
    awards = []
    page = 1
    while True:
        url = f"https://www.robotevents.com/api/v2/events/{event_id}/awards?page={page}&per_page=250"
        response = make_request(url, headers)
        if response:
            awards.extend(response['data'])
            if page >= response['meta']['last_page']:
                break
            page += 1
        else:
            break
    return awards

def process_ranking(rankings, matches):
    teams = set()
    team_numbers = {}
    for match in matches:
        for alliance in match['alliances']:
            for team in alliance['teams']:
                team_id = team['team']['id']
                teams.add(team_id)
                team_numbers[team_id] = team['team']['name']

    n = len(teams)
    if n < 1:
        return rankings  # No teams found, return original rankings

    team_indices = {team_id: i for i, team_id in enumerate(teams)}
    A = np.zeros((n, n))
    B_opr = np.zeros(n)
    B_dpr = np.zeros(n)

    qual_matches = [match for match in matches if match['round'] == 2]
    for match in qual_matches:
        scores = [float(alliance['score']) for alliance in match['alliances']]
        for i, alliance in enumerate(match['alliances']):
            team_ids = [team['team']['id'] for team in alliance['teams']]
            for team_id in team_ids:
                idx = team_indices[team_id]
                B_opr[idx] += scores[i]
                B_dpr[idx] += scores[1-i]
                for other_team_id in team_ids:
                    A[idx, team_indices[other_team_id]] += 1

    A += np.eye(A.shape[0]) * 0.0000001  # Regularization
    c, lower = cho_factor(A)
    oprs = cho_solve((c, lower), B_opr)
    dprs = cho_solve((c, lower), B_dpr)
    ccwms = oprs - dprs

    # Update rankings with calculated values
    for ranking in rankings:
        ranking.pop('event', None)
        ranking.pop('division', None)
        team_id = ranking['team']['id']
        if 'average_points' in ranking and ranking['average_points'] != None:
            ranking['average_points'] = Decimal(str(ranking['average_points']))
        if team_id in teams:
            idx = team_indices[team_id]
            if B_opr[idx] == 0 and B_dpr[idx] == 0:  # Team has not played any matches
                ranking['opr'] = Decimal('0.00')
                ranking['dpr'] = Decimal('0.00')
                ranking['ccwm'] = Decimal('0.00')
            else:
                ranking['opr'] = Decimal(str(oprs[idx])).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                ranking['dpr'] = Decimal(str(dprs[idx])).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                ranking['ccwm'] = Decimal(str(ccwms[idx])).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    return rankings

def convert_values(obj): # Convert floats to decimals and 'ongoing' to a string
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        for key, value in obj.items():
            obj[key] = convert_values(value)
    elif isinstance(obj, list):
        return [convert_values(v) for v in obj]
    return obj


def handler(event, context):
    for record in event['Records']:
        message = json.loads(record['body'])
        event_id = message['id']
        logging.info(f"Processing event ID: {event_id}")

        # Fetch new event data from the API
        event_data = fetch_event_data(event_id)
        if event_data:
            divisions = event_data.get('divisions', [])
            for division in divisions:
                division_id = division.get('id')
                if division_id:
                    # Fetch and update matches
                    matches = fetch_division_matches(event_id, division_id)
                    for match in matches:
                        match.pop('event', None)
                        match.pop('division', None)
                    division['matches'] = matches

                    # Fetch and update rankings
                    rankings = fetch_division_rankings(event_id, division_id)
                    processed_rankings = process_ranking(rankings, matches)
                    division['rankings'] = processed_rankings

            # Fetch skills data
            skills = fetch_event_skills(event_id)
            for skill in skills:
                skill.pop('event', None)
            awards = fetch_event_awards(event_id)
            # Compare and update DynamoDB if there are changes
            update_if_changed(event_id, {'divisions': convert_values(divisions), 'skills': skills, 'awards': awards})
        else:
            logging.error(f"Failed to fetch data for event ID: {event_id}")

    return {
        'statusCode': 200,
        'body': json.dumps('Process Completed Successfully')
    }

# For local testing, remove context param

# test_message = {

#     "Records": [
#         {
#             "body": "{\"id\": 55194}",
#         }
#     ]
# }

# handler(test_message)