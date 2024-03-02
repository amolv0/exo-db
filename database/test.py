import boto3
import json
import logging
from boto3.dynamodb.types import TypeDeserializer
import trueskill
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')

elo_data_table = dynamodb.Table('elo-rankings')
trueskill_data_table = dynamodb.Table('trueskill-rankings')
team_data_table = dynamodb.Table('team-data')

env = trueskill.TrueSkill(draw_probability=0.01)

DEFAULT_ELO = 1000
K_FACTOR = 40


def get_team_elo(team_id, season):
    try:
        response = team_data_table.get_item(
            Key={'id': team_id},
            ProjectionExpression="elo"
        )
        if 'Item' in response and str(season) in response['Item'].get('elo', {}):
            return Decimal(response['Item']['elo'][str(season)])
        else:
            return Decimal(DEFAULT_ELO)
    except Exception as e:
        print(f"Error fetching ELO for team {team_id}: {e}")
        return Decimal(DEFAULT_ELO)
    
print(get_team_elo(5226, 181))