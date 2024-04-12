import decimal
import boto3
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal
import trueskill
from collections import defaultdict
import json


SEASON_ID = 125


env = trueskill.TrueSkill(draw_probability=0.01) 
dynamodb = boto3.resource('dynamodb')
events_table = dynamodb.Table('event-data')
teams_table = dynamodb.Table('team-data')
trueskill_table = dynamodb.Table('trueskill-rankings')
s3_client = boto3.client('s3')

team_metrics = defaultdict(lambda: {'wins': 0, 'losses': 0, 'ties': 0, 'ccwms': [], 'events': 1, 'rating': env.create_rating()})

def fetch_events():
    all_event_ids = []

    last_evaluated_key = None
    page = 0
    print("Scanning events")
    start_date = '2018-04-27T00:00:00-04:00'
    end_date = '2019-04-25T00:00:00-04:00'
    
    while True:
        page += 1
        print(f"Scanned page {page}")

        query_kwargs = {
            'IndexName': 'EventsByStartDateGSI',
            'KeyConditionExpression': Key('gsiPartitionKey').eq('ALL_EVENTS') & Key('start').between(start_date, end_date),
            'FilterExpression': Attr('program').is_in(['VRC'])
        }

        if last_evaluated_key:
            query_kwargs['ExclusiveStartKey'] = last_evaluated_key

        response = events_table.query(**query_kwargs)
        all_event_ids.extend([item['id'] for item in response['Items']])
        last_evaluated_key = response.get('LastEvaluatedKey')
        
        if not last_evaluated_key:
            break

    return all_event_ids

def process_events():
    event_ids = fetch_events()
    print(f"{len(event_ids)} events to process")
    count = 0
    for event_id in event_ids:
        count += 1
        print(f"Processing event {event_id}, {count} events processed")
        process_event(event_id)
    # Log and write the final ratings after processing all events
    log_and_write_final_ratings()

    event_details = fetch_event_details(event_id)
    if not event_details or event_details['season']['id'] != SEASON_ID:
        return  # Skip event if not part of the current season
    
    for division in event_details.get('divisions', []):
        if 'matches' not in division:
            continue
        
        for match in division['matches']:
            winning_team_ids, losing_team_ids, draw_team_ids = determine_match_outcome(match)
            update_trueskill_ratings(winning_team_ids, losing_team_ids, draw_team_ids)

def safe_decimal_conversion(value, default=Decimal(0)):
    """
    Attempts to convert a given value to Decimal.
    Returns a default if the conversion is not possible.
    """
    try:
        return Decimal(str(value))
    except decimal.InvalidOperation:
        return default
            
def process_event(event_id):
    event_details = fetch_event_details(event_id)
    if not event_details or event_details['season']['id'] != SEASON_ID:
        return  # Skip event if not part of the current season
    
    for division in event_details.get('divisions', []):
        if 'matches' not in division:
            continue
        
        for match in division['matches']:
            winning_team_ids, losing_team_ids, draw_team_ids = determine_match_outcome(match)
            update_trueskill_ratings(winning_team_ids, losing_team_ids, draw_team_ids)
        if 'rankings' not in division: 
            continue
        for ranking in division['rankings']:
            team_id = int(ranking['team']['id'])
            # Use the safe conversion function to handle problematic values
            ccwm = safe_decimal_conversion(ranking.get('ccwm'), Decimal(0))
            high_score = safe_decimal_conversion(ranking.get('high_score'), Decimal(0))
            events = ranking.get('events', 0)  # Assuming events is always an integer or has a default integer value
            
            if team_id not in team_metrics:
                team_metrics[team_id] = {
                    'wins': 0, 
                    'losses': 0, 
                    'ties': 0,
                    'events': events,
                    'ccwms': [ccwm], 
                    'high_score': high_score,
                    'rating': env.create_rating(),
                }
            else:
                team_metrics[team_id]['ccwms'].append(ccwm)
                team_metrics[team_id]['events'] += 1
                # Safely handle 'high_score' updates, ensuring no None values are compared
                team_metrics[team_id]['high_score'] = max(team_metrics[team_id].get('high_score', Decimal(0)), high_score)

