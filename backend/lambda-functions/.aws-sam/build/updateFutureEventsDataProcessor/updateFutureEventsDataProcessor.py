from datetime import datetime, timedelta
from decimal import Decimal
import pytz
import logging
import json
import requests
import time
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

# This lambda function together with UpdateFutureEventsUrlFinder.py is meant to run periodically to iterate through the most recent events and update DynamoDB accordingly. This is meant to update team sign-ups for events logged in the future. Probably do this once a day?
# Events will be updated in real-time when they are 'ongoing' and so updating events in the past should not be required. 

# This lambda function will determine which RobotEvents API URLs need to be checked. It will then pass those URLs to updateFutureEventsUrlFinder.py which will individually check each URL one at a time
# Processing one page of events takes ~10 minutes, meaning processing more than 1 page will go over the Lambda function time limit of 15 minutes
# When a user accesses an event page, the event data will also be updated then. 

# Unique API Key
API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiMjkxYWYyMmZjZWZiMDg3ZjM5MjRjZGQwMzI0OGUxY2RhYzExODU3NzliMDI3ODMxNTJkYjJkZmI4NDViZDZhOTk2ODUyZDAzNDExMTcxODUiLCJpYXQiOjE3MDYwMTA5MzguODk2OTU5MSwibmJmIjoxNzA2MDEwOTM4Ljg5Njk2MjksImV4cCI6MjY1Mjc4MjEzOC44ODMxMzEsInN1YiI6IjkwODM3Iiwic2NvcGVzIjpbXX0.RYqSADg9ONvLCGokyA6ukRs3ibpJ7J7mLNOEW2fpXoUQKLKtCM4WjwuYfkXz7AijwRlZfYOvT10YAWxLHsiGd0Q0_LHZraS_qR0PXmfAUhbMoFjk-TY_SNAeYrK_9BHptqmXvxK8nI3upPEbxKwu9sJ8uRtfP05X27gCp7VHwEK4fvTvH4AAuj56zOAJZWHZ1DPRwMea0ZZGMQgM-IKfRy0W4h8kAuDqmkfn0xQR_6zMQtY2s2qX94WdWt5GsOFtj61twjsZ9IVoIvV61ZXixSC21aydI8diT6WtT6pCh8sQouY0b34WkW-paNeSGV8V59sl_fYeEylDU9O7irRS4LbGzp5Qsq2sygRfznHePGFIOtJPLTWi-ocBGn55QUTjWSQrXnkNRsVo2XG3XwOkw4pZxHN_yO2AL13cW8G0J2baX5xTZOj_3c9hZShpb0GEb3s6wP4W0VmyjUbkF2TS_uCkNVyD_Ju__n2XgYLo2L_c5SC-cwujYZvFFeWGXzusCaIE85mFwW11u38HnOwbrt383qlIOdGNV_FCrOEMYvsIPm1laR4zJv0XZR1GosFOAwO6ROKyH-0TTuvUutyu5Ecvp9-C9DuALwjsJCXG5NMpFMzaM0fcx4OPjd50y-ikdxkBbg0MJ5RAaX9z2qJrgtUGKJJ398b2j7LA6jczF54'
headers = {
    'accept': 'application/json',
    'Authorization': f'Bearer {API_KEY}'
}

logging = logging.getLogger()
logging.setLevel("INFO")

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
event_data_table = dynamodb.Table('event-data')
team_data_table = dynamodb.Table('team-data')

def make_request_base(url, headers, initial_delay=5, retries = 10):
    for _ in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json().get('data', [])
        elif response.status_code == 429:
            logging.info(f"Rate limit exceeded when requesting events. Retrying in {initial_delay} seconds...")
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            logging.info(f"Request for events failed with status code: {response.status_code}")
            break

    return []

def make_request_team(team_id, url, headers, initial_delay = 5, retries = 10):    
    for _ in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json()
        elif response.status_code == 429:
            logging.info(f"Rate limit exceeded when attempting to get team data, Team id: {team_id}. Retrying in {initial_delay} seconds...")
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            logging.info(f"Request failed with status code: {response.status_code}")
            break

    return []

