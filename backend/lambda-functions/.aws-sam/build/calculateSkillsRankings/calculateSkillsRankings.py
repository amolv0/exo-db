import boto3
from boto3.dynamodb.conditions import Attr, Key
from botocore.exceptions import ClientError
from decimal import Decimal
import logging

dynamodb = boto3.resource('dynamodb')
skills_table = dynamodb.Table('skills-ranking-data')
team_table = dynamodb.Table('team-data')

logging = logging.getLogger()
logging.setLevel("INFO")

def query_skills_scores(season, skill_type):
    items = []
    last_evaluated_key = None
    logging.info("Scanning")
    page = 0
    while True:
        page += 1
        if last_evaluated_key:
            response = skills_table.query(
                IndexName='SeasonScoreIndex',
                KeyConditionExpression=Key('season').eq(season),
                FilterExpression=Attr('type').eq(skill_type),
                ScanIndexForward=False,  # Descending order by score
                ExclusiveStartKey=last_evaluated_key
            )
        else:
            response = skills_table.query(
                IndexName='SeasonScoreIndex',
                KeyConditionExpression=Key('season').eq(season),
                FilterExpression=Attr('type').eq(skill_type),
                ScanIndexForward=False
            )
        items.extend(response['Items'])

        last_evaluated_key = response.get('LastEvaluatedKey')
        if not last_evaluated_key:
            break
    return items

def compute_rankings(items, skill_type):
    # Initialize dictionaries for global rankings and regional rankings
    global_rankings = {}
    regional_rankings = {}

    # Initialize counters and seen sets for each grade level globally and regionally
    grade_levels = ['High School', 'Middle School', 'College']
    global_counters = {grade: 0 for grade in grade_levels}
    regional_counters = {}
    seen_global = {grade: set() for grade in grade_levels}
    seen_regional = {}

    # Sort items by score and, if equal, by programming_component
    sorted_items = sorted(items, key=lambda x: (-x['score'], -x.get('programming_component', 0)))
    for item in sorted_items:
        if 'team_grade' not in item or item['team_grade'] is None or item['team_grade'] == '': 
            continue
        team_id = item['team_id']
        team_grade = item['team_grade']
        region = item['region']

        # Update global rankings
        if team_id not in seen_global[team_grade]:
            seen_global[team_grade].add(team_id)
            global_counters[team_grade] += 1
            global_rankings[team_id] = global_counters[team_grade]

        # Initialize regional data structures if this is the first entry for the region
        if region not in seen_regional:
            seen_regional[region] = {grade: set() for grade in grade_levels}
            regional_counters[region] = {grade: 0 for grade in grade_levels}
            regional_rankings[region] = {}

        # Update regional rankings
        if team_id not in seen_regional[region][team_grade]:
            seen_regional[region][team_grade].add(team_id)
            regional_counters[region][team_grade] += 1
            # Ensure regional rankings are stored under the region and directly map team_id to rank
            regional_rankings[region][team_id] = regional_counters[region][team_grade]

    return global_rankings, regional_rankings



def update_skills_rankings(team_id, season, skill_type, rank):
    try:
        # Attempt to directly set the season's skills_ranking within skills_ranking
        response = team_table.update_item(
            Key={'id': team_id},
            UpdateExpression="SET skills_rankings.#season_id.#skill_type = :rank",
            ConditionExpression="attribute_exists(skills_rankings)",
            ExpressionAttributeNames={'#season_id': str(season), '#skill_type': str(skill_type)},
            ExpressionAttributeValues={':rank': Decimal(str(rank))},
            ReturnValues="UPDATED_NEW"
        )
        # logging.info(f"Updated team skills rank for team {team_id} for type: {skill_type}, season {season}")
    except team_table.meta.client.exceptions.ConditionalCheckFailedException:
        # If skills_ranking does not exist, initialize it and then set the season's skills_ranking rating
        response = team_table.update_item(
            Key={'id': team_id},
            UpdateExpression="SET skills_rankings = :empty_map",
            ExpressionAttributeValues={':empty_map': {str(season): {str(skill_type) : Decimal(str(rank))} }},
            ReturnValues="UPDATED_NEW"
        )
        # logging.info(f"Created team skills rank object for team {team_id} for type: {skill_type}, season {season}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ValidationException':
            response = team_table.update_item(
                Key={'id': team_id},
                UpdateExpression="SET skills_rankings.#season_id = :new_season_map",
                ExpressionAttributeNames={'#season_id': str(season)},
                ExpressionAttributeValues={
                    ':new_season_map': {str(skill_type): Decimal(str(rank))}
                },
                ReturnValues="UPDATED_NEW"
            )
            # logging.info(f"Updated team skills rank for team {team_id} for type: {skill_type}, adding a new season {season}")
        else: logging.error(f"Error updating team skills rank for team exception 1: {team_id}: {e}")
    except Exception as e:
        logging.error(f"Error updating team skills rank for team: {team_id}: {e}")

