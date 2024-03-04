import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal
import logging

# Initialize DynamoDB resource and table
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('team-data')

# Setup logging
logging.basicConfig(level=logging.INFO)
count = 0

def remove_duplicate_events(events):
    """Remove duplicates from the events list and maintain order."""
    seen = set()
    unique_events = [x for x in events if not (x in seen or seen.add(x))]
    return unique_events

def update_item_events(team_id, unique_events):
    global count
    count += 1
    """Update the item's events with a list of unique events."""
    response = table.update_item(
        Key={'id': Decimal(team_id)},
        UpdateExpression='SET events = :val',
        ExpressionAttributeValues={
            ':val': unique_events,
        }
    )
    logging.info(f"Updated team {team_id} with unique events. {count} teams updated")

def process_single_item(team_id):
    """Process a single item for duplicate events."""
    response = table.get_item(Key={'id': Decimal(team_id)})
    item = response.get('Item', {})
    if 'events' in item:
        unique_events = remove_duplicate_events(item['events'])
        if len(unique_events) != len(item['events']):
            update_item_events(team_id, unique_events)

def process_entire_table():
    """Scan through the entire table and process each item for duplicate events."""
    scan_kwargs = {
        'ProjectionExpression': "id, events"
    }
    done = False
    start_key = None
    pages = 0
    while not done:
        pages += 1
        logging.info(f"Scanned page {pages}")
        if start_key:
            scan_kwargs['ExclusiveStartKey'] = start_key
        response = table.scan(**scan_kwargs)
        for item in response.get('Items', []):
            if 'events' in item:
                unique_events = remove_duplicate_events(item['events'])
                if len(unique_events) != len(item['events']):
                    update_item_events(item['id'], unique_events)
        start_key = response.get('LastEvaluatedKey', None)
        done = start_key is None

# Example usage:
# process_single_item(team_id=5226)  # Replace 123 with the actual team ID for testing
process_entire_table()
