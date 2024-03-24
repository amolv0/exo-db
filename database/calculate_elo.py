import boto3
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr

# Constants
DEFAULT_ELO = 1000
SEASON_ID = 181

dynamodb = boto3.resource('dynamodb')
events_table = dynamodb.Table('event-data')
teams_table = dynamodb.Table('team-data')
elo_table = dynamodb.Table('elo-rankings')


def expected_score(rating_a, rating_b):
    return 1 / (1 + 10 ** ((rating_b - rating_a) / 400))

def update_elo(win_elo, lose_elo, k_factor):
    expected_win = expected_score(win_elo, lose_elo)
    win_elo_updated = round(win_elo + k_factor * (1 - expected_win), 2)
    lose_elo_updated = round(lose_elo + k_factor * (0 - expected_win), 2)
    return win_elo_updated, lose_elo_updated

def get_k_factor(match_count):
    if match_count <= 30:
        return 40
    elif match_count <= 80:
        return 30
    else:
        return 20

def fetch_events():
    all_event_ids = []

    last_evaluated_key = None
    page = 0
    print("Scanning events")

    # Correct the date range for the query
    # KeyConditionExpression=Key('gsiPartitionKey').eq('ALL_EVENTS') & Key('start').gte('2023-06-01T00:00:00-05:00'),
    start_date = '2023-04-05T09:30:00-04:00'  # Start of the range
    end_date = '2024-04-05T09:30:00-04:00'    # End of the range

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

def update_elo_for_draw(team_elo, opponent_elo, k_factor):
    expected = expected_score(team_elo, opponent_elo)
    updated_elo = round(team_elo + k_factor * (0.5 - expected), 2)
    return updated_elo

def update_team_elo_and_metrics(team_metrics, team_id, winning_team_ids, losing_team_ids, is_winner):
    """Update the ELO rating for a team based on match outcome and whether they won or lost."""
    opponent_team_ids = losing_team_ids if is_winner else winning_team_ids
    for op_id in opponent_team_ids:
        if op_id not in team_metrics: 
            team_metrics[op_id] = {
                        'wins': 0, 'losses': 0, 'ties': 0,
                        'ccwms': [], 'high_score': 0,
                        'elo': DEFAULT_ELO,
                        'events': 1
                    }
    total_elo = 0
    for op_id in opponent_team_ids:
        total_elo += team_metrics[op_id]['elo']

    if len(opponent_team_ids) > 0:
        opponent_avg_elo = total_elo / len(opponent_team_ids)
    else:
        opponent_avg_elo = 0
    
    k_factor = get_k_factor(team_metrics[team_id]['wins'] + team_metrics[team_id]['losses'] + team_metrics[team_id]['ties'])
    
    if is_winner:
        expected_win = expected_score(team_metrics[team_id]['elo'], opponent_avg_elo)
        team_metrics[team_id]['elo'] += round(k_factor * (1 - expected_win), 2)
    elif is_winner is False:
        expected_lose = expected_score(opponent_avg_elo, team_metrics[team_id]['elo'])
        team_metrics[team_id]['elo'] -= round(k_factor * expected_lose, 2)
    else:
        updated_elo = update_elo_for_draw(team_metrics[team_id]['elo'], opponent_avg_elo, k_factor)
        team_metrics[team_id]['elo'] = updated_elo

            
