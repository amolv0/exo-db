import boto3
import json
import logging

dynamodb = boto3.client('dynamodb')
sqs_client = boto3.client('sqs')

logging = logging.getLogger()
logging.setLevel("INFO")

def query_registered_teams(table_name, index_name, exclusive_start_key=None):
    query_params = {
        'TableName': table_name,
        'IndexName': index_name,
        'KeyConditionExpression': 'registered = :val1',
        'ExpressionAttributeValues': {
            ':val1': {'S': 'true'}
        },
        'ProjectionExpression': 'id'
    }
    if exclusive_start_key:
        query_params['ExclusiveStartKey'] = exclusive_start_key
    return dynamodb.query(**query_params)

def scan_for_unregistered_items(table_name, exclusive_start_key=None):
    scan_params = {
        'TableName': table_name,
        'FilterExpression': 'attribute_not_exists(registered)',
        'ProjectionExpression': 'id'
    }
    if exclusive_start_key:
        scan_params['ExclusiveStartKey'] = exclusive_start_key

    response = dynamodb.scan(**scan_params)
    return response

def handler(event):
    logging.info("Starting process")
    queue_url = 'REDACTED_SQS_URL/AuditTeamDataQueue'
    table_name = 'team-data'
    index_name = 'RegisteredIndex'

    batch = []
    
    response = query_registered_teams(table_name, index_name)
    count = 0
    while True:
        for item in response['Items']:
            team_id = int(item['id']['N'])  
            batch.append(team_id)
            if len(batch) == 500:
                logging.info(f"Sending batch to queue: batch {count}")
                count += 1
                sqs_client.send_message(QueueUrl=queue_url, MessageBody=json.dumps(batch))
                batch = []
        if 'LastEvaluatedKey' in response:
            response = query_registered_teams(
                table_name=table_name,
                index_name=index_name,
                exclusive_start_key=response['LastEvaluatedKey']
            )
        else:
            break

    if batch:
        count += 1
        sqs_client.send_message(QueueUrl=queue_url, MessageBody=json.dumps(batch))
    logging.info(f"Successfully sent {count} messages to SQS")
    return {
        'statusCode': 200,
        'body': json.dumps(f'Successfully processed registered teams and sent {count} messages to SQS.')
    }

# event = {
#   "Records": [
#     {
#       "messageId": "1-7ad6-4c79-903e-049f59b8c1b8",
#       "receiptHandle": "MessageReceiptHandle",
#       "body": "[168459]",
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