def make_request(event_id, url, headers, initial_delay = 5, retries = 10):    
    for _ in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json().get('data', [])
        elif response.status_code == 429:
            logging.info(f"Rate limit exceeded, Event id: {event_id}. Retrying in {initial_delay} seconds...")
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            logging.info(f"Request failed with status code: {response.status_code}")
            break

    return {}


def get_teams(event_id):
    page = 1
    all_teams = []
    all_team_numbers = []
    teams_to_update = []

    while True:
        api_url = f"https://www.robotevents.com/api/v2/events/{event_id}/teams?page={page}&per_page=250"
        teams_data = make_request(event_id, api_url, headers={'Authorization': f'Bearer {API_KEY}'})
        if teams_data:
            team_ids = [team['id'] for team in teams_data]
            team_numbers = [team['number'] for team in teams_data]
            all_teams.extend(team_ids)
            all_team_numbers.extend(team_numbers)
            last_page = teams_data[0].get('meta', {}).get('last_page', 0)
            if page >= last_page:
                break
            else:
                page += 1
        else:
            break

    # DynamoDB Batch Get to retrieve 'registered' status for all teams
    for i in range(0, len(all_teams), 100):  # DynamoDB BatchGetItem limit is 100 items
        batch_keys = [{'id': team_id} for team_id in all_teams[i:i+100]]
        response = dynamodb.batch_get_item(
            RequestItems={
                'team-data': {
                    'Keys': batch_keys,
                    'ProjectionExpression': 'id, registered'
                }
            }
        )

        # Process the response
        for team in response['Responses']['team-data']:
            if 'registered' not in team: # Signal that the team has basically not been processed at all
                team_data = make_request_team(team['id'], f"https://www.robotevents.com/api/v2/teams/{team['id']}", headers={'Authorization': f'Bearer {API_KEY}'})
                team_data_program = team_data.get('program').get('code')
                team_data.pop('program', None)
                if 'location' in team_data and 'region' in team_data['location'] and team_data['location']['region'] is not None:
                    logging.info(f"new team region set to region for team {team['id']}")
                    region = team_data['location']['region']
                elif 'location' in team_data and 'country' in team_data['location']:
                    logging.info(f"new team region set to country for team {team['id']}")
                    region = team_data['location']['country']
                else:
                    region = "None"
                    logging.error(f"New team_data {team['id']} could not set a region. team: {team_data}")
                if region is None: 
                    region = "None"
                    logging.info(f"Could not set region for new team_data: {team['id']}")
                converted_team_values = convert_values(team_data)
                team_data_table.put_item(
                    Item = {
                        'program': team_data_program,
                        'region': region,
                        **converted_team_values      
                    }              
                )
            if ('registered' in team and team['registered'] == 'false'):
                teams_to_update.append(team['id'])

    # Updating 'registered' status for teams where necessary
    for team_id in teams_to_update:
        team_data_table.update_item(
            Key={'id': team_id},
            UpdateExpression="SET registered = :val",
            ExpressionAttributeValues={':val': 'true'}
        )
    return all_teams, all_team_numbers

def get_awards(event_id):
    page = 1
    all_awards = []
    while True:
        api_url = f"https://www.robotevents.com/api/v2/events/{event_id}/awards?page={page}&per_page=75"
        awards_data = make_request(event_id, api_url, headers={'Authorization': f'Bearer {API_KEY}'})
        if awards_data:
            all_awards.extend(awards_data)  # Adding all awards from the current page to the list
            last_page = awards_data[0].get('meta', {}).get('last_page', 0)
            if page >= last_page:
                break
            else:
                page += 1
        else:
            break
    return all_awards  # Returning the compiled list of awards

# DynamoDB functions
    