def fetch_event_details(event_id):
    """
    Fetch event details by event ID from DynamoDB. If the 'divisions' attribute
    contains an S3 reference, replace 'divisions' with the content of the S3 object.
    """
    try:
        response = events_table.get_item(Key={'id': event_id})
        item = response.get('Item')
        
        if item and 'divisions' in item:
            divisions = item['divisions']
            # Check if 'divisions' contains an S3 reference
            if isinstance(divisions, dict) and 'divisions_s3_reference' in divisions:
                s3_reference = divisions['divisions_s3_reference']
                # Assuming the S3 reference format is "s3://bucket-name/key"
                bucket_name, key = s3_reference.replace("s3://", "").split("/", 1)
                # Fetch the object from S3
                s3_response = s3_client.get_object(Bucket=bucket_name, Key=key)
                # Read the object's content and parse it as JSON
                divisions_data = s3_response['Body'].read().decode('utf-8')
                item['divisions'] = json.loads(divisions_data)
        return item
    except Exception as e:
        print(f"Error fetching event details: {e}")
        return None

def determine_match_outcome(match):
    """
    Determine the winning, losing teams, and draws based on the score.
    Returns a tuple of lists: (winning_team_ids, losing_team_ids, draw_team_ids).
    In the case of a draw, both winning_team_ids and losing_team_ids will be empty, and draw_team_ids will contain the IDs of all teams involved in the match.
    In the case where both scores are 0, it's assumed the match hasn't taken place yet and all return lists will be empty.
    """
    alliances = match['alliances']
    scores = {alliance['color']: (int(alliance['score']), [team['team']['id'] for team in alliance['teams']]) for alliance in alliances}
    
    # Check if match hasn't taken place yet
    if scores['red'][0] == 0 and scores['blue'][0] == 0:
        return [], [], []  # Match hasn't taken place yet

    # Check if it's a draw
    elif scores['red'][0] == scores['blue'][0]:
        # It's a draw, combine both teams
        draw_team_ids = scores['red'][1] + scores['blue'][1]
        return [], [], draw_team_ids
    else:
        # Determine winner and loser based on score
        winner_color = max(scores, key=lambda x: scores[x][0])
        loser_color = 'blue' if winner_color == 'red' else 'red'
        
        winning_team_ids = scores[winner_color][1]
        losing_team_ids = scores[loser_color][1]
        
        return winning_team_ids, losing_team_ids, []

def update_trueskill_ratings(winning_team_ids, losing_team_ids, draw_team_ids):
    global team_metrics, env

    # Preparing the team ratings for update
    for team_id in winning_team_ids + losing_team_ids + draw_team_ids:
        if team_id not in team_metrics:
            team_metrics[team_id]['rating'] = env.create_rating()

    # Handling win/lose scenarios
    if winning_team_ids and losing_team_ids:
        winners = [team_metrics[team_id]['rating'] for team_id in winning_team_ids]
        losers = [team_metrics[team_id]['rating'] for team_id in losing_team_ids]
        updated_winners, updated_losers = env.rate([winners, losers], ranks=[0, 1])
        
        for i, team_id in enumerate(winning_team_ids):
            team_metrics[team_id]['rating'] = updated_winners[i]
            team_metrics[team_id]['wins'] += 1
        
        for i, team_id in enumerate(losing_team_ids):
            team_metrics[team_id]['rating'] = updated_losers[i]
            team_metrics[team_id]['losses'] += 1

    # Correct handling of draws
    elif draw_team_ids:
        draw_teams = [team_metrics[team_id]['rating'] for team_id in draw_team_ids]
        # To rate a draw, split the teams into two groups and assign them the same rank
        half = len(draw_teams) // 2
        group1 = draw_teams[:half] or draw_teams  # Ensure there's at least one team in group1
        group2 = draw_teams[half:] or draw_teams  # Ensure there's at least one team in group2
        if group1 and group2:  # Check if both groups have members
            updated_ratings = env.rate([group1, group2], ranks=[0, 0])
            for i, team_id in enumerate(draw_team_ids[:half]):
                team_metrics[team_id]['rating'] = updated_ratings[0][i]
            for i, team_id in enumerate(draw_team_ids[half:]):
                team_metrics[team_id]['rating'] = updated_ratings[1][i] if half else updated_ratings[0][i]
            for team_id in draw_team_ids:
                team_metrics[team_id]['ties'] += 1

   
