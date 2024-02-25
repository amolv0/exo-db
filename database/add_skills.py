import boto3
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal

# Initialize a DynamoDB resource
dynamodb = boto3.resource('dynamodb')

# Table references
event_data_table = dynamodb.Table('event-data')
skills_data_table = dynamodb.Table('skills-data')
team_data_table = dynamodb.Table('team-data')

count = 0

# Function to process and transform skills items
def process_skills_item(skill_item):
    # Add the new attributes
    skill_item['team_id'] = int(skill_item['team']['id'])
    skill_item['event_id'] = int(skill_item['event']['id'])
    skill_item['event_name'] = int(skill_item['event']['name'])
    skill_item['team_number'] = skill_item['team']['name']
    
    return skill_item

# Function to write items to the skills-data table using batch writes
def batch_write_skills(items):
    with skills_data_table.batch_writer() as batch:
        for item in items:
            batch.put_item(Item=item)

# Function to update the team-data table
def update_team_data(team_id, skill_id):
    response = team_data_table.get_item(Key={'id': team_id})
    if 'Item' in response:
        team_item = response['Item']
        if 'skills' not in team_item:
            print(f"Added 'skills' attribute to {team_item['id']}")
            team_item['skills'] = []
        if skill_id not in team_item['skills']:
            team_item['skills'].append(skill_id)
            team_data_table.update_item(
                Key={'id': team_id},
                UpdateExpression='SET skills = :skills',
                ExpressionAttributeValues={
                    ':skills': team_item['skills']
                }
            )

# Function to paginate through the event-data table and process each item
def process_event_data():
    # Start the pagination
    response = event_data_table.scan()
    count = 0
    events = 0
    while response:
        count += 1
        print(f"Scanned page {count}")
        for item in response['Items']:
            events += 1
            print(f"Processed event {item['id']}. {events} events processed")
            # Check if the 'skills' attribute exists
            if 'skills' in item:
                transformed_skills = []
                for skill_item in item['skills']:
                    # transformed_skill = process_skills_item(skill_item)
                    # transformed_skills.append(transformed_skill)
                    update_team_data(skill_item['team']['id'], int(skill_item['id']))

                # Write the transformed skills to the skills-data table
                # batch_write_skills(transformed_skills)

        # Check if there are more items to process
        if 'LastEvaluatedKey' in response:
            response = event_data_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        else:
            break

# Function to process a single event by event ID
def process_single_event(event_id):
    # Retrieve the event item by its ID
    response = event_data_table.get_item(Key={'id': event_id})
    if 'Item' in response:
        item = response['Item']
        # Check if the 'skills' attribute exists
        if 'skills' in item:
            transformed_skills = []
            for skill_item in item['skills']:
                # transformed_skill = process_skills_item(skill_item)
                # transformed_skills.append(transformed_skill)
                update_team_data(skill_item['team']['id'], int(skill_item['id']))

            # Write the transformed skills to the skills-data table
            # batch_write_skills(transformed_skills)
    else:
        print(f"No event found with ID: {event_id}")


# process_single_event(52370)
process_event_data()