def convert_values(obj): # Convert floats to decimals and 'ongoing' to a string
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        for key, value in obj.items():
            if (key == 'ongoing' and isinstance(value, bool)) or (key == 'registered' and isinstance(value, bool)):
                obj[key] = str(value).lower()
            else:
                obj[key] = convert_values(value)
    elif isinstance(obj, list):
        return [convert_values(v) for v in obj]
    return obj


def get_item_from_dynamodb(table, event_id):
    try:
        response = table.get_item(Key={'id': event_id})
        return response.get('Item')
    except ClientError as e:
        logging.error(e.response['Error']['Message'])
        return None

def update_item_in_dynamodb(table, event_id, update_expression, expression_attribute_values, expression_attribute_names=None):
    try:
        # Prepare the parameters for the update_item call
        update_params = {
            'Key': {'id': event_id},
            'UpdateExpression': update_expression,
            'ExpressionAttributeValues': expression_attribute_values,
            'ReturnValues': "UPDATED_NEW"
        }

        # Add ExpressionAttributeNames to parameters if it's not empty
        if expression_attribute_names:
            update_params['ExpressionAttributeNames'] = expression_attribute_names

        # Make the update_item call with the prepared parameters
        response = table.update_item(**update_params)
        return response
    except ClientError as e:
        logging.error(e.response['Error']['Message'])
        return None