def fetch_additional_team_data(team_ids):
    """Fetch additional team data like number, name, organization, and region."""
    team_data = {}
    for team_id in team_ids:
        response = teams_table.get_item(Key={'id': team_id})
        if 'Item' in response:
            item = response['Item']
            team_data[team_id] = {
                'team_number': item.get('number', 'Unknown'),
                'team_name': item.get('team_name', 'Unknown'),
                'team_org': item.get('organization', 'Unknown'),
                'region': item.get('region', 'Unknown'),
            }
        else:
            team_data[team_id] = {
                'team_number': 'Unknown',
                'team_name': 'Unknown',
                'team_org': 'Unknown',
                'region': 'Unknown',
            }
    return team_data

def log_and_write_final_ratings():
    global team_metrics
    
    # Fetch additional team data
    team_ids = list(team_metrics.keys())
    additional_team_data = fetch_additional_team_data(team_ids)

    with trueskill_table.batch_writer() as batch:
        for team_id, metrics in team_metrics.items():
            data = additional_team_data.get(team_id, {})
            avg_ccwm = sum(metrics['ccwms']) / len(metrics['ccwms']) if metrics['ccwms'] else Decimal(0)
            high_score = Decimal(str(metrics.get('high_score', 0)))
            
            batch.put_item(
                Item={
                    'season-team': f"{SEASON_ID}-{team_id}",
                    'mu': Decimal(str(metrics['rating'].mu)),
                    'sigma': Decimal(str(metrics['rating'].sigma)),
                    'wins': Decimal(str(metrics['wins'])),
                    'losses': Decimal(str(metrics['losses'])),
                    'ties': Decimal(str(metrics['ties'])),
                    'events': Decimal(str(metrics['events'])),
                    'ccwms': metrics['ccwms'],
                    'avg_ccwm': Decimal(str(avg_ccwm)),
                    'high_score': Decimal(str(high_score)),
                    'team_id': Decimal(str(team_id)),
                    'team_number': data.get('team_number', 'Unknown'),
                    'team_name': data.get('team_name', 'Unknown'),
                    'team_org': data.get('team_org', 'Unknown'),
                    'season': Decimal(str(SEASON_ID)),
                    'region': data.get('region', 'Unknown'),
                }
            )
    print("All metrics logged and updated in DynamoDB.")
            
def update_team_trueskill(team_id, mu, sigma, season_id):
    global count
    count += 1
    try:
        # Attempt to update the teamskill for the season
        teams_table.update_item(
            Key={'id': team_id},
            UpdateExpression="SET teamskill.#season_id = :rating",
            ExpressionAttributeNames={'#season_id': str(season_id)},
            ExpressionAttributeValues={
                ':rating': {'mu': Decimal(str(mu)), 'sigma': Decimal(str(sigma))}
            }
        )
        print(f"Updated teamskill for team {team_id} for season {season_id}, {count} teams updated")
    except Exception as e:
        # print(f"Attempt to update teamskill failed: {e}")
        # Assuming failure due to non-existent 'teamskill', initialize it
        try:
            teams_table.update_item(
                Key={'id': team_id},
                UpdateExpression="SET teamskill = :new_skill",
                ExpressionAttributeValues={
                    ':new_skill': {str(season_id): {'mu': Decimal(str(mu)), 'sigma': Decimal(str(sigma))}}
                }
            )
            print(f"Initialized teamskill for team {team_id} for season {season_id}, {count} teams updated")
        except Exception as e:
            print(f"Error initializing teamskill for team {team_id}: {e}")

count = 0
# print(team_metrics)

# process_event(53340)
process_events()