def process_events():
    event_ids = fetch_events()
    team_metrics = {}  # Stores wins, losses, ties, avg_ccwm, high_score, and elo

    print(f"{len(event_ids)} events to process")
    
    for event_id in event_ids:
        print(f"Processing event {event_id}")
        if event_id == 51522:
            print("ASDJBASD")
        event_details = fetch_event_details(event_id)
        
        if not event_details or event_details['season']['id'] != SEASON_ID:
            continue
        
        for division in event_details['divisions']:
            if 'matches' not in division or 'rankings' not in division: continue
            
            # Initialize or update team metrics based on division rankings
            for ranking in division['rankings']:
                team_id = int(ranking['team']['id'])
                ccwm = ranking.get('ccwm', 0)
                high_score = ranking.get('high_score', 0)
                
                if team_id not in team_metrics:
                    team_metrics[team_id] = {
                        'wins': 0, 'losses': 0, 'ties': 0,
                        'ccwms': [ccwm], 'high_score': high_score,
                        'elo': DEFAULT_ELO,
                        'events': 1
                    }
                else:
                    team_metrics[team_id]['ccwms'].append(ccwm)
                    team_metrics[team_id]['high_score'] = max(team_metrics[team_id]['high_score'], high_score)
                    team_metrics[team_id]['events'] += 1
            
            # Process match outcomes for ELO calculations and win/loss/tie records
            for match in division['matches']:
                winning_team_ids, losing_team_ids, draw_team_ids = determine_match_outcome(match)
                
                for team_list in (match.get('winning_team_ids', []), match.get('losing_team_ids', []), match.get('draw_team_ids', [])):
                        for team_id in team_list:
                            if team_id not in team_metrics: 
                                team_metrics[team_id] = {
                                    'wins': 0, 'losses': 0, 'ties': 0,
                                    'ccwms': [], 'high_score': 0, 'elo': DEFAULT_ELO
                                }
                                
                for team_id in winning_team_ids:
                    if team_id not in team_metrics: continue
                    team_metrics[team_id]['wins'] += 1
                    update_team_elo_and_metrics(team_metrics, team_id, winning_team_ids, losing_team_ids, True)
                
                for team_id in losing_team_ids:
                    if team_id not in team_metrics: continue
                    team_metrics[team_id]['losses'] += 1
                    update_team_elo_and_metrics(team_metrics, team_id, winning_team_ids, losing_team_ids, False)
                
                for team_id in draw_team_ids:
                    if team_id not in team_metrics: continue
                    team_metrics[team_id]['ties'] += 1

    for team_id, metrics in team_metrics.items():
        if team_id not in team_metrics: continue
        metrics['avg_ccwm'] = sum(metrics['ccwms']) / len(metrics['ccwms']) if metrics['ccwms'] else 0
    
    # Update the database with the full set of metrics
    print("finished scanning")
    batch_update_team_metrics(team_metrics, SEASON_ID)
    print("finished batch writing to elo-rankings")
    
    count = 0
    # for team_id, elo in team_elos.items():
    #     count += 1
    #     print(f"Updated team {team_id} with ELO, {count} teams updated")
    #     update_team_elo(team_id, elo, SEASON_ID) 
        
        
def process_event(event_id):
    team_elos = {}  # Dict to store team ELO ratings
    event_details = fetch_event_details(event_id)
    
    if not event_details:
        print("Event details could not be fetched.")
        return
    
    for division in event_details['divisions']:
        if 'matches' not in division: continue
        for match in division['matches']:
  
            winning_team_ids, losing_team_ids = determine_match_outcome(match)
            

            if len(winning_team_ids) == 0 or len(losing_team_ids) == 0: continue
            
            avg_win_elo = sum(team_elos.get(team_id, DEFAULT_ELO) for team_id in winning_team_ids) / len(winning_team_ids)
            avg_lose_elo = sum(team_elos.get(team_id, DEFAULT_ELO) for team_id in losing_team_ids) / len(losing_team_ids)
            

            for team_id in winning_team_ids:
                current_elo = team_elos.get(team_id, DEFAULT_ELO)
                new_elo, _ = update_elo(current_elo, avg_lose_elo)
                team_elos[team_id] = new_elo

            for team_id in losing_team_ids:
                current_elo = team_elos.get(team_id, DEFAULT_ELO)
                _, new_elo = update_elo(avg_win_elo, current_elo)
                team_elos[team_id] = new_elo

    sorted_team_elos = sorted(team_elos.items(), key=lambda item: item[1], reverse=True)
    
    log_file_path = "logs/elo.log"
    with open(log_file_path, "w") as file:
        file.write("Sorted Team ELOs:\n")
        for team_id, elo in sorted_team_elos:
            file.write(f"Team ID: {team_id}, ELO: {elo}\n")

    print("batch writing to elo-rankings")
    batch_write_elo_updates(team_elos, SEASON_ID)
    print("finished batch writing to elo-rankings")
    # Update team data in the database with new ELO ratings
    count = 0
    for team_id, elo in team_elos.items():
        count += 1
        print(f"Updated team {team_id} with ELO, {count} teams updated")
        update_team_elo(team_id, elo, SEASON_ID)  

