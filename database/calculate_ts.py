import boto3
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal
import trueskill

# Constants
SEASON_ID = 88

# Initialize TrueSkill environment
env = trueskill.TrueSkill(draw_probability=0.01)  # Adjust draw_probability as needed
dynamodb = boto3.resource('dynamodb')
events_table = dynamodb.Table('event-data')
teams_table = dynamodb.Table('team-data')
trueskill_table = dynamodb.Table('trueskill-rankings')

team_ratings = {}  # Global dictionary to store team ratings across events

def fetch_events():
    all_event_ids = []

    last_evaluated_key = None
    page = 0
    print("Scanning events")

    # Correct the date range for the query
    start_date = '2012-03-01T00:00:00-05:00'  # Start of the range
    end_date = '2013-02-14T00:00:00-05:00'    # End of the range
    
    while True:
        page += 1
        print(f"Scanned page {page}")

        query_kwargs = {
            'IndexName': 'EventsByStartDateGSI',
            'KeyConditionExpression': Key('gsiPartitionKey').eq('ALL_EVENTS') & Key('start').between(start_date, end_date),
            'FilterExpression': Attr('program').is_in(['VRC', 'VEXU'])
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

def process_event(event_id):
    global team_ratings  # Use the global dictionary to track ratings across multiple events
    
    event_details = fetch_event_details(event_id)
    if not event_details:
        print(f"Event details could not be fetched for event ID {event_id}.")
        return
    if event_details['season']['id'] != SEASON_ID: return
    
    for division in event_details.get('divisions', []):
        if 'matches' not in division: continue
        for match in division['matches']:
            winning_team_ids, losing_team_ids, draw_team_ids = determine_match_outcome(match)
            
            if (len(winning_team_ids) == 0 or len(losing_team_ids) == 0) and len(draw_team_ids) != 4: continue
            
            # Update ratings based on match outcome
            update_trueskill_ratings(winning_team_ids, losing_team_ids, draw_team_ids)

def fetch_event_details(event_id):
    try:
        response = events_table.get_item(Key={'id': event_id})
        return response.get('Item')
    except Exception as e:
        print(f"Error fetching event details: {e}")
        return None

def determine_match_outcome(match):
    """
    Determine the winning, losing teams, and draws based on the score.
    Returns a tuple of lists: (winning_team_ids, losing_team_ids, draw_team_ids).
    In the case of a draw, both winning_team_ids and losing_team_ids will be empty, and draw_team_ids will contain the IDs of all teams involved in the match.
    """
    alliances = match['alliances']
    scores = {alliance['color']: (int(alliance['score']), [team['team']['id'] for team in alliance['teams']]) for alliance in alliances}
    
    # Check if it's a draw
    if scores['red'][0] == scores['blue'][0]:
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
    global team_ratings

    if winning_team_ids and losing_team_ids:
        # Handle win/lose scenario
        winners = [team_ratings.setdefault(team_id, env.create_rating()) for team_id in winning_team_ids]
        losers = [team_ratings.setdefault(team_id, env.create_rating()) for team_id in losing_team_ids]
        updated_ratings = env.rate([winners, losers], ranks=[0, 1])
        for team_id, new_rating in zip(winning_team_ids, updated_ratings[0]):
            team_ratings[team_id] = trueskill.Rating(mu=round(new_rating.mu, 2), sigma=round(new_rating.sigma, 2))
        for team_id, new_rating in zip(losing_team_ids, updated_ratings[1]):
            team_ratings[team_id] = trueskill.Rating(mu=round(new_rating.mu, 2), sigma=round(new_rating.sigma, 2))
    elif draw_team_ids:
        # Handle draw scenario
        # Split draw teams into two groups for TrueSkill processing
        half_size = len(draw_team_ids) // 2
        draw_group_1 = [team_ratings.setdefault(team_id, env.create_rating()) for team_id in draw_team_ids[:half_size]]
        draw_group_2 = [team_ratings.setdefault(team_id, env.create_rating()) for team_id in draw_team_ids[half_size:]]
        updated_ratings = env.rate([draw_group_1, draw_group_2], ranks=[0, 0])
        draw_teams_combined = draw_team_ids[:half_size] + draw_team_ids[half_size:]
        updated_ratings_combined = updated_ratings[0] + updated_ratings[1]
        for team_id, new_rating in zip(draw_teams_combined, updated_ratings_combined):
            team_ratings[team_id] = trueskill.Rating(mu=round(new_rating.mu, 2), sigma=round(new_rating.sigma, 2))


def log_and_write_final_ratings():
    global team_ratings
    # Log the final TrueSkill ratings to a file and batch write updates to DynamoDB
    log_file_path = "logs/trueskill.log"
    with open(log_file_path, "w") as file, trueskill_table.batch_writer() as batch:
        file.write("Final TrueSkill Ratings:\n")
        for team_id, rating in team_ratings.items():
            file.write(f"Team ID: {team_id}, Mu: {rating.mu}, Sigma: {rating.sigma}\n")
            batch.put_item(
                Item={
                    'season-team': f"{SEASON_ID}-{team_id}",
                    'mu': Decimal(str(rating.mu)),
                    'sigma': Decimal(str(rating.sigma)),
                    'team_id': team_id,
                    'season': SEASON_ID
                }
            )

            update_team_trueskill(team_id, rating.mu, rating.sigma, SEASON_ID)
            
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
print(team_ratings)

# process_event(53340)
process_events()
