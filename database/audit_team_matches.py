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

def remove_duplicate_matches(matches):
    """Remove duplicates from the matches list and maintain order."""
    seen = set()
    unique_matches = [x for x in matches if not isinstance(x, dict) and not (x in seen or seen.add(x))]
    return unique_matches

def update_item_matches(team_id, unique_matches):
    global count
    count += 1
    """Update the item's matches with a list of unique matches."""
    response = table.update_item(
        Key={'id': Decimal(team_id)},
        UpdateExpression='SET matches = :val',
        ExpressionAttributeValues={
            ':val': unique_matches,
        }
    )
    logging.info(f"Updated team {team_id} with unique matches. {count} teams updated")

def process_single_item(team_id):
    """Process a single item for duplicate matches."""
    response = table.get_item(Key={'id': Decimal(team_id)})
    item = response.get('Item', {})
    if 'matches' in item:
        unique_matches = remove_duplicate_matches(item['matches'])
        if len(unique_matches) != len(item['matches']):
            update_item_matches(team_id, unique_matches)

def process_entire_table():
    """Scan through the entire table and process each item for duplicate matches."""
    scan_kwargs = {
        'ProjectionExpression': "id, matches"
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
            if 'matches' in item:
                unique_matches = remove_duplicate_matches(item['matches'])
                if len(unique_matches) != len(item['matches']):
                    update_item_matches(item['id'], unique_matches)
        start_key = response.get('LastEvaluatedKey', None)
        done = start_key is None

# Example usage:
# process_single_item(team_id=85881)  # Replace 123 with the actual team ID for testing
process_entire_table()
