import boto3

# Initialize a DynamoDB resource
dynamodb = boto3.resource('dynamodb')

# Table references
event_data_table = dynamodb.Table('event-data')
skills_ranking_data_table = dynamodb.Table('skills-ranking-data')
count = 0

import boto3

import boto3

def process_skills_for_event(event_item):
    global count
    count += 1
    print(f"Processing event: {event_item['id']}. Events Processed: {count}")
    if 'skills' not in event_item or 'name' not in event_item:
        print(f"Event {event_item['id']} does not have skills/name recorded, skipping")
        return
    event_name = event_item['name']
    highest_scores = {}
    unique_items = {}
    event_season = event_item['season']['id']
    program = event_item['program']
    event_start = event_item['start']
    if 'region' in event_item:
        region = event_item['region']
    else: region = None
    # Collect all unique team_ids
    team_ids = {int(skill_item['team']['id']) for skill_item in event_item['skills']}

    # Initialize DynamoDB client
    dynamodb = boto3.resource('dynamodb')
    team_data_table = dynamodb.Table('team-data')

    # Fetch team data in batches using BatchGetItem
    team_data = {}
    for batch_start in range(0, len(team_ids), 100):  # DynamoDB batch get limit is 100
        response = team_data_table.meta.client.batch_get_item(
            RequestItems={
                'team-data': {
                    'Keys': [{'id': team_id} for team_id in list(team_ids)[batch_start:batch_start + 100]]
                }
            }
        )
        for item in response['Responses']['team-data']:
            team_data[item['id']] = item

    # Iterate through skills items
    for skill_item in event_item['skills']:
        team_id = int(skill_item['team']['id'])
        team_number = skill_item['team']['name']  # Use team['name'] to get the team_number
        skill_type = skill_item['type']
        score = int(skill_item['score'])
        skills_id = skill_item['id']
        
        # Extract team_name and team_org from the fetched team data
        team_info = team_data.get(team_id, {})
        team_name = team_info.get('team_name', "")
        team_org = team_info.get('organization', "")

        if skill_type in ['programming', 'driver']:
            key = (team_id, skill_type)
            if key not in highest_scores or score > highest_scores[key][0]:
                highest_scores[key] = (score, skills_id, team_name, team_org, team_number)

    # Use batch_writer for batch writing
    with skills_ranking_data_table.batch_writer() as batch:
        # Processing
        for (team_id, skill_type), (score, skills_id, team_name, team_org, team_number) in highest_scores.items():
            item_key = f"{event_item['id']}-{team_id}-{skill_type}"
            unique_items[item_key] = {
                'event_team_id': f"{event_item['id']}-{team_id}",
                'type': skill_type,
                'score': score,
                'skills_id': skills_id,
                'event_id': event_item['id'],
                'event_name': event_name,
                'event_start': event_start,
                'team_id': team_id,
                'team_number': team_number,
                'team_name': team_name,
                'team_org': team_org,
                'season': event_season,
                'program': program,
                'region': region
            }

            # Check if the opposite type exists and create a 'robot' entry
            opposite_type = 'programming' if skill_type == 'driver' else 'driver'
            if (team_id, opposite_type) in highest_scores:
                robot_score = score + highest_scores[(team_id, opposite_type)][0]
                robot_key = f"{event_item['id']}-{team_id}"
                unique_items[robot_key] = {
                    'event_team_id': f"{event_item['id']}-{team_id}",
                    'type': 'robot',
                    'score': robot_score,
                    'event_id': event_item['id'],
                    'event_name': event_name,
                    'event_start': event_start,
                    'team_id': team_id,
                    'team_number': team_number,
                    'team_name': team_name,
                    'team_org': team_org,
                    'season': event_season,
                    'program': program,
                    'region': region
                }
            else:
                # If the opposite type doesn't exist, use the same score for 'robot'
                robot_key = f"{event_item['id']}-{team_id}"
                unique_items[robot_key] = {
                    'event_team_id': f"{event_item['id']}-{team_id}",
                    'type': 'robot',
                    'score': score,
                    'event_id': event_item['id'],
                    'event_name': event_name,
                    'event_start': event_start,
                    'team_id': team_id,
                    'team_number': team_number,
                    'team_name': team_name,
                    'team_org': team_org,
                    'season': event_season,
                    'program': program,
                    'region': region
                }

        # Write unique items to the table
        for item in unique_items.values():
            batch.put_item(Item=item)




# Function to process a single event by event ID
def process_single_event(event_id):
    response = event_data_table.get_item(Key={'id': event_id})
    if 'Item' in response:
        event_item = response['Item']
        if 'skills' in event_item:
            process_skills_for_event(event_item)
    else:
        print(f"No event found with ID: {event_id}")

# Function to paginate through the event-data table and process each event
def process_event_data():
    print("Starting process")
    count = 0
    response = event_data_table.scan()
    while response:
        count += 1
        print(f"Scanned page {count}")
        for event_item in response['Items']:
            if 'skills' in event_item:
                process_skills_for_event(event_item)
        
        if 'LastEvaluatedKey' in response:
            response = event_data_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        else:
            break
    print("Process complete")


# To process all events
        
process_event_data()

# process_single_event(39671)