def handler(aws_event, context):
    start_time = time.time()
    for record in aws_event['Records']:
        message = json.loads(record['body'])
        url = message.get('url')
        data = make_request_base(url, headers)

        logging.info(f"{len(data)} Events to process")
        for event in data:
            event_id = event['id']
            current_event_data = get_item_from_dynamodb(event_data_table, event_id)
            
            if current_event_data is None:
                if 'location' in event and 'region' in event['location']:
                    region = event['location']['region']
                elif 'location' in event and 'country' in event['location']:
                    region = event['location']['country']
                else:
                    region = None
                    logging.error(f"New event {event_id} could not set a region")
                # Event not found in DynamoDB, create a new one
                # print(f"Region: {region}")
                new_event_data = {
                    'id': event_id,
                    'name': event.get('name'),
                    'start': event.get('start'),
                    'end': event.get('end'),
                    'season': event.get('season'),
                    'program': event.get('program').get('code'),
                    'location': event.get('location', {}).get('venue', ''),
                    'teams': [],
                    'team_numbers': [],
                    'awards': [],
                    'divisions': event.get('divisions', []),
                    'region': region
                }

                # Convert values for DynamoDB compatibility
                new_event_data = convert_values(new_event_data)

                # Insert the new event into DynamoDB
                try:
                    event_data_table.put_item(Item=new_event_data)
                    logging.info(f"New event {event_id} added to DynamoDB.")
                except ClientError as e:
                    logging.error(f"Failed to add new event {event_id} to DynamoDB: {e.response['Error']['Message']}")

            else:
                # Proceed with updates if the event already exists in DynamoDB
                update_expression = "SET "
                expression_attribute_values = {}
                expression_attribute_names = {}
                updated = False

                # Attributes to check for changes
                attributes_to_check = ['name', 'start', 'end', 'season', 'locations', 'location']
                for attr in attributes_to_check:
                    new_value = event
                    try:
                        for key in attr.split('.'):
                            new_value = new_value[key] if key in new_value else None
                    except TypeError:
                        new_value = None

                    if new_value is not None:
                        new_value = convert_values(new_value)

                    if attr not in current_event_data or current_event_data[attr] != new_value:                        
                        placeholder = f"#{attr}"
                        expression_attribute_names[placeholder] = attr
                        update_expression += f"{placeholder} = :{attr}, "
                        expression_attribute_values[f":{attr}"] = new_value
                        updated = True


                # Check if region is nonexistent or changed
                event_region = None
                if 'location' in event and 'region' in event['location']:
                    event_region = event['location']['region']
                elif 'location' in event and 'country' in event['location']:
                    event_region = event['location']['country']
                else:
                    logging.error(f"While updating event {event_id} could not set/update a region")
                    # print(f"While updating event {event_id} could not set/update a region")
                if ('region' not in current_event_data or event_region != current_event_data['region']) and event_region is not None:
                    update_expression += "#regionAttribute = :regionValue, "
                    expression_attribute_names['#regionAttribute'] = 'region'  # Use a placeholder for the 'region' attribute
                    expression_attribute_values[':regionValue'] = event_region  # Assign the actual value to a named placeholder in expression attribute values
                    updated = True

                # Update 'teams' and 'team_numbers'
                teams, team_numbers = get_teams(event_id)
                if 'teams' not in current_event_data or current_event_data['teams'] != teams:
                    update_expression += "teams = :teams, "
                    expression_attribute_values[':teams'] = teams
                    updated = True

                if 'program' not in current_event_data or isinstance(current_event_data['program'], dict):
                    update_expression += "program = :program, "
                    expression_attribute_values[':program'] = event.get('program').get('code')
                    updated = True

                if 'team_numbers' not in current_event_data or current_event_data['team_numbers'] != team_numbers:
                    update_expression += "team_numbers = :teamNumbers, "
                    expression_attribute_values[':teamNumbers'] = team_numbers
                    updated = True

                # Update 'awards'
                awards = get_awards(event_id)
                if 'awards' not in current_event_data or current_event_data['awards'] != awards:
                    update_expression += "awards = :awards, "
                    expression_attribute_values[':awards'] = awards
                    updated = True

                # Update 'divisions'
                if 'divisions' in current_event_data:
                    divisions_changed = False
                    for division in current_event_data['divisions']:
                        if 'rankings' not in division:
                            division['rankings'] = []
                            divisions_changed = True
                        if 'matches' not in division:
                            division['matches'] = []
                            divisions_changed = True

                    if divisions_changed:
                        update_expression += "divisions = :divisions, "
                        expression_attribute_values[':divisions'] = current_event_data['divisions']
                        updated = True

                # Finalize and perform update if necessary
                if updated:
                    update_expression = update_expression.rstrip(", ")
                    response = update_item_in_dynamodb(event_data_table, event_id, update_expression, expression_attribute_values, expression_attribute_names)
                    if response:
                        logging.info(f"Event id {event_id} successfully updated in DynamoDB.")
                        # print(f"Event id {event_id} successfully updated in DynamoDB.")
                    else:
                        logging.error(f"Failed to update event id {event_id} in DynamoDB.")
                else:
                    logging.info(f"No updates required for event id {event_id}.")

    logging.info("Process Finished")
    logging.info(f"Elapsed Time in seconds: {time.time() - start_time}")
    return {
        'statusCode': 200,
        'body': json.dumps('Process Completed Successfully')
    }

