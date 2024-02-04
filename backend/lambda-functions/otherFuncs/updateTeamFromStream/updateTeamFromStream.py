import boto3
import json
import logging
from boto3.dynamodb.types import TypeDeserializer

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')

# Initialize a TypeDeserializer for unmarshalling
deserializer = TypeDeserializer()

event_data_table = dynamodb.Table('event-data')
team_data_table = dynamodb.Table('team-data')

logging = logging.getLogger()
logging.setLevel("ERROR")

def unmarshall_dynamodb_item(item):
    return {k: deserializer.deserialize(v) for k, v in item.items()}

def process_match(match):
    teams = extract_teams_from_match(match)
    for team in teams:
        team_id = team['team']['id']
        update_team_data_with_match(team_id, match)

def extract_teams_from_match(match):
    teams = []
    for alliance in match.get('alliances', []):
        teams.extend(alliance.get('teams', []))
    return teams

def update_team_data_with_match(team_id, match):
    # Ensure the match data is in the correct format for DynamoDB
    response = team_data_table.update_item(
        Key={'id': int(team_id)},
        UpdateExpression='SET matches = list_append(if_not_exists(matches, :empty_list), :match)',
        ExpressionAttributeValues={
            ':match': [match],
            ':empty_list': [],
        },
        ReturnValues='UPDATED_NEW'
    )
    logging.info(f"Updated team-data for team ID {team_id} with match data.")
    # logging.info(f"Response: {response}")

def find_updated_matches(old_divisions, new_divisions):
    updated_matches = []
    for new_division in new_divisions:
        for old_division in old_divisions:
            if new_division['id'] == old_division['id'] and 'matches' in new_division and 'matches' in old_division:  # Assuming each division has a unique 'id'
                old_match_ids = {match['id'] for match in old_division['matches']}
                new_match_ids = {match['id'] for match in new_division['matches']}
                updated_match_ids = new_match_ids.difference(old_match_ids)
                updated_matches.extend([match for match in new_division['matches'] if match['id'] in updated_match_ids])
                break  # Move to the next new_division after finding the matching old_division
    return updated_matches

def find_new_teams(old_teams, new_teams):
    old_team_ids = {team for team in old_teams}
    new_team_ids = {team for team in new_teams}
    return new_team_ids.difference(old_team_ids)

def find_removed_teams(old_teams, new_teams):
    old_team_ids = {team for team in old_teams}
    new_team_ids = {team for team in new_teams}
    return old_team_ids.difference(new_team_ids)

def find_removed_matches(old_matches, new_matches):
    old_match_ids = {match['id'] for match in old_matches}
    new_match_ids = {match['id'] for match in new_matches}
    removed_match_ids = old_match_ids.difference(new_match_ids)
    return [match for match in old_matches if match['id'] in removed_match_ids]

def update_team_events(team_id, event_data):
    # Convert 'awards_finalized' from bool to a lowercase string
    if 'awards_finalized' in event_data and isinstance(event_data['awards_finalized'], bool):
        event_data['awards_finalized'] = str(event_data['awards_finalized']).lower()

    response = team_data_table.update_item(
        Key={'id': int(team_id)},
        UpdateExpression='SET events = list_append(if_not_exists(events, :empty_list), :event)', 
        ExpressionAttributeValues={
            ':event': [event_data],
            ':empty_list': [],
        },
        ReturnValues='UPDATED_NEW'
    )
    logging.info(f"Updated team-data for team ID {team_id} with event data.")
    # logging.info(f"Response: {response}")

def remove_event_for_team(team_id, event_id):
    # Fetch the current team item
    response = team_data_table.get_item(Key={'id': int(team_id)})
    if 'Item' in response:
        team_item = response['Item']
        if 'events' in team_item:
            updated_events = [event for event in team_item['events'] if event['id'] != event_id]
            team_data_table.update_item(
                Key={'id': int(team_id)},
                UpdateExpression='SET events = :updated_events',
                ExpressionAttributeValues={':updated_events': updated_events}
            )
            logging.info(f"Removed event {event_id} from team ID {team_id}")

def remove_match_for_team(team_id, match_id):
    # Fetch the current team item
    response = team_data_table.get_item(Key={'id': int(team_id)})
    if 'Item' in response and 'matches' in response['Item']:
        # Filter out the match to be removed
        updated_matches = [match for match in response['Item']['matches'] if match['id'] != match_id]
        
        # Update the team item with the modified matches list
        team_data_table.update_item(
            Key={'id': int(team_id)},
            UpdateExpression='SET matches = :updated_matches',
            ExpressionAttributeValues={':updated_matches': updated_matches}
        )
        logging.info(f"Removed match {match_id} from team ID {team_id}")

def handler(aws_event, context):
    logging.info("Beginning team update process")
    for record in aws_event['Records']:
        if record['eventName'] == 'MODIFY':
            # Unmarshall the DynamoDB images to regular Python dictionaries
            new_image = unmarshall_dynamodb_item(record['dynamodb']['NewImage'])
            old_image = unmarshall_dynamodb_item(record['dynamodb']['OldImage'])

            # Convert 'awards_finalized' to a lowercase string representation
            if 'awards_finalized' in new_image and isinstance(new_image['awards_finalized'], bool):
                new_image['awards_finalized'] = str(new_image['awards_finalized']).lower()

            # Process new/removed matches
            # Check if 'divisions' exists and contains 'matches'
            if 'divisions' in new_image and 'divisions' in old_image:
                new_divisions = new_image['divisions']
                old_divisions = old_image['divisions']
                
                # Process new/removed matches within divisions
                updated_matches = find_updated_matches(old_divisions, new_divisions)
                for match in updated_matches:
                    process_match(match)

            # Process new/removed teams
            if 'teams' in new_image and 'teams' in old_image:
                # Process new teams
                new_teams = find_new_teams(old_image['teams'], new_image['teams'])
                event_data = new_image  # Using the entire new_image as event data for simplicity
                for team_id in new_teams:
                    update_team_events(team_id, event_data)
                # Process removed teams
                removed_teams = find_removed_teams(old_image['teams'], new_image['teams'])
                event_id = new_image.get('id')
                if removed_teams and event_id:
                    for team_id in removed_teams:
                        remove_event_for_team(team_id, event_id)

    logging.info("Process complete")
    return {
        'statusCode': 200,
        'body': json.dumps("Processing completed")
    }