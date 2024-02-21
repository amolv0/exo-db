import boto3
import json
from decimal import Decimal

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')

def transform_match_data(match, division_id, division_name, event_id, event_name, event_start, season):
    if isinstance(match, dict) and 'id' in match:
        match['division_id'] = division_id
        match['division_name'] = division_name
        match['event_id'] = event_id
        match['event_name'] = event_name
        match['event_start'] = event_start
        match['season'] = season
        match.pop('event', None)
        match.pop('division', None)
        return match
    else:
        return None

def extract_matches_from_event(item):
    event_id = item['id']
    event_name = item.get('name', None)
    event_start = item.get('start', None)
    season_obj = item.get('season', None)
    if season_obj != None: season = season_obj.get('id', None)
    else: season = None
    matches = []
    if 'divisions' in item:
        for division in item['divisions']:
            division_id = division['id']
            division_name = division.get('name', None)
            if 'matches' in division:
                for match in division['matches']:
                    transformed_match = transform_match_data(match, division_id, division_name, event_id, event_name, event_start, season)
                    if transformed_match is not None:
                        matches.append(transformed_match)
    return matches

def batch_write_matches(match_table, matches):
    with match_table.batch_writer() as batch:
        for match in matches:
            batch.put_item(Item=match)

def update_matches_for_all_events(event_table, match_table):
    scan_kwargs = {}
    page = 0
    count = 0
    while True:
        page += 1
        print(f"Scanning page {page}")
        response = event_table.scan(**scan_kwargs)
        for item in response.get('Items', []):
            count += 1
            print(f"Adding matches from event {item['id']}. {count} events processed")
            matches = extract_matches_from_event(item)
            if matches:
                batch_write_matches(match_table, matches)
        if 'LastEvaluatedKey' in response:
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
        else:
            break

def update_matches_for_single_event(event_table, match_table, event_id):
    try:
        response = event_table.get_item(Key={'id': event_id})
        item = response.get('Item', None)
        if item:
            matches = extract_matches_from_event(item)
            if matches:
                batch_write_matches(match_table, matches)
                print(f"Updated matches for event ID: {event_id}")
            else:
                print(f"No matches found for event ID: {event_id}")
        else:
            print(f"No event found with ID: {event_id}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == '__main__':
    event_table = dynamodb.Table('event-data')
    match_table = dynamodb.Table('match-data')
    
    
    # To update matches for all events
    update_matches_for_all_events(event_table, match_table)
    
    # To update matches for a single event
    # test_event_id = 51500
    # update_matches_for_single_event(event_table, match_table, test_event_id)
