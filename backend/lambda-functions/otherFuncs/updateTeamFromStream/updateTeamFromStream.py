import boto3
import json
import logging
from boto3.dynamodb.types import TypeDeserializer
import trueskill
from decimal import Decimal
from datetime import datetime


# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')

# Initialize a TypeDeserializer for unmarshalling
deserializer = TypeDeserializer()

s3_client = boto3.client('s3')
event_data_table = dynamodb.Table('event-data')
team_data_table = dynamodb.Table('team-data')
match_data_table = dynamodb.Table('match-data')
skills_data_table = dynamodb.Table('skills-data') 
skills_ranking_data_table = dynamodb.Table('skills-ranking-data')
rankings_data_table = dynamodb.Table('rankings-data')
awards_data_table = dynamodb.Table('award-data')
elo_data_table = dynamodb.Table('elo-rankings')
trueskill_data_table = dynamodb.Table('trueskill-rankings')

env = trueskill.TrueSkill(draw_probability=0.01)

logging = logging.getLogger()
logging.setLevel("ERROR")

DEFAULT_ELO = 1000
K_FACTOR = 40

def unmarshall_dynamodb_item(item):
    return {k: deserializer.deserialize(v) for k, v in item.items()}

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)  
    elif isinstance(obj, dict):
        return {k: decimal_default(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_default(v) for v in obj]
    else:
        return obj
    
def process_match(match, division_name, division_id, event_name, event_id, event_start, season):
    update_match_data_with_match(match, division_name, division_id, event_name, event_id, event_start, season)
    teams = extract_teams_from_match(match)
    for team in teams:
        team_id = team['team']['id']
        if 'id' in match:
            match_id = match['id']
            update_team_data_with_match(team_id, match_id)
    update_ts_data_with_match(match, season)
    update_elo_data_with_match(match, season)  
            

def remove_match(match, event_id):
    logging.info(f"Removing match {match['id']} from event: {event_id}")
    remove_match_from_match_data(match['id']) 
    teams = extract_teams_from_match(match)
    for team in teams:
        team_id = team['team']['id']
        if 'id' in match:
            match_id = match['id']
            remove_match_from_team_data(team_id, match_id)
            
def remove_ranking(ranking, event_id):
    logging.info(f"Removing ranking {ranking['id']} from event: {event_id}")
    remove_ranking_from_ranking_data(ranking['id']) 
    team_id = ranking['team']['id']
    if 'id' in ranking:
        ranking_id = ranking['id']
        remove_ranking_from_team_data(team_id, ranking_id)
            
            
def update_ts_elo_with_ranking(season, ranking):
    team_id = ranking['team']['id']
    new_ccwm = ranking['ccwm']
    partition_key = f"{season}-{team_id}"
    
    tables = [elo_data_table, trueskill_data_table]
    
    for table in tables:
        response = table.get_item(Key={'season-team': partition_key})
        if 'Item' in response:
            item = response['Item']
            ccwms = item.get('ccwms', [])
            events = item.get('events', 1)
            
            if ccwms:
                ccwms[-1] = new_ccwm
                avg_ccwm = sum(ccwms) / events
                
                update_response = table.update_item(
                    Key={'season-team': partition_key},
                    UpdateExpression='SET ccwms = :ccwms, avg_ccwm = :avg_ccwm',
                    ExpressionAttributeValues={
                        ':ccwms': ccwms,
                        ':avg_ccwm': avg_ccwm,
                    },
                    ReturnValues='UPDATED_NEW'
                )
                print(f"Updated {table.name} for team ID {team_id} and season {season}.")
            else:
                print(f"No 'ccwms' found for team ID {team_id} and season {season} in table {table.name}.")
        else:
            print(f"No item found for team ID {team_id} and season {season} in table {table.name}.")    
    
def update_ts_data_with_match(match, season):
    if season == 181 or season == 182:
        teams = extract_teams_from_match(match)
        team_ids = [team['team']['id'] for team in teams]
        team_ratings = {team_id: get_team_trueskill(team_id, season) for team_id in team_ids}
        winning_team_ids, losing_team_ids, draw_team_ids, skip_match = determine_match_outcome_ts(match)
        
        if skip_match:
            logging.info(f"match {match['id']} not yet scored, not adjusting trueskill")
            return
        
        updates = []
        
        if draw_team_ids:  # Handle draws
            # Prepare teams and ranks for TrueSkill rating update
            teams_in_draw = [[team_ratings[team_id]] for team_id in draw_team_ids]  # Each team in its own list
            ranks = [0] * len(teams_in_draw)  # Same rank for all, indicating a draw
            new_ratings = env.rate(teams_in_draw, ranks=ranks)
            flat_new_ratings = [rating for sublist in new_ratings for rating in sublist]            
            for team_id, new_rating in zip(draw_team_ids, flat_new_ratings):
                logging.error(f"updating trueskill for team {team_id}, match {match['id']}, was a tie")
                update_team_trueskill(team_id, new_rating.mu, new_rating.sigma, season)
                updates.append((team_id, new_rating.mu, new_rating.sigma))
        else: # Handle win/lose
            winners = [team_ratings[team_id] for team_id in winning_team_ids]
            losers = [team_ratings[team_id] for team_id in losing_team_ids]
            new_ratings = env.rate([winners, losers], ranks=[0, 1])
            for team_id, rating in zip(winning_team_ids, new_ratings[0]):
                logging.error(f"updating trueskill for team {team_id}, match {match['id']}")
                update_team_trueskill(team_id, rating.mu, rating.sigma, season)
                updates.append((team_id, rating.mu, rating.sigma))
            for team_id, rating in zip(losing_team_ids, new_ratings[1]):
                logging.error(f"updating trueskill for team {team_id}, match {match['id']}")
                update_team_trueskill(team_id, rating.mu, rating.sigma, season)
                updates.append((team_id, rating.mu, rating.sigma))
        
        for team_id, mu, sigma in updates:
            partition_key = f"{season}-{team_id}"
            
            result_type = ""
            if team_id in winning_team_ids:
                result_type = "wins"
            elif team_id in losing_team_ids:
                result_type = "losses"
            elif team_id in draw_team_ids:
                result_type = "ties"
                
            try:
                # Attempt to update the item with mu, sigma, and the specific win/loss/tie increment
                update_expression = "SET mu = :mu, sigma = :sigma, #resultType = if_not_exists(#resultType, :start) + :inc"
                expression_attribute_values = {":mu": Decimal(str(mu)), ":sigma": Decimal(str(sigma)), ":start": 0, ":inc": 1}
                expression_attribute_names = {"#seasonTeam": "season-team", "#resultType": result_type}
                
                trueskill_data_table.update_item(
                    Key={'season-team': partition_key},
                    UpdateExpression=update_expression,
                    ExpressionAttributeValues=expression_attribute_values,
                    ExpressionAttributeNames=expression_attribute_names,
                    ConditionExpression="attribute_exists(#seasonTeam)"
                )
            except trueskill_data_table.meta.client.exceptions.ConditionalCheckFailedException:
                # If the item does not exist, fetch region and other team data to create the item
                team_data = team_data_table.get_item(Key={'id': team_id}).get('Item', {})
                
                region = team_data.get('region', 'Unknown')
                team_number = team_data.get('number', 'Unknown')
                team_name = team_data.get('team_name', 'Unknown')
                team_org = team_data.get('organization', 'Unknown')
                
                # Create the item with all necessary attributes including region, and initial win/loss/tie count
                trueskill_data_table.put_item(
                    Item={
                        'season-team': partition_key,
                        'mu': Decimal(str(mu)),
                        'sigma': Decimal(str(sigma)),
                        'team_id': team_id,
                        'team_number': team_number,
                        'team_name': team_name,
                        'team_org': team_org,
                        'season': season,
                        'region': region,
                        result_type: Decimal(1)  # Initialize the specific result type to 1
                    }
                )
            
def update_team_trueskill(team_id, mu, sigma, season):
    if season not in [181, 182]:
        logging.error(f"{season} not applicable, not updating trueskill")
    try:
        team_data_table.update_item(
            Key={'id': team_id},
            UpdateExpression="SET teamskill.#season = :rating",
            ExpressionAttributeNames={'#season': str(season)},
            ExpressionAttributeValues={
                ':rating': {'mu': Decimal(str(mu)), 'sigma': Decimal(str(sigma))}
            }
        )
        logging.error(f"Updated teamskill for team {team_id} for season {season}")
    except Exception as e:
        try:
            team_data_table.update_item(
                Key={'id': team_id},
                UpdateExpression="SET teamskill = :new_skill",
                ExpressionAttributeValues={
                    ':new_skill': {str(season): {'mu': Decimal(str(mu)), 'sigma': Decimal(str(sigma))}}
                }
            )
            logging.error(f"Initialized teamskill for team {team_id} for season {season}")
        except Exception as e:
            logging.error(f"Error initializing teamskill for team {team_id}: {e}")
            
def get_team_trueskill(team_id, season):
    # Initialize default values
    default_rating = env.create_rating()
    default_metrics = {'wins': 0, 'losses': 0, 'ties': 0, 'events': 0, 'avg_ccwm': 0.0}

    try:
        response = trueskill_data_table.get_item(
            Key={'season-team': f"{season}-{team_id}"}
        )
        if 'Item' in response:
            item = response['Item']
            mu = float(item.get('mu', default_rating.mu))
            sigma = float(item.get('sigma', default_rating.sigma))
            wins = int(item.get('wins', default_metrics['wins']))
            losses = int(item.get('losses', default_metrics['losses']))
            ties = int(item.get('ties', default_metrics['ties']))
            events = int(item.get('events', default_metrics['events']))
            avg_ccwm = float(item.get('avg_ccwm', default_metrics['avg_ccwm']))

            rating = env.create_rating(mu=mu, sigma=sigma)
            return rating, wins, losses, ties, events, avg_ccwm
        else:
            return default_rating, default_metrics['wins'], default_metrics['losses'], default_metrics['ties'], default_metrics['events'], default_metrics['avg_ccwm']
    except Exception as e:
        print(f"Error fetching TrueSkill and metrics for team {team_id}: {e}")
        return default_rating, default_metrics['wins'], default_metrics['losses'], default_metrics['ties'], default_metrics['events'], default_metrics['avg_ccwm']
    
        
def update_elo_data_with_match(match, season):
    if season not in [181, 182]:
        logging.info("Invalid season specified, skipping ELO update.")
        return

    # Determine match outcome
    winning_team_ids, losing_team_ids, skip_match = determine_match_outcome_elo(match)

    if skip_match:
        logging.info(f"Match {match['id']} not yet scored, not adjusting ELO.")
        return

    # No further processing if no teams have won or lost (e.g., match not played)
    if len(winning_team_ids) == 0 or len(losing_team_ids) == 0:
        return

    # Fetch current ELO ratings for all teams involved in the match
    team_elos = {team_id: get_team_elo(team_id, season) for team_id in winning_team_ids + losing_team_ids}
    
    # Calculate new ELO ratings based on match outcome
    updates = {}
    for team_id in winning_team_ids + losing_team_ids:
        if team_id in winning_team_ids:
            result_type = "wins"
        elif team_id in losing_team_ids:
            result_type = "losses"
        else:
            continue  # Skip if team ID is neither in winning nor losing team IDs
        
        current_elo = team_elos[team_id]
        opponent_team_ids = losing_team_ids if team_id in winning_team_ids else winning_team_ids
        avg_opponent_elo = sum(team_elos[op_id] for op_id in opponent_team_ids) / len(opponent_team_ids)
        new_elo, _ = update_elo(current_elo, avg_opponent_elo) if team_id in winning_team_ids else update_elo(avg_opponent_elo, current_elo)
        updates[team_id] = (new_elo, result_type)

    # Update team ELO and win/loss/tie records in DynamoDB
    for team_id, (elo, result_type) in updates.items():
        partition_key = f"{season}-{team_id}"
        update_expression = f"SET elo = :elo, {result_type} = if_not_exists({result_type}, :start) + :inc"
        expression_attribute_values = {":elo": Decimal(str(elo)), ":start": 0, ":inc": 1}

        try:
            elo_data_table.update_item(
                Key={'season-team': partition_key},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_attribute_values
            )
            logging.info(f"Updated ELO for team {team_id} ({result_type}): {elo}")
        except Exception as e:
            logging.error(f"Error updating ELO for team {team_id}: {e}")

    logging.info("ELO ratings and match outcomes updated.")
   
def expected_score(rating_a, rating_b):
    return 1 / (1 + 10 ** ((rating_b - rating_a) / 400))

def update_elo(avg_win_elo, avg_lose_elo):
    expected_win_score = expected_score(avg_win_elo, avg_lose_elo)
    expected_lose_score = expected_score(avg_lose_elo, avg_win_elo)

    win_elo_updated = round(avg_win_elo + K_FACTOR * (1 - expected_win_score), 2)
    lose_elo_updated = round(avg_lose_elo + K_FACTOR * (0 - expected_lose_score), 2)

    return win_elo_updated, lose_elo_updated

def determine_match_outcome_ts(match):
    alliances = match['alliances']
    scores = {alliance['color']: (int(alliance['score']), [team['team']['id'] for team in alliance['teams']]) for alliance in alliances}
    
    if scores['red'][0] == 0 and scores['blue'][0] == 0:
        return [], [], [], True  # Return an additional flag indicating to skip this match
    
    # Check if it's a draw
    if scores['red'][0] == scores['blue'][0]:
        # It's a draw, combine both teams
        draw_team_ids = scores['red'][1] + scores['blue'][1]
        return [], [], draw_team_ids, False
    else:
        # Determine winner and loser based on score
        winner_color = max(scores, key=lambda x: scores[x][0])
        loser_color = 'blue' if winner_color == 'red' else 'red'
        
        winning_team_ids = scores[winner_color][1]
        losing_team_ids = scores[loser_color][1]
        
        return winning_team_ids, losing_team_ids, [], False
             
def determine_match_outcome_elo(match):
    alliances = match['alliances']
    scores = {alliance['color']: (int(alliance['score']), [team['team']['id'] for team in alliance['teams']]) for alliance in alliances}
    
    if scores['red'][0] == 0 and scores['blue'][0] == 0:
        return [], [], True

    winner_color = max(scores, key=lambda x: scores[x][0])
    loser_color = 'blue' if winner_color == 'red' else 'red'
    
    winning_team_ids = scores[winner_color][1]
    losing_team_ids = scores[loser_color][1]
    
    return winning_team_ids, losing_team_ids, False

def extract_teams_from_match(match):
    teams = []
    for alliance in match.get('alliances', []):
        # logging.error(f"Added team: {alliance.get('teams', [])} to match")
        teams.extend(alliance.get('teams', []))
    return teams

def update_team_elo(team_id, elo, season_id):
    if season_id not in [181, 182]:
        logging.error(f"{season_id} not applicable, not updating ELO")
    try:
        response = team_data_table.update_item(
            Key={'id': team_id},
            UpdateExpression="SET elo.#season_id = :elo",
            ConditionExpression="attribute_exists(elo)",
            ExpressionAttributeNames={'#season_id': str(season_id)},
            ExpressionAttributeValues={':elo': Decimal(str(elo))},
            ReturnValues="UPDATED_NEW"
        )
        logging.error(f"Updated elo for team {team_id}")
    except team_data_table.meta.client.exceptions.ConditionalCheckFailedException:
        # If elo_rankings does not exist, initialize it and then set the season's ELO rating
        response = team_data_table.update_item(
            Key={'id': team_id},
            UpdateExpression="SET elo = :empty_map",
            ExpressionAttributeValues={':empty_map': {str(season_id): Decimal(str(elo))}},
            ReturnValues="UPDATED_NEW"
        )
        logging.error(f"Updated elo for team {team_id}, in except block")
    except Exception as e:
        logging.error(f"Error updating team ELO: {e}")

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
    
def update_team_data_with_match(team_id, match_id):
    # Ensure the match data is in the correct format for DynamoDB
    response = team_data_table.update_item(
        Key={'id': int(team_id)},
        UpdateExpression='SET matches = list_append(if_not_exists(matches, :empty_list), :match)',
        ExpressionAttributeValues={
            ':match': [match_id],
            ':empty_list': [],
        },
        ReturnValues='UPDATED_NEW'
    )
    logging.info(f"Updated team-data for team ID {team_id} with match id {match_id}.")

def remove_match_from_team_data(team_id, match_id):
    response = team_data_table.get_item(
        Key={'id': int(team_id)}
    )
    matches = response['Item']['matches'] if 'Item' in response and 'matches' in response['Item'] else []

    match_index = None
    for index, m_id in enumerate(matches):
        if m_id == match_id:
            match_index = index
            break

    if match_index is not None:
        try:
            update_response = team_data_table.update_item(
                Key={'id': int(team_id)},
                UpdateExpression=f'REMOVE matches[{match_index}]',
                ReturnValues='UPDATED_NEW'
            )
            logging.error(f"Updated team-data for team ID {team_id} with removed match id {match_id}")
        except Exception as e:
            logging.error(f"Error updating team-data for team ID {team_id}: {e}")
    else:
        logging.info(f"Match ID {match_id} not found in matches for team ID {team_id}.")
        
def remove_ranking_from_team_data(team_id, ranking_id):
    response = team_data_table.get_item(
        Key={'id': int(team_id)}
    )
    rankings = response['Item']['rankings'] if 'Item' in response and 'rankings' in response['Item'] else []

    ranking_index = None
    for index, r_id in enumerate(rankings):
        if r_id == ranking_id:
            ranking_index = index
            break

    if ranking_index is not None:
        try:
            update_response = team_data_table.update_item(
                Key={'id': int(team_id)},
                UpdateExpression=f'REMOVE matches[{ranking_index}]',
                ReturnValues='UPDATED_NEW'
            )
            logging.error(f"Updated team-data for team ID {team_id} with removed match id {ranking_id}")
        except Exception as e:
            logging.error(f"Error updating team-data for team ID {team_id}: {e}")
    else:
        logging.info(f"Match ID {ranking_id} not found in matches for team ID {team_id}.")
    
def remove_match_from_match_data(match_id):
    response = match_data_table.delete_item(
        Key={
            'id': match_id 
        }
    )
    logging.info(f"Removed match data with match ID {match_id} from DynamoDB")
    
def remove_ranking_from_ranking_data(ranking_id):
    response = rankings_data_table.delete_item(
        Key={
            'id': ranking_id 
        }
    )
    logging.info(f"Removed match data with match ID {ranking_id} from DynamoDB")
    
def update_team_data_with_award(team_id, award_id):
    response = team_data_table.update_item(
        Key={'id': int(team_id)},
        UpdateExpression='SET awards = list_append(if_not_exists(awards, :empty_list), :match)',
        ExpressionAttributeValues={
            ':award': [award_id],
            ':empty_list': [],
        },
        ReturnValues='UPDATED_NEW'
    )
    logging.info(f"Updated team-data for team ID {team_id} with award id {award_id}.")
    
def update_team_data_with_ranking(team_id, ranking_id):
    response = team_data_table.update_item(
        Key={'id': int(team_id)},
        UpdateExpression='SET rankings = list_append(if_not_exists(rankings, :empty_list), :match)',
        ExpressionAttributeValues={
            ':match': [ranking_id],
            ':empty_list': [],
        },
        ReturnValues='UPDATED_NEW'
    )
    logging.info(f"Updated team-data for team ID {team_id} with ranking id {ranking_id}.")

def update_match_data_with_match(match, division_name, division_id, event_name, event_id, event_start, season):
    # Extract the match ID and use it as the primary key
    match_id = match.pop('id')  # This removes the 'id' key and gets its value

    # Now, match_id is the primary key, and match is the rest of the match data
    response = match_data_table.put_item(
        Item={
            'id': match_id,  # Set the primary key
            'division_name': division_name,
            'division_id': division_id,
            'event_name': event_name,
            'event_id': event_id,
            'event_start': event_start,
            'season': season,
            **match  # Spread the remaining match data as item attributes
        }
    )
    logging.info(f"Posted match data with match ID {match_id}, division '{division_name}' ({division_id}), and event '{event_name}' ({event_id}) to DynamoDB.")



def update_rankings_data(division_name, division_id, event_name, event_id, event_start, program, season, ranking):
    rankings_data_table.put_item(
        Item={
            'division_id': division_id,
            'division_name': division_name,
            'event_id': event_id,
            'event_name': event_name,
            'event_start': event_start,
            'program': program,
            'season': season,
            **ranking  # Assuming the rest of the ranking information is to be stored as is
        }
    )
    logging.info(f"Updated ranking {ranking['id']} for division {division_name} ({division_id}) of event {event_name} ({event_id}).")


def update_awards_data(event_id, awards, program, season):
    for award in awards:
        awards_data_table.put_item(
            Item={
                'program': program,
                'season': season,
                **award
            }
        )
        logging.info(f"Posted award data with award ID {award['id']} to DynamoDB.")

def find_match_differences(old_divisions, new_divisions):
    updated_matches = []
    removed_matches = []

    # Convert new matches to a dictionary for easier lookup
    new_matches_dict = {}
    for new_division in new_divisions:
        if 'matches' in new_division:
            new_matches_dict[new_division['id']] = {match['id']: match for match in new_division['matches'] if isinstance(match, dict)}
    
    for old_division in old_divisions:
        old_division_id = old_division['id']
        for new_division in new_divisions:
            if old_division_id == new_division['id'] and 'matches' in old_division:
                logging.info(f"Looking at division id: {old_division_id}")
                
                # Convert old matches to a dictionary for easier lookup by match id
                old_matches_dict = {match['id']: match for match in old_division['matches'] if isinstance(match, dict)}

                # Check for updated or new matches
                for match_id, new_match in new_matches_dict.get(old_division_id, {}).items():
                    if match_id not in old_matches_dict or new_match != old_matches_dict[match_id]:
                        updated_matches.append({
                            'division_id': old_division_id,
                            'division_name': new_division.get('name', 'Unknown Division'),
                            **new_match
                        })
                        logging.info(f"Updated/new match found: {match_id}")

                # Check for removed matches
                for match_id, old_match in old_matches_dict.items():
                    if old_division_id not in new_matches_dict or match_id not in new_matches_dict[old_division_id]:
                        removed_matches.append({
                            'division_id': old_division_id,
                            'division_name': old_division.get('name', 'Unknown Division'),
                            **old_match
                        })
                        logging.info(f"Removed match found: {match_id}")
                        
    logging.error(f"OLD DIVISIONS IS: {old_divisions}")                                       
    if not old_divisions:
        logging.error("IN IF")
        for new_division in new_divisions:
            for match_id, new_match in new_matches_dict[new_division['id']].items():
                logging.error("IN FOR LOOP")
                updated_matches.append({
                    'division_id': new_division['id'],
                    'division_name': new_division.get('name', 'Unknown Division'),
                    **new_match
                })
                logging.info(f"New match added (no old matches): {match_id}")
    return updated_matches, removed_matches

def find_updated_rankings(old_divisions, new_divisions):
    updated_rankings = []
    removed_rankings = []

    # Convert new rankings to a dictionary for easier lookup
    new_rankings_dict = {}
    for new_division in new_divisions:
        if 'rankings' in new_division:
            new_rankings_dict[new_division['id']] = {ranking['id']: ranking for ranking in new_division['rankings'] if isinstance(ranking, dict)}
    
    for old_division in old_divisions:
        old_division_id = old_division['id']
        # Check for updated or new rankings
        if old_division_id in new_rankings_dict and 'rankings' in old_division:
            logging.info(f"Looking at division id: {old_division_id} for updated rankings")
            
            # Convert old rankings to a dictionary for easier lookup by ranking id
            old_rankings_dict = {ranking['id']: ranking for ranking in old_division['rankings'] if isinstance(ranking, dict)}

            for ranking_id, new_ranking in new_rankings_dict.get(old_division_id, {}).items():
                if ranking_id not in old_rankings_dict or new_ranking != old_rankings_dict[ranking_id]:
                    updated_rankings.append({
                        'division_id': old_division_id,
                        'division_name': new_division.get('name', 'Unknown Division'),
                        **new_ranking
                    })
                    logging.info(f"Updated/new ranking found: {ranking_id}")

            # Check for removed rankings
            for ranking_id, old_ranking in old_rankings_dict.items():
                if old_division_id not in new_rankings_dict or ranking_id not in new_rankings_dict[old_division_id]:
                    removed_rankings.append({
                        'division_id': old_division_id,
                        'division_name': old_division.get('name', 'Unknown Division'),
                        **old_ranking
                    })
                    logging.info(f"Removed ranking found: {ranking_id}")
                    
    # Handle new divisions with new rankings when there are no old divisions
    if not old_divisions:
        for new_division in new_divisions:
            if 'rankings' in new_division:
                for ranking_id, new_ranking in new_rankings_dict[new_division['id']].items():
                    updated_rankings.append({
                        'division_id': new_division['id'],
                        'division_name': new_division.get('name', 'Unknown Division'),
                        **new_ranking
                    })
                    logging.info(f"New ranking added (no old rankings): {ranking_id}")

    return updated_rankings, removed_rankings

def find_updated_awards(old_awards, new_awards):
    updated_awards = []
    if new_awards != old_awards:
        updated_awards = new_awards
    return updated_awards

def find_new_teams(old_teams, new_teams):
    old_team_ids = {team for team in old_teams}
    new_team_ids = {team for team in new_teams}
    return new_team_ids.difference(old_team_ids)

def find_removed_teams(old_teams, new_teams):
    old_team_ids = {team for team in old_teams}
    new_team_ids = {team for team in new_teams}
    return old_team_ids.difference(new_team_ids)

def find_removed_matches(old_matches, new_matches):
    old_match_ids = {match['id'] for match in old_matches}
    new_match_ids = {match['id'] for match in new_matches}
    removed_match_ids = old_match_ids.difference(new_match_ids)
    return [match for match in old_matches if match['id'] in removed_match_ids]

def find_updated_skills(old_skills, new_skills):
    # Create dictionaries for quick ID-based lookup
    old_skills_dict = {skill['id']: skill for skill in old_skills}
    new_skills_dict = {skill['id']: skill for skill in new_skills}

    # Find new and changed skills
    updated_skills = []
    for skill_id, new_skill in new_skills_dict.items():
        old_skill = old_skills_dict.get(skill_id)
        # If the skill is new or has changed, add it to the list
        if not old_skill or new_skill != old_skill:
            updated_skills.append(new_skill)

    logging.error(f"Found updated/new Skills")
    return updated_skills

def update_team_events(team_id, event_data, season_id):
    event_id = event_data['id']  # Assuming event_id is a number

    # Update team data table
    response = team_data_table.update_item(
        Key={'id': int(team_id)},
        UpdateExpression='SET events = list_append(if_not_exists(events, :empty_list), :event_id)',
        ExpressionAttributeValues={
            ':event_id': [event_id],  # Append the event_id directly
            ':empty_list': [],
        },
        ReturnValues='UPDATED_NEW'
    )
    partition_key = f"{season_id}-{team_id}"
    
    # Define the update expression for appending -1 to the 'ccwms' list
    ccwms_update_expression = 'SET events = if_not_exists(events, :start) + :inc, ' \
                              'ccwms = list_append(if_not_exists(ccwms, :empty_list), :ccwms_value)'

    # Define the common expression attribute values for ELO and TS updates, including the new 'ccwms' update
    common_expression_attribute_values = {
        ':start': 0,
        ':inc': 1,
        ':empty_list': [],
        ':ccwms_value': [-1],  # Appending -1 to the 'ccwms' list
    }
    
    try:
        elo_response = elo_data_table.update_item(
            Key={'season-team': partition_key},
            UpdateExpression=ccwms_update_expression,
            ExpressionAttributeValues=common_expression_attribute_values,
            ReturnValues='UPDATED_NEW'
        )
    except Exception as e:
        logging.error(f"Error updating elo-data for team ID {team_id} for season {season_id}: {e}")
        
    try:
        ts_response = trueskill_data_table.update_item(
            Key={'season-team': partition_key},
            UpdateExpression=ccwms_update_expression,
            ExpressionAttributeValues=common_expression_attribute_values,
            ReturnValues='UPDATED_NEW'
        )
    except Exception as e:
        logging.error(f"Error updating trueskill-data for team ID {team_id} for season {season_id}: {e}")
        
    logging.info(f"Updated team-data for team ID {team_id} with event ID {event_id}.")


def remove_event_for_team(team_id, event_id):
    # Fetch the current team item
    response = team_data_table.get_item(Key={'id': int(team_id)})
    logging.info(f"Removing event from team_id {team_id}")
    if 'Item' in response:
        team_item = response['Item']
        if 'events' in team_item:
            updated_events = [event for event in team_item['events'] if event != event_id]
            team_data_table.update_item(
                Key={'id': int(team_id)},
                UpdateExpression='SET events = :updated_events',
                ExpressionAttributeValues={':updated_events': updated_events}
            )
            logging.info(f"Removed event {event_id} from team ID {team_id}")

def process_skills_updates(updated_skills, event_id, event_name, event_start):
    update_skills_ranking_data(updated_skills, event_id, event_name, event_start)
    # Process each updated skill
    for skill in updated_skills:
        skill_id = skill['id']
        team_id = skill['team']['id']
        team_number = skill['team']['name']
        skill.pop('team', None)
        # Update skills-data table
        skills_data_table.put_item(
            Item={
                'id': skill_id,
                'event_id': event_id,
                'event_name': event_name,
                'event_start': event_start,
                'team_id': team_id,
                'team_number': team_number,
                **skill  # Include all other skill attributes
            }
        )
        # Since we're only dealing with updated skills, there's no need to check for removed skills here
        team_data_table.update_item(
            Key={'id': int(team_id)},
            UpdateExpression='SET skills = list_append(if_not_exists(skills, :empty_list), :event_id)',
            ExpressionAttributeValues={
                ':event_id': [skill_id],  # Append the event_id directly
                ':empty_list': [],
            },
            ReturnValues='UPDATED_NEW'
        )
        logging.info(f"Updated skills-data for {skill_id}, of event {event_id}")
    # Update skills-ranking-data table based on the updated skills

def update_skills_ranking_data(skills, event_id, event_name, event_start):
    highest_scores = {}  # Format: {(team_id, type): (score, skills_id, team_number)}
    unique_items = {}  # Items to be updated in the skills-ranking-data table

    # Iterate through each skill item
    for skill_item in skills:
        team_id = skill_item['team']['id']   
        skill_type = skill_item['type']
        score = skill_item['score']
        skills_id = skill_item['id']
        season = skill_item['season']['id']
        team_number = skill_item['team']['name'] 
        
        # Fetch team data
        response = team_data_table.get_item(Key={'id': team_id})
        team_info = response.get('Item', {})
        team_name = team_info.get('team_name', "")
        team_org = team_info.get('organization', "")
        program = team_info.get('program', "")
        team_grade = team_info.get('grade', "")
        region = team_info.get('region', "")

        key = (event_id, team_id, skill_type)
        if key not in highest_scores or score > highest_scores[key][0]:
            highest_scores[key] = (score, skills_id, team_number, team_name, team_org, team_grade, program, region)

    # Prepare items for skills-ranking-data table
    for (event_id, team_id, skill_type), (score, skills_id, team_number, team_name, team_org, team_grade, program, region) in highest_scores.items():
        item_key = f"{event_id}-{team_id}-{skill_type}"
        unique_items[item_key] = {
            'event_team_id': item_key,
            'type': skill_type,
            'score': score,
            'skills_id': skills_id,
            'event_id': event_id,
            'event_name': event_name,
            'event_start': event_start,
            'team_id': team_id,
            'team_number': team_number,
            'team_name': team_name,
            'team_org': team_org,
            'team_grade': team_grade,
            'season': season,
            'program': program,
            'region': region
        }

        # Check for 'robot' entry creation
        opposite_type = 'programming' if skill_type == 'driver' else 'driver'
        opposite_key = (event_id, team_id, opposite_type)
        if opposite_key in highest_scores:
            opposite_score, opposite_skills_id, _, _, _, _, _, _ = highest_scores[opposite_key]
            robot_score = score + opposite_score
            robot_item_key = f"{event_id}-{team_id}"

            driver_score = score if skill_type == 'driver' else opposite_score
            programming_score = opposite_score if skill_type == 'driver' else score

            unique_items[robot_item_key] = {
                'event_team_id': robot_item_key,
                'type': 'robot',
                'score': robot_score,
                'event_id': event_id,
                'event_name': event_name,
                'event_start': event_start,
                'team_id': team_id,
                'team_number': team_number,
                'team_name': team_name,
                'team_org': team_org,
                'team_grade': team_grade,
                'season': season,
                'program': program,
                'region': region,
                'driver_component': driver_score,
                'programming_component': programming_score
            }
        else:
            # If the opposite type doesn't exist, use the same score for 'robot'
            robot_item_key = f"{event_id}-{team_id}"
            driver_score = score if skill_type == 'driver' else 0
            programming_score = score if skill_type == 'programming' else 0

            unique_items[robot_item_key] = {
                'event_team_id': robot_item_key,
                'type': 'robot',
                'score': score,  # Use the existing score since the opposite type doesn't exist
                'event_id': event_id,
                'event_name': event_name,
                'event_start': event_start,
                'team_id': team_id,
                'team_number': team_number,
                'team_name': team_name,
                'team_org': team_org,
                'team_grade': team_grade,
                'season': season,
                'program': program,
                'region': region,
                'driver_component': driver_score,
                'programming_component': programming_score
            }



    # Update skills-ranking-data table
    with skills_ranking_data_table.batch_writer() as batch:
        for item in unique_items.values():
            batch.put_item(Item=item)


def fetch_divisions_from_s3(s3_reference):
    """
    Fetch the current and previous version of the divisions data from S3 using the provided reference.
    Returns a tuple (current_data, previous_data), where each is a dict representing the divisions data.
    If there is no previous version, previous_data will be None.
    """
    bucket_name, key = s3_reference.replace("s3://", "").split("/", 1)
    versions = s3_client.list_object_versions(Bucket=bucket_name, Prefix=key)
    current_version_id = versions['Versions'][0]['VersionId']
    previous_version_id = versions.get('Versions')[1]['VersionId'] if len(versions.get('Versions')) > 1 else None
    
    # Fetch the current version
    current_obj = s3_client.get_object(Bucket=bucket_name, Key=key, VersionId=current_version_id)
    current_data = json.loads(current_obj['Body'].read().decode('utf-8'))

    # Fetch the previous version if it exists
    previous_data = {}
    if previous_version_id:
        try:
            previous_obj = s3_client.get_object(Bucket=bucket_name, Key=key, VersionId=previous_version_id)
            previous_data = json.loads(previous_obj['Body'].read().decode('utf-8'))
        except Exception as e:
            logging.error(f"Error unloading previous s3 object, setting to an empty dict")

    logging.error(f"current data: {current_data}")
    logging.error(f"previous data: {previous_data}")
    return decimal_default(current_data), decimal_default(previous_data)


def handler(aws_event, context):
    logging.error("Beginning stream update process")
    for record in aws_event['Records']:
        if record['eventName'] == 'MODIFY':
            # Unmarshall the DynamoDB images to regular Python dictionaries
            new_image = unmarshall_dynamodb_item(record['dynamodb']['NewImage'])
            old_image = unmarshall_dynamodb_item(record['dynamodb']['OldImage'])
            event_id = new_image.get('id')
            event_name = new_image.get('name', None)
            event_start = new_image.get('start', None)
            program = new_image.get('program', None)
            season_obj = new_image.get('season', None)
            region = new_image.get('region', None)
            if season_obj != None: season = season_obj.get('id', None)
            else: season = None
            logging.error(f"Updating data from stream for event id: {event_id}, name: {event_name}")
            # Convert 'awards_finalized' to a lowercase string representation
            if 'awards_finalized' in new_image and isinstance(new_image['awards_finalized'], bool):
                new_image['awards_finalized'] = str(new_image['awards_finalized']).lower()
                
            # Process new/removed matches and rankings
            # Check if 'divisions' exist
            if 'divisions' in new_image and 'divisions' in old_image:
                logging.error(f"new image divisions: {new_image['divisions']}")
                if 'divisions_s3_reference' in new_image['divisions'] or f's3://exodb-event-data-storage/event-{event_id}/divisions' in new_image['divisions']:
                    logging.info("LOOKING IN S3")
                    divisions_reference = f's3://exodb-event-data-storage/event-{event_id}/divisions'
                    new_divisions, old_divisions = fetch_divisions_from_s3(divisions_reference)
                else:
                    logging.info("NOT LOOKING IN S3")
                    new_divisions = new_image['divisions']
                    old_divisions = old_image['divisions']
                updated_rankings, removed_rankings = find_updated_rankings(old_divisions, new_divisions)
                logging.error(f"{len(updated_rankings)} updated rankings")
                updated_matches, removed_matches = find_match_differences(old_divisions, new_divisions)
                logging.error(f"{len(updated_matches)} updated matches")
                
                # Process new/removed rankings within divisions
                for updated_ranking in updated_rankings:
                    division_id = updated_ranking['division_id']
                    division_name = updated_ranking['division_name']
                    update_ts_elo_with_ranking(season, updated_ranking)
                    update_rankings_data(division_name, division_id, event_name, event_id, event_start, program, season, updated_ranking)
                    update_team_data_with_ranking(updated_ranking['team']['id'], updated_ranking['id'])

                # Process new/removed matches within divisions
                for match in updated_matches:
                    division_id = int(match['division_id'])
                    division_name = match['division_name']
                    process_match(match, division_name, division_id, event_name, event_id, event_start, season)
                    
                for match in removed_matches:
                    logging.info(f"Found removed matches: {removed_matches}")
                    remove_match(match, event_id)
                    
                for ranking in removed_rankings:
                    logging.error(f"Found removed rankings: {removed_rankings}")
                    remove_ranking(ranking, event_id)
                


            if 'awards' in new_image and 'awards' in old_image:
                updated_awards = find_updated_awards(old_image['awards'], new_image['awards'])
                update_awards_data(new_image['id'], updated_awards, program, season)
                for award in updated_awards:
                    team_id = award.get('team', {}).get('id')
                    if team_id:
                        update_team_data_with_award(team_id, new_image['id'])

            # Process new/removed teams
            if 'teams' in new_image and 'teams' in old_image:
                # Process new teams
                new_teams = find_new_teams(old_image['teams'], new_image['teams'])
                event_data = new_image  # Using the entire new_image as event data for simplicity
                for team_id in new_teams:
                    update_team_events(team_id, event_data, season)
                # Process removed teams
                removed_teams = find_removed_teams(old_image['teams'], new_image['teams'])
                event_id = new_image.get('id')
                if removed_teams and event_id:
                    for team_id in removed_teams:
                        remove_event_for_team(team_id, event_id)

            # Check if 'skills' data has been updated
            if 'skills' in new_image and 'skills' in old_image:
                new_skills = new_image.get('skills', [])
                old_skills = old_image.get('skills', [])

                updated_skills = find_updated_skills(old_skills, new_skills)
                if updated_skills:
                    logging.info(f"Processing {len(updated_skills)} new/changed skills.")
                    # Assuming process_skills_updates is modified to accept only the updated_skills list
                    process_skills_updates(updated_skills, event_id, event_name, event_start)

    logging.info("Process complete")
    return {
        'statusCode': 200,
        'body': json.dumps("Processing completed")
    }