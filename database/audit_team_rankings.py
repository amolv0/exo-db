import boto3
import json
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

event_table = dynamodb.Table('event-data')
team_table = dynamodb.Table('team-data')
rankings_table = dynamodb.Table('rankings-data')

def update_team_rankings():
    count = 1
    response = event_table.scan()
    
    while True:
        print(f"Scanning page {count}")
        count += 1
        process_events(response['Items'])
        

        if 'LastEvaluatedKey' in response:
            response = event_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        else:
            break
        

def update_team_rankings_for_event(event_id):
    print(f"Processing event {event_id}")
    response = event_table.get_item(Key={'id': event_id})
    event = response.get('Item')
    
    if not event:
        print(f"No event found with ID: {event_id}")
        return

    process_event(event)
    
def process_event(event):
    divisions = event.get('divisions', [])
    if 'divisions_s3_reference' in divisions:
        bucket_name, key = divisions['divisions_s3_reference'].replace("s3://", "").split("/", 1)
        response = s3_client.get_object(Bucket=bucket_name, Key=key)
        divisions = json.loads(response['Body'].read().decode('utf-8'))
    for division in divisions:
        rankings = division.get('rankings', [])
        for ranking in rankings:
            update_rankings(ranking, event['season']['id'])

def process_events(events):
    for event in events:
        divisions = event.get('divisions', [])
        if 'divisions_s3_reference' in divisions:
            bucket_name, key = divisions['divisions_s3_reference'].replace("s3://", "").split("/", 1)
            response = s3_client.get_object(Bucket=bucket_name, Key=key)
            divisions = json.loads(response['Body'].read().decode('utf-8'))
        for division in divisions:
            rankings = division.get('ranking', [])
            for ranking in rankings:
                update_rankings(ranking, Decimal(event['season']['id']))

def update_rankings(ranking, season):
    ranking_id = ranking.get('id')
    team_item = ranking.get('team')
    team_id = team_item.get('id')
    update_ranking_in_team(team_id, ranking_id)
    update_ranking_in_rankings_table(ranking_id, season)

def update_ranking_in_team(team_id, ranking_id):
    response = team_table.get_item(Key={'id': team_id})
    team_data = response.get('Item')
    
    if team_data:
        rankings = team_data.get('rankings', [])
        if ranking_id not in rankings:
            print(f"Adding ranking {ranking_id} to team {team_id}")
            rankings.append(ranking_id)
            team_table.update_item(
                Key={'id': team_id},
                UpdateExpression='SET rankings = :val',
                ExpressionAttributeValues={
                    ':val': rankings
                }
            )
        
def update_ranking_in_rankings_table(ranking_id, season):
    response = rankings_table.get_item(Key={'id': ranking_id})
    if 'Item' in response:
        ranking = response['Item']
    else:
        print(f"Ranking not found in rankings table: {ranking_id}")
        return
    if 'season' not in ranking:
        print(f"Added season to ranking: {ranking_id}")
        ranking['season'] = season
        rankings_table.update_item(
            Key={'id': ranking_id},
            UpdateExpression='SET season = :val',
            ExpressionAttributeValues={
                ':val': season
            }
        )
    
    
if __name__ == "__main__":
    # update_team_rankings()
    update_team_rankings_for_event(33805)
