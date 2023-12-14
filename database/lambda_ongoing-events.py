import boto3
from datetime import datetime, timedelta

def lambda_handler(event, context):
    # Connect to DynamoDB
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('events')

    # Calculate date range
    one_year_ago = datetime.now() - timedelta(days=365)
    one_year_ago_str = one_year_ago.strftime('%Y-%m-%dT%H:%M:%S')

    # Update the scan method
    response = table.scan(
        FilterExpression="#start_date >= :val and ongoing = :true",
        ExpressionAttributeNames={
            '#start_date': 'start'
        },
        ExpressionAttributeValues={
            ':val': one_year_ago_str,
            ':true': True
        }
    )

   # Print all events checked
    print("Checking the following events for ongoing status:")
    for item in response['Items']:
        event_id = item.get('event-id', 'N/A')  # Access event-id directly
        ongoing = item.get('ongoing', False)
        print(f"Event ID: {event_id}, Ongoing: {ongoing}")

    # Extract ongoing event IDs
    ongoing_event_ids = [str(item['event-id']) for item in response['Items'] if item.get('ongoing', False)]

    return ongoing_event_ids

lambda_handler(None, None)  # For local testing
