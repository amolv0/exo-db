import boto3
import json
import logging

# Initialize the DynamoDB and SQS clients outside the handler function to use AWS Lambda's execution context reuse feature
dynamodb = boto3.client('dynamodb')
sqs_client = boto3.client('sqs')

logging = logging.getLogger()
logging.setLevel("INFO")

def query_registered_teams(table_name, index_name, exclusive_start_key=None):
    query_params = {
        'TableName': table_name,
        'IndexName': index_name,
        'KeyConditionExpression': 'registered = :val',
        'ExpressionAttributeValues': {':val': {'S': 'true'}},
        'ProjectionExpression': 'id'
    }
    if exclusive_start_key:
        query_params['ExclusiveStartKey'] = exclusive_start_key
    return dynamodb.query(**query_params)

def handler(event, context):
    logging.info("Starting process")
    queue_url = 'REDACTED_SQS_URL/AuditTeamDataQueue'
    table_name = 'team-data'
    index_name = 'RegisteredIndex'

    # Keep track of the batch of team IDs
    batch = []

    # Start the query process
    response = query_registered_teams(table_name, index_name)
    count = 0
    while True:
        # Process the query response
        for item in response['Items']:
            team_id = int(item['id']['N'])  # Adjust based on actual attribute type
            batch.append(team_id)
            # Send batch if it reaches the size limit
            if len(batch) == 500:
                logging.info(f"Sending batch to queue: batch {count}")
                count += 1
                sqs_client.send_message(QueueUrl=queue_url, MessageBody=json.dumps(batch))
                batch = []

        # Check if there are more items to query (pagination)
        if 'LastEvaluatedKey' in response:
            response = query_registered_teams(
                table_name=table_name,
                index_name=index_name,
                exclusive_start_key=response['LastEvaluatedKey']
            )
        else:
            break

    # Send any remaining team IDs in the last batch
    if batch:
        count += 1
        sqs_client.send_message(QueueUrl=queue_url, MessageBody=json.dumps(batch))
    logging.info(f"Successfully sent {count} messages to SQS")
    return {
        'statusCode': 200,
        'body': json.dumps(f'Successfully processed registered teams and sent {count} messages to SQS.')
    }
