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
match_data_table = dynamodb.Table('match-data')
skills_data_table = dynamodb.Table('skills-data') 
skills_ranking_data_table = dynamodb.Table('skills-ranking-data')
rankings_data_table = dynamodb.Table('rankings-data')
awards_data_table = dynamodb.Table('award-data')

logging = logging.getLogger()
logging.setLevel("ERROR")

def unmarshall_dynamodb_item(item):
    return {k: deserializer.deserialize(v) for k, v in item.items()}

def process_match(match, division_name, division_id, event_name, event_id, event_start):
    teams = extract_teams_from_match(match)
    for team in teams:
        team_id = team['team']['id']
        if 'id' in match:
            match_id = match['id']
            update_team_data_with_match(team_id, match_id)
            update_match_data_with_match(match, division_name, division_id, event_name, event_id, event_start)
        

def extract_teams_from_match(match):
    teams = []
    for alliance in match.get('alliances', []):
        teams.extend(alliance.get('teams', []))
    return teams

def update_team_data_with_match(team_id, match_id):
    # Ensure the match data is in the correct format for DynamoDB
    response = team_data_table.update_item(
        Key={'id': int(team_id)},
        UpdateExpression='SET matches = list_append(if_not_exists(matches, :empty_list), :match)',
        ExpressionAttributeValues={
            ':match': [match_id],
            ':empty_list': [],
        },
        ReturnValues='UPDATED_NEW'
    )
    logging.info(f"Updated team-data for team ID {team_id} with match id {match_id}.")

def update_team_data_with_award(team_id, award_id):
    response = team_data_table.update_item(
        Key={'id': int(team_id)},
        UpdateExpression='SET awards = list_append(if_not_exists(awards, :empty_list), :match)',
        ExpressionAttributeValues={
            ':award': [award_id],
            ':empty_list': [],
        },
        ReturnValues='UPDATED_NEW'
    )
    logging.info(f"Updated team-data for team ID {team_id} with award id {award_id}.")
    
def update_team_data_with_ranking(team_id, ranking_id):
    response = team_data_table.update_item(
        Key={'id': int(team_id)},
        UpdateExpression='SET rankings = list_append(if_not_exists(rankings, :empty_list), :match)',
        ExpressionAttributeValues={
            ':match': [ranking_id],
            ':empty_list': [],
        },
        ReturnValues='UPDATED_NEW'
    )
    logging.info(f"Updated team-data for team ID {team_id} with ranking id {ranking_id}.")

def update_match_data_with_match(match, division_name, division_id, event_name, event_id, event_start):
    # Extract the match ID and use it as the primary key
    match_id = match.pop('id')  # This removes the 'id' key and gets its value

    # Now, match_id is the primary key, and match is the rest of the match data
    response = match_data_table.put_item(
        Item={
            'id': match_id,  # Set the primary key
            'division_name': division_name,
            'division_id': division_id,
            'event_name': event_name,
            'event_id': event_id,
            'event_start': event_start,
            **match  # Spread the remaining match data as item attributes
        }
    )
    logging.info(f"Posted match data with match ID {match_id}, division '{division_name}' ({division_id}), and event '{event_name}' ({event_id}) to DynamoDB.")



def update_rankings_data(division_name, division_id, event_name, event_id, event_start, program, season, ranking):
    rankings_data_table.put_item(
        Item={
            'division_id': division_id,
            'division_name': division_name,
            'event_id': event_id,
            'event_name': event_name,
            'event_start': event_start,
            'program': program,
            'season': season,
            **ranking  # Assuming the rest of the ranking information is to be stored as is
        }
    )
    logging.info(f"Updated ranking {ranking['id']} for division {division_name} ({division_id}) of event {event_name} ({event_id}).")


def update_awards_data(event_id, awards, program, season):
    for award in awards:
        awards_data_table.put_item(
            Item={
                'program': program,
                'season': season,
                **award
            }
        )
        logging.info(f"Posted award data with award ID {award['id']} to DynamoDB.")

def find_updated_matches(old_divisions, new_divisions):
    updated_matches = []
    for new_division in new_divisions:
        for old_division in old_divisions:
            if new_division['id'] == old_division['id'] and 'matches' in new_division and 'matches' in old_division:
                logging.info(f"Looking at division id: {new_division['id']}")

                # Convert old matches to a dictionary for easier lookup by match id
                old_matches_dict = {match['id']: match for match in old_division['matches'] if isinstance(match, dict)}

                for new_match in new_division['matches']:
                    if isinstance(new_match, dict):
                        match_id = new_match['id']
                        # Check if the match is new or if the match data has changed
                        if match_id not in old_matches_dict or new_match != old_matches_dict[match_id]:
                            updated_matches.append({
                                'division_id': new_division['id'],
                                'division_name': new_division.get('name', 'Unknown Division'),
                                **new_match
                            })
                            logging.info(f"Updated or new match found: {match_id}")

    return updated_matches

