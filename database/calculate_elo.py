import boto3
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr

# Constants
DEFAULT_ELO = 1000
K_FACTOR = 40
SEASON_ID = 181

dynamodb = boto3.resource('dynamodb')
events_table = dynamodb.Table('event-data')
teams_table = dynamodb.Table('team-data')
elo_table = dynamodb.Table('elo-rankings')


def expected_score(rating_a, rating_b):
    return 1 / (1 + 10 ** ((rating_b - rating_a) / 400))

def update_elo(win_elo, lose_elo):
    expected_win = expected_score(win_elo, lose_elo)
    win_elo_updated = round(win_elo + K_FACTOR * (1 - expected_win), 2)
    lose_elo_updated = round(lose_elo + K_FACTOR * (0 - expected_win), 2)
    return win_elo_updated, lose_elo_updated


def fetch_events():

    all_event_ids = []
    

    last_evaluated_key = None
    page = 0
    print("Scanning events")

    while True:
        page += 1
        print(f"Scanned page {page}")

        if last_evaluated_key:
            response = events_table.query(
                IndexName='EventsByStartDateGSI',
                KeyConditionExpression=Key('gsiPartitionKey').eq('ALL_EVENTS') & Key('start').gte('2023-06-01T00:00:00-05:00'),
                FilterExpression=Attr('program').is_in(['VRC', 'VIQRC', 'VEXU']),
                ExclusiveStartKey=last_evaluated_key  
            )
        else:
            response = events_table.query(
                IndexName='EventsByStartDateGSI',
                KeyConditionExpression=Key('gsiPartitionKey').eq('ALL_EVENTS') & Key('start').gte('2023-06-01T00:00:00-05:00'),
                FilterExpression=Attr('program').is_in(['VRC', 'VIQRC', 'VEXU'])
            )
        

        all_event_ids.extend([item['id'] for item in response['Items']])
        

        last_evaluated_key = response.get('LastEvaluatedKey')
        if not last_evaluated_key:
            break  
    
    return all_event_ids


def process_events():
    event_ids = fetch_events()
    team_elos = {}  # Dict to store team ELO ratings
    count = 0
    print(f"{len(event_ids)} to process")
    
    for event_id in event_ids:
        count += 1
        print(f"Processing event {event_id}, {count} events processed")

        event_details = fetch_event_details(event_id)
        
        if not event_details:
            print("Event details could not be fetched.")
            return
        
        for division in event_details['divisions']:
            if 'matches' not in division: continue
            for match in division['matches']:
                # Process each match
                winning_team_ids, losing_team_ids = determine_match_outcome(match)
                
                if len(winning_team_ids) == 0 or len(losing_team_ids) == 0: continue
                
                # Initialize teams with default ELO if they're new and calculate average ELOs
                avg_win_elo = sum(team_elos.get(team_id, DEFAULT_ELO) for team_id in winning_team_ids) / len(winning_team_ids)
                avg_lose_elo = sum(team_elos.get(team_id, DEFAULT_ELO) for team_id in losing_team_ids) / len(losing_team_ids)
                
                # Update ELO ratings based on match outcome for each team individually
                for team_id in winning_team_ids:
                    current_elo = team_elos.get(team_id, DEFAULT_ELO)
                    new_elo, _ = update_elo(current_elo, avg_lose_elo)
                    team_elos[team_id] = new_elo

                for team_id in losing_team_ids:
                    current_elo = team_elos.get(team_id, DEFAULT_ELO)
                    _, new_elo = update_elo(avg_win_elo, current_elo)
                    team_elos[team_id] = new_elo
        # if count == 15: break

    sorted_team_elos = sorted(team_elos.items(), key=lambda item: item[1], reverse=True)
    
    log_file_path = "logs/elo.log"
    with open(log_file_path, "w") as file:
        file.write("Sorted Team ELOs:\n")
        for team_id, elo in sorted_team_elos:
            file.write(f"Team ID: {team_id}, ELO: {elo}\n")


    print("batch writing to elo-rankings")
    batch_write_elo_updates(team_elos, SEASON_ID)
    print("finished batch writing to elo-rankings")
    
    count = 0
    for team_id, elo in team_elos.items():
        count += 1
        print(f"Updated team {team_id} with ELO, {count} teams updated")
        update_team_elo(team_id, elo, SEASON_ID)  #
        
        
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

    # print("batch writing to elo-rankings")
    # batch_write_elo_updates(team_elos, SEASON_ID)
    # print("finished batch writing to elo-rankings")
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
    Determine the winning and losing teams based on the score.
    Returns a tuple of lists: (winning_team_ids, losing_team_ids)
    """
    alliances = match['alliances']
    scores = {alliance['color']: (int(alliance['score']), [team['team']['id'] for team in alliance['teams']]) for alliance in alliances}
    
    # Determine winner and loser based on score
    winner_color = max(scores, key=lambda x: scores[x][0])
    loser_color = 'blue' if winner_color == 'red' else 'red'
    
    winning_team_ids = scores[winner_color][1]
    losing_team_ids = scores[loser_color][1]
    
    return winning_team_ids, losing_team_ids

def batch_write_elo_updates(team_elos, season_id):
    """
    Performs batch writes to the elo-rankings table for updated ELO ratings.
    """
    with elo_table.batch_writer() as batch:
        for team_id, elo in team_elos.items():
            batch.put_item(
                Item={
                    'season-team': f"{Decimal(season_id)}" + "-" + str(team_id),
                    'elo': Decimal(str(elo)),
                    'team_id': team_id,
                    'season': Decimal(season_id)
                }
            )
    print(f"Batch updated {len(team_elos)} team ELO ratings for season {season_id}.")

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
