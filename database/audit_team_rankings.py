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

def remove_duplicate_and_small_rankings(rankings):
    """Remove duplicates from the rankings list, discard rankings < 10, and maintain order."""
    seen = set()
    unique_rankings = [x for x in rankings if x >= 10 and not (x in seen or seen.add(x))]
    return unique_rankings

def update_item_rankings(team_id, unique_rankings):
    global count
    count += 1
    """Update the item's rankings with a list of unique rankings."""
    response = table.update_item(
        Key={'id': Decimal(team_id)},
        UpdateExpression='SET rankings = :val',
        ExpressionAttributeValues={
            ':val': unique_rankings,
        }
    )
    logging.info(f"Updated team {team_id} with unique rankings. {count} teams updated")

def process_single_item(team_id):
    """Process a single item for duplicate rankings."""
    response = table.get_item(Key={'id': Decimal(team_id)})
    item = response.get('Item', {})
    if 'rankings' in item:
        unique_rankings = remove_duplicate_and_small_rankings(item['rankings'])
        if len(unique_rankings) != len(item['rankings']):
            update_item_rankings(team_id, unique_rankings)

def process_entire_table():
    """Scan through the entire table and process each item for duplicate rankings."""
    scan_kwargs = {
        'ProjectionExpression': "id, rankings"
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
            if 'rankings' in item:
                unique_rankings = remove_duplicate_and_small_rankings(item['rankings'])
                if len(unique_rankings) != len(item['rankings']):
                    update_item_rankings(item['id'], unique_rankings)
        start_key = response.get('LastEvaluatedKey', None)
        done = start_key is None

# process_single_item(team_id=93544) 
process_entire_table()
