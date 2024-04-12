import json
import boto3
import trueskill
import math
from scipy.stats import norm
from boto3.dynamodb.conditions import Key

from boto3.dynamodb.conditions import Key


dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('team-data')


trueskill.setup(draw_probability=0.01)  

class TeamNotFoundError(Exception):
    pass

class TeamNotRegisteredError(Exception):
    pass

def get_team_skill(team_number):
    response = table.query(
        IndexName='TeamNumberIndex',
        KeyConditionExpression='#num = :team_number',
        ExpressionAttributeNames={
            '#num': 'number'
        },
        ExpressionAttributeValues={
            ':team_number': team_number
        }
    )
    items = response.get('Items', [])
    if not items:
        raise TeamNotFoundError(f"{team_number} not found")
    team_data = None
    for item in items:
        if item.get('program') == 'VRC':
            team_data = item
    if team_data == None or team_data.get('registered') == 'false':
        raise TeamNotRegisteredError(f"Team {team_number} is not a registered VRC team")
    team_skill = team_data.get('teamskill', {}).get('181', {})
    mu = float(team_skill.get('mu', 25)) 
    sigma = float(team_skill.get('sigma', 8.333))
    return trueskill.Rating(mu, sigma)

def handler(event, context):
    try:
        team1_skill = get_team_skill(event['number1'])
        team2_skill = get_team_skill(event['number2'])
        team3_skill = get_team_skill(event['number3'])
        team4_skill = get_team_skill(event['number4'])
    except (TeamNotFoundError, TeamNotRegisteredError) as e:
        return {
            'statusCode': 500,
            'body': json.dumps("Team is not a registered VRC team")
        }


    red_team = [team1_skill, team2_skill]
    blue_team = [team3_skill, team4_skill]
    
    delta_mu = sum(r.mu for r in red_team) - sum(r.mu for r in blue_team)
    sum_sigma = sum(r.sigma ** 2 for r in red_team + blue_team)
    size = len(red_team) + len(blue_team)
    denom = math.sqrt(size * (trueskill.BETA * trueskill.BETA) + sum_sigma)
    win_probability = norm.cdf(delta_mu / denom)

    return {
        'statusCode': 200,
        'body': json.dumps({
            'winProbability': win_probability
        })
    }