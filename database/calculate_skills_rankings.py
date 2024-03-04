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
    while True:
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
    # Sort items by score and programming_component as a tiebreaker
    if skill_type == 'robot': items.sort(key=lambda x: (-x['score'], -x.get('programming_component', 0)))

    global_rankings = {}
    regional_rankings = {}
    seen_teams = set()

    for item in items:
        team_id = item['team_id']
        region = item['region']
        score = item['score']
        if team_id not in seen_teams:
            seen_teams.add(team_id)
            # Update global ranking
            if team_id not in global_rankings:
                global_rankings[team_id] = score
            # Update regional ranking
            if region not in regional_rankings:
                regional_rankings[region] = {}
            if team_id not in regional_rankings[region]:
                regional_rankings[region][team_id] = score

    return global_rankings, regional_rankings

def update_skills_rankings(team_id, season, skill_type, rank):
    try:
        # Attempt to directly set the season's ELO rating within elo_rankings
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
        # If elo_rankings does not exist, initialize it and then set the season's ELO rating
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
        for rank, (team_id, score) in enumerate(global_rankings.items(), start=1):
            update_skills_rankings(team_id, season, skill_type, rank)

        # Update regional rankings
        for region, rankings in regional_rankings.items():
            for rank, (team_id, score) in enumerate(rankings.items(), start=1):
                update_skills_regional_rankings(team_id, season, skill_type, rank)

seasons = [173, 175, 154, 156, 139, 140, 130, 131, 125, 126, 119, 120, 115, 116, 110, 111, 102, 103]
for season in seasons:
    update_team_rankings(season)
    
    
# update_team_rankings(SEASON)