def find_updated_rankings(old_divisions, new_divisions):
    updated_rankings = []
    for new_division in new_divisions:
        for old_division in old_divisions:
            if new_division['id'] == old_division['id'] and 'rankings' in new_division and 'rankings' in old_division:
                logging.info(f"Looking at division id: {new_division['id']} for updated matches")
                old_rankings_dict = {ranking['id']: ranking for ranking in old_division['rankings'] if isinstance(ranking, dict)}

                for new_ranking in new_division['rankings']:
                    if isinstance(new_ranking, dict):
                        ranking_id = new_ranking['id']
                        if ranking_id not in old_rankings_dict or new_ranking != old_rankings_dict[ranking_id]:
                            updated_rankings.append({
                                'division_id': new_division['id'],
                                'division_name': new_division.get('name', 'Unknown Division'),
                                **new_ranking
                            })
                            logging.info(f"Updated or new ranking found: {ranking_id}")
    return updated_rankings

def find_updated_awards(old_awards, new_awards):
    updated_awards = []
    if new_awards != old_awards:
        updated_awards = new_awards
    return updated_awards

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

def find_updated_skills(old_skills, new_skills):
    # Create dictionaries for quick ID-based lookup
    old_skills_dict = {skill['id']: skill for skill in old_skills}
    new_skills_dict = {skill['id']: skill for skill in new_skills}

    # Find new and changed skills
    updated_skills = []
    for skill_id, new_skill in new_skills_dict.items():
        old_skill = old_skills_dict.get(skill_id)
        # If the skill is new or has changed, add it to the list
        if not old_skill or new_skill != old_skill:
            updated_skills.append(new_skill)

    logging.info(f"Updated Skills: {updated_skills}")
    return updated_skills

def update_team_events(team_id, event_data):
    event_id = event_data['id']  # Assuming event_id is a number

    response = team_data_table.update_item(
        Key={'id': int(team_id)},
        UpdateExpression='SET events = list_append(if_not_exists(events, :empty_list), :event_id)',
        ExpressionAttributeValues={
            ':event_id': [event_id],  # Append the event_id directly
            ':empty_list': [],
        },
        ReturnValues='UPDATED_NEW'
    )
    logging.info(f"Updated team-data for team ID {team_id} with event ID {event_id}.")

def remove_event_for_team(team_id, event_id):
    # Fetch the current team item
    response = team_data_table.get_item(Key={'id': int(team_id)})
    logging.info(f"Removing event from team_id {team_id}")
    if 'Item' in response:
        team_item = response['Item']
        if 'events' in team_item:
            updated_events = [event for event in team_item['events'] if event != event_id]
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
        updated_matches = [match for match in response['Item']['matches'] if match != match_id]
        
        # Update the team item with the modified matches list
        team_data_table.update_item(
            Key={'id': int(team_id)},
            UpdateExpression='SET matches = :updated_matches',
            ExpressionAttributeValues={':updated_matches': updated_matches}
        )
        logging.info(f"Removed match {match_id} from team ID {team_id}")

def process_skills_updates(updated_skills, event_id, event_name, event_start, region):
    update_skills_ranking_data(updated_skills, event_id, event_name, event_start, region)
    # Process each updated skill
    for skill in updated_skills:
        skill_id = skill['id']
        team_id = skill['team']['id']
        team_number = skill['team']['name']
        skill.pop('team', None)
        # Update skills-data table
        skills_data_table.put_item(
            Item={
                'id': skill_id,
                'event_id': event_id,
                'event_name': event_name,
                'event_start': event_start,
                'team_id': team_id,
                'team_number': team_number,
                **skill  # Include all other skill attributes
            }
        )
        logging.info(f"Updated skills-data for {skill_id}, of event {event_id}")
        # Since we're only dealing with updated skills, there's no need to check for removed skills here

    # Update skills-ranking-data table based on the updated skills

