import boto3
import numpy as np
from scipy.linalg import cho_factor, cho_solve
from decimal import Decimal, ROUND_HALF_UP
import json
from botocore.exceptions import ClientError
from datetime import datetime

## Calculate OPR, DPR, CCWM for each ranking item in each event, and then post that to rankings-data. 

dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')


event_table = dynamodb.Table('event-data')
rankings_table = dynamodb.Table('rankings-data')
team_data_table = dynamodb.Table('team-data')

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)  # Convert Decimal to float
    elif isinstance(obj, dict):
        return {k: decimal_default(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_default(v) for v in obj]
    else:
        return obj
    
    
def float_default(obj):
    if isinstance(obj, float):
        return Decimal(str(obj))  # Convert float to Decimal
    elif isinstance(obj, dict):
        return {k: float_default(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [float_default(v) for v in obj]
    else:
        return obj
    
def process_rankings_for_all_events():
    page = 0
    count = 0
    scan_kwargs = {}
    while True:
        page += 1
        print(f"Scanning page {page}")
        response = event_table.scan(**scan_kwargs)
        for item in response.get('Items', []):
            count += 1
            print(f"(CCRD)Processing event {item['id']}. {count} events processed")
            calculate_and_update_rankings(item['id'])
        
        # Check for pagination
        if 'LastEvaluatedKey' in response:
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
        else:
            break


def calculate_and_update_rankings(event_id):
    count = 0
    event_item = event_table.get_item(Key={'id': event_id}).get('Item')
    if not event_item:
        print(f"No event found with ID: {event_id}")
        return
    if 'teams' not in event_item or len(event_item['teams']) < 1:
        return
    if 'program' not in event_item:
        return
    program = event_item['program']
    season = event_item['season']['id']
    divisions = event_item.get('divisions', [])
    in_s3 = False
    if 'divisions_s3_reference' in divisions:
        bucket_name, key = divisions['divisions_s3_reference'].replace("s3://", "").split("/", 1)
        response = s3_client.get_object(Bucket=bucket_name, Key=key)
        divisions = json.loads(response['Body'].read().decode('utf-8'))
        in_s3 = True
        divisions = float_default(divisions)
    division_num = 0
    for division in divisions:
        division_num += 1
        print(f"Doing division {division_num}")
        if 'rankings' not in division or len(division['rankings']) < 1:
            print("Rankings not found/ranking len < 1, continuing")
            continue
        division_id = division['id']
        if 'matches' in division:
            matches = [match for match in division.get('matches', []) if match['round'] == 2]
        else: 
            print("continuing")
            continue

        teams = set()
        team_numbers = {}
        for match in matches:
            for alliance in match['alliances']:
                for team in alliance['teams']:
                    team_id = team['team']['id']
                    teams.add(team_id)
                    team_numbers[team_id] = team['team']['name']
        n = len(teams)
        # print(teams)
        if n < 1:
            print(f"Found no matches with round==2 for division {division['id']} in event {event_id}")
            continue
        team_indices = {team_id: i for i, team_id in enumerate(teams)}
        A = np.zeros((n, n))
        B_opr = np.zeros(n)
        B_dpr = np.zeros(n)
        for match in matches:
            scores = [float(alliance['score']) for alliance in match['alliances']]
            for i, alliance in enumerate(match['alliances']):
                team_ids = [team['team']['id'] for team in alliance['teams']]
                for team_id in team_ids:
                    idx = team_indices[team_id]
                    B_opr[idx] += scores[i]
                    B_dpr[idx] += scores[1-i]
                    for other_team_id in team_ids:
                        A[idx, team_indices[other_team_id]] += 1

        A = A + np.eye(A.shape[0]) * 0.0000001
        c, lower = cho_factor(A)
        oprs = cho_solve((c, lower), B_opr)
        dprs = cho_solve((c, lower), B_dpr)
        ccwms = oprs - dprs
        
        # Update the rankings in the division and post to rankings-data table
        for ranking in division['rankings']:
            team_id = ranking['team']['id']
            if team_id in teams:
                idx = team_indices[team_id]
                opr, dpr, ccwm = oprs[idx], dprs[idx], ccwms[idx]
                
                # Make a copy of the ranking for updating event-data, omitting 'event' and 'division'
                ranking_for_event_update = {k: v for k, v in ranking.items()}

                # Round and convert to Decimal
                ranking_for_event_update['opr'] = Decimal(str(opr)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                ranking_for_event_update['dpr'] = Decimal(str(dpr)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                ranking_for_event_update['ccwm'] = Decimal(str(ccwm)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

                

                # Update the ranking in the division for event-data update
                ranking.update(ranking_for_event_update)

                # Add program and season for posting to rankings-data
                ranking['program'] = event_item['program']
                ranking['season'] = event_item['season']['id']
                ranking['event_id'] = event_item['id']
                ranking['event_name'] = event_item['name']
                ranking['event_start'] = event_item['start']
                ranking['division_id'] = division['id']
                ranking['division_name'] = division['name']

                # Post ranking to rankings-data table
                count += 1
                # print(f"Putting in rankings {ranking['id']}. {count} rankings put in")
                rankings_table.put_item(Item=ranking)
                
                # rankings are already in team_data
                # response = team_data_table.update_item(
                #     Key={'id': int(team_id)},
                #     UpdateExpression='SET rankings = list_append(if_not_exists(rankings, :empty_list), :ranking)',
                #     ExpressionAttributeValues={
                #         ':ranking': [ranking['id']],
                #         ':empty_list': [],
                #     },
                #     ReturnValues='UPDATED_NEW'
                # )
                
                # Remove attributes we dont want in event-data
                ranking.pop('event_id', None)
                ranking.pop('event_name', None)
                ranking.pop('event_start', None)
                ranking.pop('division_id', None)
                ranking.pop('division_name', None)
                ranking.pop('event', None)
                ranking.pop('division', None)
                ranking.pop('program', None)
                ranking.pop('season', None)

    # Update the event item with the new rankings
    if not in_s3:
        event_table.update_item(
            Key={'id': event_id},
            UpdateExpression='SET divisions = :divisions',
            ExpressionAttributeValues={':divisions': divisions}
        )
    else:
        divisions_json = json.dumps(decimal_default(divisions))
        try:
            s3_client.put_object(Bucket=bucket_name, Key=key, Body=divisions_json)
            update_expression = "SET "
            expression_attribute_values = {}
            expression_attribute_values[":divisions"] = {"divisions_s3_reference": f"s3://{bucket_name}/{key}", "divisions_last_changed": datetime.now().isoformat(), }
            update_expression += "divisions = :divisions"
            event_table.update_item(
                Key={'id': event_id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_attribute_values,
                ReturnValues="UPDATED_NEW"
            )
            print(f"Divisions data for event {event_id} stored in S3.")
        except ClientError as e:
            print(f"Failed to store divisions in S3: {e}")
    return None
    # print(f"Updated event {event_id}, division {division_id}")

def delete_ranking(team_id):    
    try:
        response = team_data_table.update_item(
            Key={'id': team_id}, 
            UpdateExpression='REMOVE rankings',
            ReturnValues='UPDATED_NEW'
        )
        # print(f"Successfully deleted rankings for team ID: {team_id}.")
    except Exception as e:
        print(f"Error deleting rankings for team ID: {team_id}: {e}")

def delete_all_rankings():
    dynamodb = boto3.resource('dynamodb')
    team_data_table = dynamodb.Table('team-data')
    scan_kwargs = {}
    count = 0
    while True:
        count += 1
        print(f"Scanning and deleting page {count}")
        response = team_data_table.scan(**scan_kwargs)
        for item in response.get('Items', []):
            team_id = item['id']
            delete_ranking(team_id)
        
        if 'LastEvaluatedKey' in response:
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
        else:
            break
# print("Starting process")
# delete_ranking(34474)        
# calculate_and_update_rankings(54701)
# calculate_and_update_rankings(30390)
# print("Process complete") 

# print("Starting process")
# delete_all_rankings()
# print("Completed deleting all rankings")
# process_rankings_for_all_events()
# print("Process complete")  

print("Starting process")
calculate_and_update_rankings(33805)
print("DONE")