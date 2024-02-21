import boto3
import json
from decimal import Decimal

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')

def transform_ranking_data(ranking, division_id, division_name, event_id, event_name, event_start):
    if isinstance(ranking, dict) and 'id' in ranking:
        ranking['division_id'] = division_id
        ranking['division_name'] = division_name
        ranking['event_id'] = event_id
        ranking['event_name'] = event_name
        ranking['event_start'] = event_start
        ranking.pop('event', None)
        ranking.pop('division', None)
        return ranking
    else:
        return None

def extract_rankings_from_event(item):
    event_id = item['id']
    event_name = item.get('name', None)
    event_start = item.get('start', None)
    rankings = []
    if 'divisions' in item:
        for division in item['divisions']:
            division_id = division['id']
            division_name = division.get('name', None)
            if 'rankings' in division:
                for ranking in division['rankings']:
                    transformed_ranking = transform_ranking_data(ranking, division_id, division_name, event_id, event_name, event_start)
                    if transformed_ranking is not None:
                        rankings.append(transformed_ranking)
    return rankings

def batch_write_rankings(ranking_table, rankings):
    with ranking_table.batch_writer() as batch:
        for ranking in rankings:
            batch.put_item(Item=ranking)

def update_rankings_for_all_events(event_table, ranking_table):
    scan_kwargs = {}
    page = 0
    count = 0
    while True:
        page += 1
        print(f"Scanning page {page}")
        response = event_table.scan(**scan_kwargs)
        for item in response.get('Items', []):
            rankings = extract_rankings_from_event(item)
            count += 1
            print(f"Adding rankings from event {count}")
            if rankings:
                batch_write_rankings(ranking_table, rankings)
        if 'LastEvaluatedKey' in response:
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
        else:
            break

def update_rankings_for_single_event(event_table, ranking_table, event_id):
    try:
        response = event_table.get_item(Key={'id': event_id})
        item = response.get('Item', None)
        if item:
            rankings = extract_rankings_from_event(item)
            if rankings:
                batch_write_rankings(ranking_table, rankings)
                print(f"Updated rankings for event ID: {event_id}")
            else:
                print(f"No rankings found for event ID: {event_id}")
        else:
            print(f"No event found with ID: {event_id}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == '__main__':
    event_table = dynamodb.Table('event-data')
    ranking_table = dynamodb.Table('rankings-data')
    
    
    # To update rankings for all events
    # update_rankings_for_all_events(event_table, ranking_table)
    
    # To update rankings for a single event 
    # test_event_id = 51500
    # update_rankings_for_single_event(event_table, ranking_table, test_event_id)
