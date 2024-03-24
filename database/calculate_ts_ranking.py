import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
trueskill_table = dynamodb.Table('trueskill-rankings')
team_table = dynamodb.Table('team-data')

SEASON = 180

def update_team_rankings(season):

    rank_counter = 1
    page = 0
    count = 0
    regional_ranks = {}  # Dictionary to track the rank counter for each region

    last_evaluated_key = None
    while True:
        page += 1
        print(f"Examining page {page}")
        if last_evaluated_key:
            response = trueskill_table.query(
                IndexName='SeasonMuIndex',
                KeyConditionExpression=Key('season').eq(season),
                ScanIndexForward=False,  
                ExclusiveStartKey=last_evaluated_key
            )
        else:
            response = trueskill_table.query(
                IndexName='SeasonMuIndex',
                KeyConditionExpression=Key('season').eq(season),
                ScanIndexForward=False  
            )
        

        
        for item in response['Items']:
            count += 1
            team_id = item['team_id']
            region = item.get('region')  # Assuming 'region' is a key in the item
            print(f"Updating team_id {team_id}, {count} teams updated")
            update_team_data_with_rank(team_id, season, rank_counter)
            rank_counter += 1
            
            if region not in regional_ranks:
                regional_ranks[region] = 1
            else:
                regional_ranks[region] += 1
            regional_rank = regional_ranks[region]
            update_team_data_with_regional_rank(team_id, season, regional_rank)
        
        last_evaluated_key = response.get('LastEvaluatedKey')
        if not last_evaluated_key:
            break

def update_team_data_with_regional_rank(team_id, season, regional_rank):
    # Update the team-data table with the rank for the specified season
    # If teamskills_rankings does not exist, it initializes as an empty map
        
    try:
        # Attempt to directly set the season's ELO rating within elo_rankings
        response = team_table.update_item(
            Key={'id': team_id},
            UpdateExpression="SET teamskill_regional_rankings.#season_id = :rank",
            ConditionExpression="attribute_exists(teamskill_regional_rankings)",
            ExpressionAttributeNames={'#season_id': str(season)},
            ExpressionAttributeValues={':rank': Decimal(str(regional_rank))},
            ReturnValues="UPDATED_NEW"
        )
    except team_table.meta.client.exceptions.ConditionalCheckFailedException:
        # If elo_rankings does not exist, initialize it and then set the season's ELO rating
        response = team_table.update_item(
            Key={'id': team_id},
            UpdateExpression="SET teamskill_regional_rankings = :empty_map",
            ExpressionAttributeValues={':empty_map': {str(season): Decimal(str(regional_rank))}},
            ReturnValues="UPDATED_NEW"
        )
    except Exception as e:
        print(f"Error updating team elo rank: {e}")
        
def update_team_data_with_rank(team_id, season, rank):
    # Update the team-data table with the rank for the specified season
    # If teamskills_rankings does not exist, it initializes as an empty map
        
    try:
        # Attempt to directly set the season's ELO rating within elo_rankings
        response = team_table.update_item(
            Key={'id': team_id},
            UpdateExpression="SET teamskill_rankings.#season_id = :rank",
            ConditionExpression="attribute_exists(teamskill_rankings)",
            ExpressionAttributeNames={'#season_id': str(season)},
            ExpressionAttributeValues={':rank': Decimal(str(rank))},
            ReturnValues="UPDATED_NEW"
        )
    except team_table.meta.client.exceptions.ConditionalCheckFailedException:
        # If elo_rankings does not exist, initialize it and then set the season's ELO rating
        response = team_table.update_item(
            Key={'id': team_id},
            UpdateExpression="SET teamskill_rankings = :empty_map",
            ExpressionAttributeValues={':empty_map': {str(season): Decimal(str(rank))}},
            ReturnValues="UPDATED_NEW"
        )
    except Exception as e:
        print(f"Error updating team elo rank: {e}")
        

update_team_rankings(SEASON)