def update_skills_ranking_data(skills, event_id, event_name, event_start, region):
    highest_scores = {}  # Format: {(team_id, type): (score, skills_id, team_number)}
    unique_items = {}  # Items to be updated in the skills-ranking-data table

    # Iterate through each skill item
    for skill_item in skills:
        team_id = skill_item['team']['id']
        skill_type = skill_item['type']
        score = skill_item['score']
        skills_id = skill_item['id']
        season = skill_item['season']['id']
        team_number = skill_item['team']['name'] 

        # Fetch team data
        response = team_data_table.get_item(Key={'id': team_id})
        team_info = response.get('Item', {})
        team_name = team_info.get('team_name', "")
        team_org = team_info.get('organization', "")
        program = team_info.get('program', "")

        key = (event_id, team_id, skill_type)
        if key not in highest_scores or score > highest_scores[key][0]:
            highest_scores[key] = (score, skills_id, team_number, team_name, team_org)

    # Prepare items for skills-ranking-data table
    for (event_id, team_id, skill_type), (score, skills_id, team_number, team_name, team_org) in highest_scores.items():
        item_key = f"{event_id}-{team_id}-{skill_type}"
        unique_items[item_key] = {
            'event_team_id': item_key,
            'type': skill_type,
            'score': score,
            'skills_id': skills_id,
            'event_id': event_id,
            'event_name': event_name,
            'event_start': event_start,
            'team_id': team_id,
            'team_number': team_number,
            'team_name': team_name,
            'team_org': team_org,
            'season': season,
            'program': program,
            'region': region
        }

        # Check for 'robot' entry creation
        opposite_type = 'programming' if skill_type == 'driver' else 'driver'
        opposite_key = (event_id, team_id, opposite_type)
        if opposite_key in highest_scores:
            robot_score = score + highest_scores[opposite_key][0]
            robot_item_key = f"{event_id}-{team_id}"
            unique_items[robot_item_key] = {
                'event_team_id': robot_item_key,
                'type': 'robot',
                'score': robot_score,
                'event_id': event_id,
                'event_name': event_name,
                'event_start': event_start,
                'team_id': team_id,
                'team_number': team_number,
                'team_name': team_name,
                'team_org': team_org,
                'season': season,
                'program': program,
                'region': region
            }
        else:
            # If the opposite type doesn't exist, use the same score for 'robot'
            robot_item_key = f"{event_id}-{team_id}"
            unique_items[robot_item_key] = {
                'event_team_id': robot_item_key,
                'type': 'robot',
                'score': robot_score,
                'event_id': event_id,
                'event_name': event_name,
                'event_start': event_start,
                'team_id': team_id,
                'team_number': team_number,
                'team_name': team_name,
                'team_org': team_org,
                'season': season,
                'program': program,
                'region': region
            }


    # Update skills-ranking-data table
    with skills_ranking_data_table.batch_writer() as batch:
        for item in unique_items.values():
            batch.put_item(Item=item)

def handler(aws_event, context):
    logging.error("Beginning stream update process")
    for record in aws_event['Records']:
        if record['eventName'] == 'MODIFY':
            # Unmarshall the DynamoDB images to regular Python dictionaries
            new_image = unmarshall_dynamodb_item(record['dynamodb']['NewImage'])
            old_image = unmarshall_dynamodb_item(record['dynamodb']['OldImage'])
            event_id = new_image.get('id')
            event_name = new_image.get('name', None)
            event_start = new_image.get('start', None)
            program = new_image.get('program', None)
            season_obj = new_image.get('season', None)
            region = new_image.get('region', None)
            if season_obj != None: season = season_obj.get('code', None)
            else: season = None
            logging.error(f"Updating data from stream for event id: {event_id}, name: {event_name}")
            # Convert 'awards_finalized' to a lowercase string representation
            if 'awards_finalized' in new_image and isinstance(new_image['awards_finalized'], bool):
                new_image['awards_finalized'] = str(new_image['awards_finalized']).lower()

            # Process new/removed matches and rankings
            # Check if 'divisions' exists and
            if 'divisions' in new_image and 'divisions' in old_image:
                new_divisions = new_image['divisions']
                old_divisions = old_image['divisions']
                updated_rankings = find_updated_rankings(old_divisions, new_divisions)
                updated_matches = find_updated_matches(old_divisions, new_divisions)
                logging.info(updated_matches)

                # Process new/removed matches within divisions
                for match in updated_matches:
                    division_id = match['division_id']
                    division_name = match['division_name']
                    process_match(match, division_name, division_id, event_name, event_id)
                

                # Process new/removed rankings within divisions
                for updated_ranking in updated_rankings:
                    division_id = updated_ranking['division_id']
                    division_name = updated_ranking['division_name']
                    update_rankings_data(division_name, division_id, event_name, event_id, event_start, program, season, updated_ranking)
                    update_team_data_with_ranking(updated_ranking['team']['id'], updated_ranking['id'])

            if 'awards' in new_image and 'awards' in old_image:
                updated_awards = find_updated_awards(old_image['awards'], new_image['awards'])
                update_awards_data(new_image['id'], updated_awards, program, season)
                for award in updated_awards:
                    team_id = award.get('team', {}).get('id')
                    if team_id:
                        update_team_data_with_award(team_id, new_image['id'])

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

            # Check if 'skills' data has been updated
            if 'skills' in new_image and 'skills' in old_image:
                new_skills = new_image.get('skills', [])
                old_skills = old_image.get('skills', [])

                updated_skills = find_updated_skills(old_skills, new_skills)
                if updated_skills:
                    logging.info(f"Processing {len(updated_skills)} new/changed skills.")
                    # Assuming process_skills_updates is modified to accept only the updated_skills list
                    process_skills_updates(updated_skills, event_id, event_name, event_start, region)

    logging.info("Process complete")
    return {
        'statusCode': 200,
        'body': json.dumps("Processing completed")
    }