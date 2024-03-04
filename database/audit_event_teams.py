import boto3
from decimal import Decimal
import logging

# Initialize DynamoDB resource and table for event-data
dynamodb = boto3.resource('dynamodb')
event_table = dynamodb.Table('event-data')  # Replace with your actual table name

# Setup logging
logging.basicConfig(level=logging.INFO)
update_count = 0

def remove_duplicate_teams(teams):
    """Remove duplicates from the teams list and maintain order."""
    seen = set()
    unique_teams = [x for x in teams if not (x in seen or seen.add(x))]
    return unique_teams

def update_event_teams(event_id, unique_teams):
    global update_count
    update_count += 1
    """Update the event's teams with a list of unique team IDs."""
    # response = event_table.update_item(
    #     Key={'id': Decimal(event_id)}, 
    #     UpdateExpression='SET teams = :val',
    #     ExpressionAttributeValues={
    #         ':val': unique_teams,
    #     }
    # )
    logging.info(f"Updated event {event_id} with unique teams. Total updates: {update_count}")

def process_single_event(event_id):
    """Process a single event for duplicate team IDs."""
    response = event_table.get_item(Key={'id': Decimal(event_id)})
    item = response.get('Item', {})
    if 'teams' in item:
        unique_teams = remove_duplicate_teams(item['teams'])
        if len(unique_teams) != len(item['teams']):
            update_event_teams(event_id, unique_teams)

def process_entire_event_table():
    """Scan through the entire event-data table and process each event for duplicate team IDs."""
    scan_kwargs = {
        'ProjectionExpression': "id, teams"
    }
    done = False
    start_key = None
    pages = 0
    while not done:
        pages += 1
        logging.info(f"Scanning event-data table page {pages}")
        if start_key:
            scan_kwargs['ExclusiveStartKey'] = start_key
        response = event_table.scan(**scan_kwargs)
        for item in response.get('Items', []):
            if 'teams' in item:
                unique_teams = remove_duplicate_teams(item['teams'])
                if len(unique_teams) != len(item['teams']):
                    update_event_teams(item['id'], unique_teams)
        start_key = response.get('LastEvaluatedKey', None)
        done = start_key is None

# Example usage:
# process_single_event(event_id=1234)  # Replace 1234 with the actual event ID for testing
process_entire_event_table()