def fetch_event_details(event_id):
    """
    Fetch event details by event ID from DynamoDB.
    """
    try:
        response = events_table.get_item(Key={'id': event_id})
        return response['Item'] if 'Item' in response else None
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

def fetch_team_data(team_ids):
    team_regions = {}
    team_names = {}
    team_numbers = {}
    team_orgs = {}
    for team_id in team_ids:
        try:
            response = teams_table.get_item(Key={'id': team_id})
            if 'Item' in response:
                if 'region' in response['Item']:
                    team_regions[team_id] = response['Item']['region']
                if 'team_name' in response['Item']:
                    team_names[team_id] = response['Item']['team_name']
                if 'organization' in response['Item']:
                    team_orgs[team_id] = response['Item']['organization']
                if 'number' in response['Item']:
                    team_numbers[team_id] = response['Item']['number']
            else:
                team_regions[team_id] = "Unknown"
        except Exception as e:
            print(f"Error fetching region for team ID {team_id}: {e}")
            team_regions[team_id] = "Error"
    return team_regions, team_names, team_numbers, team_orgs

def batch_update_team_metrics(team_metrics, season_id):
    team_ids = list(team_metrics.keys())
    team_regions, team_names, team_numbers, team_orgs = fetch_team_data(team_ids)

    with elo_table.batch_writer() as batch:
        for team_id, metrics in team_metrics.items():
            region = team_regions.get(team_id, "Unknown")
            team_number = team_numbers.get(team_id, "Unknown")
            team_name = team_names.get(team_id, "Unknown")
            team_org = team_orgs.get(team_id, "Unknown")
            elo = metrics.get('elo', DEFAULT_ELO)
            wins = metrics.get('wins', 0)
            losses = metrics.get('losses', 0)
            ties = metrics.get('ties', 0)
            ccwms = metrics.get('ccwms', [])
            avg_ccwm = Decimal(str(metrics.get('avg_ccwm', 0)))
            high_score = metrics.get('high_score', 0)
            events = metrics.get('events', 0)
            
            batch.put_item(
                Item={
                    'season-team': f"{season_id}-{team_id}",
                    'elo': Decimal(str(elo)),
                    'wins': Decimal(str(wins)),
                    'losses': Decimal(str(losses)),
                    'ties': Decimal(str(ties)),
                    'events': Decimal(str(events)),
                    'avg_ccwm': avg_ccwm,
                    'ccwms': ccwms,
                    'high_score': Decimal(str(high_score)),
                    'team_id': team_id,
                    'team_number': team_number,
                    'team_name': team_name,
                    'team_org': team_org,
                    'season': Decimal(season_id),
                    'region': region
                }
            )
    print(f"Batch updated team metrics for {len(team_metrics)} teams for season {season_id}.")


def update_team_elo(team_id, elo, season_id):
    """
    Update a team's ELO rating in the DynamoDB for a specific season.
    """
    try:

        response = teams_table.update_item(
            Key={'id': team_id},
            UpdateExpression="SET elo.#season_id = :elo",
            ConditionExpression="attribute_exists(elo)",
            ExpressionAttributeNames={'#season_id': str(season_id)},
            ExpressionAttributeValues={':elo': Decimal(str(elo))},
            ReturnValues="UPDATED_NEW"
        )
    except teams_table.meta.client.exceptions.ConditionalCheckFailedException:
        # If elo_rankings does not exist, initialize it and then set the season's ELO rating
        response = teams_table.update_item(
            Key={'id': team_id},
            UpdateExpression="SET elo = :empty_map",
            ExpressionAttributeValues={':empty_map': {str(season_id): Decimal(str(elo))}},
            ReturnValues="UPDATED_NEW"
        )
    except Exception as e:
        print(f"Error updating team ELO: {e}")

if __name__ == "__main__":
    # process_event(51541)
    
    process_events()