def update_skills_regional_rankings(team_id, season, skill_type, rank):
    try:
        
        # Attempt to directly set the season's ELO rating within elo_rankings
        response = team_table.update_item(
            Key={'id': team_id},
            UpdateExpression="SET skills_regional_ranking.#season_id.#skill_type = :rank",
            ConditionExpression="attribute_exists(skills_regional_ranking)",
            ExpressionAttributeNames={'#season_id': str(season), '#skill_type': str(skill_type)},
            ExpressionAttributeValues={':rank': Decimal(str(rank))},
            ReturnValues="UPDATED_NEW"
        )
        # logging.info(f"Updated team skills regional rank for team {team_id} for type: {skill_type}, season {season}")
    except team_table.meta.client.exceptions.ConditionalCheckFailedException:
        
        # If elo_rankings does not exist, initialize it and then set the season's ELO rating
        response = team_table.update_item(
            Key={'id': team_id},
            UpdateExpression="SET skills_regional_ranking = :empty_map",
            ExpressionAttributeValues={':empty_map': {str(season): {str(skill_type) : Decimal(str(rank))} }},
            ReturnValues="UPDATED_NEW"
        )
        # logging.info(f"Created team skills regional rank for team {team_id} for type: {skill_type}, season {season}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ValidationException':
            response = team_table.update_item(
                Key={'id': team_id},
                UpdateExpression="SET skills_regional_ranking.#season_id = :new_season_map",
                ExpressionAttributeNames={'#season_id': str(season)},
                ExpressionAttributeValues={
                    ':new_season_map': {str(skill_type): Decimal(str(rank))}
                },
                ReturnValues="UPDATED_NEW"
            )
            # logging.info(f"Updated team skills regional rank for team {team_id} for type: {skill_type}, adding a new season {season}")
        else: logging.error(f"Error updating team skills rank for team exception 1: {team_id}: {e}")
    except Exception as e:
        logging.error(f"Error updating team skills regional rank for team: {team_id}: {e}")


def delete_skills_rankings_for_and_teams(team_id):
    try:
        update_response = team_table.update_item(
            Key={'id': Decimal(team_id)},
            UpdateExpression="REMOVE skills_rankings",
            ReturnValues="UPDATED_NEW"
        )
        # logging.info(f"Removed skills_rankings from team {team_id}")
    except Exception as e:
        logging.error(f"Error removing skills_rankings for team {team_id}: {e}")

def update_team_rankings(season):
    skill_types = ['robot', 'programming', 'driver']
    for skill_type in skill_types:
        items = query_skills_scores(season, skill_type)
        global_rankings, regional_rankings = compute_rankings(items, skill_type)
        # Update global rankings
        for team_id, rank in global_rankings.items():
            update_skills_rankings(team_id, season, skill_type, rank)

        # Update regional rankings
        for region, rankings in regional_rankings.items():
            for team_id, rank in rankings.items():
                update_skills_regional_rankings(team_id, season, skill_type, rank)
                

def handler():
    logging.info("Starting process")
    # seasons = [181, 182, 173, 175, 154, 156, 139, 140, 130, 131, 125, 126, 119, 120, 115, 116, 110, 111, 102, 103]
    seasons = [181, 182]
    for season in seasons:
        logging.info(f"Processing season {season}")
        update_team_rankings(season)


logging.info("Starting process")
handler()
logging.info("Completed process")