def main():
            print("Doing main")
            event_id = 55293
            url = f"https://www.robotevents.com/api/v2/events/{event_id}"
            print(url)
            event = make_request_team(event_id, url, headers={'Authorization': f'Bearer {API_KEY}'})
            print(event)
            event_id = event['id']
            current_event_data = get_item_from_dynamodb(event_data_table, event_id)
            
            if current_event_data is None:
                if 'location' in event and 'region' in event['location']:
                    region = event['location']['region']
                elif 'location' in event and 'country' in event['location']:
                    region = event['location']['country']
                else:
                    region = None
                    logging.error(f"New event {event_id} could not set a region")
                # Event not found in DynamoDB, create a new one
                # print(f"Region: {region}")
                new_event_data = {
                    'id': event_id,
                    'name': event.get('name'),
                    'start': event.get('start'),
                    'end': event.get('end'),
                    'season': event.get('season'),
                    'program': event.get('program').get('code'),
                    'location': event.get('location', {}).get('venue', ''),
                    'teams': [],
                    'team_numbers': [],
                    'awards': [],
                    'divisions': event.get('divisions', []),
                    'region': region
                }

                # Convert values for DynamoDB compatibility
                new_event_data = convert_values(new_event_data)

                # Insert the new event into DynamoDB
                try:
                    event_data_table.put_item(Item=new_event_data)
                    logging.info(f"New event {event_id} added to DynamoDB.")
                except ClientError as e:
                    logging.error(f"Failed to add new event {event_id} to DynamoDB: {e.response['Error']['Message']}")

            else:
                # Proceed with updates if the event already exists in DynamoDB
                update_expression = "SET "
                expression_attribute_values = {}
                expression_attribute_names = {}
                updated = False

                # Attributes to check for changes
                attributes_to_check = ['name', 'start', 'end', 'season', 'locations', 'location']
                for attr in attributes_to_check:
                    new_value = event
                    try:
                        for key in attr.split('.'):
                            new_value = new_value[key] if key in new_value else None
                    except TypeError:
                        new_value = None

                    if new_value is not None:
                        new_value = convert_values(new_value)

                    if attr not in current_event_data or current_event_data[attr] != new_value:                        
                        placeholder = f"#{attr}"
                        expression_attribute_names[placeholder] = attr
                        update_expression += f"{placeholder} = :{attr}, "
                        expression_attribute_values[f":{attr}"] = new_value
                        updated = True


                # Check if region is nonexistent or changed
                event_region = None
                if 'location' in event and 'region' in event['location']:
                    event_region = event['location']['region']
                elif 'location' in event and 'country' in event['location']:
                    event_region = event['location']['country']
                else:
                    logging.error(f"While updating event {event_id} could not set/update a region")
                    print(f"While updating event {event_id} could not set/update a region")
                if ('region' not in current_event_data or event_region != current_event_data['region']) and event_region is not None:
                    update_expression += "#regionAttribute = :regionValue, "
                    expression_attribute_names['#regionAttribute'] = 'region'  # Use a placeholder for the 'region' attribute
                    expression_attribute_values[':regionValue'] = event_region  # Assign the actual value to a named placeholder in expression attribute values
                    updated = True

                # Update 'teams' and 'team_numbers'
                teams, team_numbers = get_teams(event_id)
                if 'teams' not in current_event_data or current_event_data['teams'] != teams:
                    update_expression += "teams = :teams, "
                    expression_attribute_values[':teams'] = teams
                    updated = True

                if 'program' not in current_event_data or isinstance(current_event_data['program'], dict):
                    update_expression += "program = :program, "
                    expression_attribute_values[':program'] = event.get('program').get('code')
                    updated = True

                if 'team_numbers' not in current_event_data or current_event_data['team_numbers'] != team_numbers:
                    update_expression += "team_numbers = :teamNumbers, "
                    expression_attribute_values[':teamNumbers'] = team_numbers
                    updated = True

                # Update 'awards'
                awards = get_awards(event_id)
                if 'awards' not in current_event_data or current_event_data['awards'] != awards:
                    update_expression += "awards = :awards, "
                    expression_attribute_values[':awards'] = awards
                    updated = True

                # Update 'divisions'
                if 'divisions' in current_event_data:
                    divisions_changed = False
                    for division in current_event_data['divisions']:
                        if 'rankings' not in division:
                            division['rankings'] = []
                            divisions_changed = True
                        if 'matches' not in division:
                            division['matches'] = []
                            divisions_changed = True

                    if divisions_changed:
                        update_expression += "divisions = :divisions, "
                        expression_attribute_values[':divisions'] = current_event_data['divisions']
                        updated = True

                # Finalize and perform update if necessary
                if updated:
                    update_expression = update_expression.rstrip(", ")
                    response = update_item_in_dynamodb(event_data_table, event_id, update_expression, expression_attribute_values, expression_attribute_names)
                    if response:
                        print(f"Event id {event_id} successfully updated in DynamoDB.")
                        print(f"Event id {event_id} successfully updated in DynamoDB.")
                        # print(f"Event id {event_id} successfully updated in DynamoDB.")
                    else:
                        print(f"Failed to update event id {event_id} in DynamoDB.")
                        print(f"Failed to update event id {event_id} in DynamoDB.")
                else:
                    print(f"No updates required for event id {event_id}.")
                    print(f"No updates required for event id {event_id}.")
                    
                    
