import boto3
import requests
import json
import logging
import time
from decimal import Decimal

# Initialize the DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('team-data')

logging = logging.getLogger()
logging.setLevel("INFO")

# Your unique API key and headers
API_KEY = 'REDACTED_API_KEY'
headers = {
    'accept': 'application/json',
    'Authorization': f'Bearer {API_KEY}'
}

def make_request(team_id, url, headers, initial_delay = 5, retries = 5):    
    for _ in range(retries):
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 429:
            logging.info(f"Rate limit exceeded, Event id: {team_id}. Retrying in {initial_delay} seconds...")
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            logging.info(f"Request failed with status code: {response.status_code}")
            break

    return []

def deep_compare(d1, d2):
    if set(d1.keys()) != set(d2.keys()):
        return False
    for key in d1:
        if isinstance(d1[key], dict) and isinstance(d2[key], dict):
            if not deep_compare(d1[key], d2[key]):
                return False
        elif isinstance(d1[key], Decimal) or isinstance(d2[key], Decimal):
            if float(d1[key]) != float(d2[key]):
                return False
        elif d1[key] != d2[key]:
            return False
    return True

def find_updates(dynamo_item, api_response):
    updates = {}
    attributes_to_check = ['number', 'team_name', 'robot_name', 'organization', 'location', 'registered', 'program', 'grade']

    for attr in attributes_to_check:
        if attr in api_response:
            if attr == 'location':
                # Deep copy the location to avoid mutating the original response
                location_update = json.loads(json.dumps(api_response[attr]), parse_float=Decimal)
                if not deep_compare(dynamo_item.get(attr, {}), location_update):
                    updates[attr] = location_update
            elif attr == 'program' and dynamo_item.get(attr) != api_response[attr]['code']:
                updates[attr] = api_response[attr]['code']
            elif attr == 'registered':
                dynamo_val = str(dynamo_item.get(attr, '')).lower()
                api_val = str(api_response[attr]).lower()
                if dynamo_val != api_val:
                    updates[attr] = api_val
            elif dynamo_item.get(attr) != api_response[attr] and attr != 'program' and attr != 'registered' and attr != 'location':
                if isinstance(api_response[attr], (int, float)):
                    updates[attr] = Decimal(str(api_response[attr]))
                else:
                    updates[attr] = api_response[attr]
    return updates

def handler(event, context):
    logging.info("Starting process")
    for record in event['Records']:
        team_ids = json.loads(record['body'])

        for team_id in team_ids:
            url = f"https://www.robotevents.com/api/v2/teams/{team_id}"
            team_info = make_request(team_id, url, headers)
            if team_info:
                dynamo_response = table.get_item(Key={'id': team_id})
                if 'Item' in dynamo_response:
                    item = dynamo_response['Item']
                    updates = find_updates(item, team_info)

                    if updates:
                        print(f"updates: {updates}")
                        update_expression = "SET "
                        expression_attribute_names = {}
                        expression_attribute_values = {}

                        for idx, (key, value) in enumerate(updates.items(), start=1):
                            # Use placeholders for attribute names to avoid conflicts with reserved keywords
                            attribute_name_placeholder = f"#attrName{idx}"
                            expression_attribute_names[attribute_name_placeholder] = key

                            # Use placeholders for attribute values
                            attribute_value_placeholder = f":attrValue{idx}"
                            expression_attribute_values[attribute_value_placeholder] = value

                            # Build the update expression using placeholders
                            update_expression += f"{attribute_name_placeholder} = {attribute_value_placeholder}, "

                        # Remove the trailing comma and space from the update expression
                        update_expression = update_expression.rstrip(", ")

                        # Perform the update operation
                        table.update_item(
                            Key={'id': team_id},
                            UpdateExpression=update_expression,
                            ExpressionAttributeNames=expression_attribute_names,
                            ExpressionAttributeValues=expression_attribute_values
                        )
                        logging.info(f"Updated {updates} for team {team_id}")

    logging.info("Process completed")
    return {
        'statusCode': 200,
        'body': json.dumps('Successfully processed')
    }


# event = {
#   "Records": [
#     {
#       "messageId": "1-7ad6-4c79-903e-049f59b8c1b8",
#       "receiptHandle": "MessageReceiptHandle",
#       "body": "[5226]",
#       "attributes": {
#         "ApproximateReceiveCount": "1",
#         "SentTimestamp": "1641234567890",
#         "SenderId": "ARO123EXAMPLE123:example",
#         "ApproximateFirstReceiveTimestamp": "1641234567890"
#       },
#       "messageAttributes": {},
#       "md5OfBody": "098f6bcd4621d373cade4e832627b4f6",
#       "eventSource": "aws:sqs",
#       "eventSourceARN": "arn:aws:sqs:us-east-1:123456789012:YourQueue",
#       "awsRegion": "us-east-1"
#     }
#   ]
# }

# handler(event)