# main()

# Test event:

# test_event = {
#   "Records": [
#     {
#       "messageId": "1",
#       "receiptHandle": "abc123",
#       "body": "{\"url\": \"https://www.robotevents.com/api/v2/events?start=2024-02-17&per_page=250\"}",
#       "attributes": {
#         "ApproximateReceiveCount": "1",
#         "SentTimestamp": "1573251510774",
#         "SenderId": "testSender",
#         "ApproximateFirstReceiveTimestamp": "1573251510774"
#       },
#       "messageAttributes": {},
#       "md5OfBody": "md5",
#       "eventSource": "aws:sqs",
#       "eventSourceARN": "arn:aws:sqs:region:account-id:queue-name",
#       "awsRegion": "us-east-1"
#     },
#         {
#       "messageId": "1",
#       "receiptHandle": "abc123",
#       "body": "{\"url\": \"https://www.robotevents.com/api/v2/events?start=2024-02-01&page=2&per_page=250\"}",
#       "attributes": {
#         "ApproximateReceiveCount": "1",
#         "SentTimestamp": "1573251510774",
#         "SenderId": "testSender",
#         "ApproximateFirstReceiveTimestamp": "1573251510774"
#       },
#       "messageAttributes": {},
#       "md5OfBody": "md5",
#       "eventSource": "aws:sqs",
#       "eventSourceARN": "arn:aws:sqs:region:account-id:queue-name",
#       "awsRegion": "us-east-1"
#     },
#         {
#       "messageId": "1",
#       "receiptHandle": "abc123",
#       "body": "{\"url\": \"https://www.robotevents.com/api/v2/events?start=2024-02-01&page=3&per_page=250\"}",
#       "attributes": {
#         "ApproximateReceiveCount": "1",
#         "SentTimestamp": "1573251510774",
#         "SenderId": "testSender",
#         "ApproximateFirstReceiveTimestamp": "1573251510774"
#       },
#       "messageAttributes": {},
#       "md5OfBody": "md5",
#       "eventSource": "aws:sqs",
#       "eventSourceARN": "arn:aws:sqs:region:account-id:queue-name",
#       "awsRegion": "us-east-1"
#     },
#         {
#       "messageId": "1",
#       "receiptHandle": "abc123",
#       "body": "{\"url\": \"https://www.robotevents.com/api/v2/events?start=2024-02-01&page=4&per_page=250\"}",
#       "attributes": {
#         "ApproximateReceiveCount": "1",
#         "SentTimestamp": "1573251510774",
#         "SenderId": "testSender",
#         "ApproximateFirstReceiveTimestamp": "1573251510774"
#       },
#       "messageAttributes": {},
#       "md5OfBody": "md5",
#       "eventSource": "aws:sqs",
#       "eventSourceARN": "arn:aws:sqs:region:account-id:queue-name",
#       "awsRegion": "us-east-1"
#     },
#         {
#       "messageId": "1",
#       "receiptHandle": "abc123",
#       "body": "{\"url\": \"https://www.robotevents.com/api/v2/events?start=2024-02-01&page=5&per_page=250\"}",
#       "attributes": {
#         "ApproximateReceiveCount": "1",
#         "SentTimestamp": "1573251510774",
#         "SenderId": "testSender",
#         "ApproximateFirstReceiveTimestamp": "1573251510774"
#       },
#       "messageAttributes": {},
#       "md5OfBody": "md5",
#       "eventSource": "aws:sqs",
#       "eventSourceARN": "arn:aws:sqs:region:account-id:queue-name",
#       "awsRegion": "us-east-1"
#     }
#   ]
# }

# handler(test_event)