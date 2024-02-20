import boto3
import json
from decimal import Decimal

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')

def transform_skill_data(skill, event_id, event_name):
    if isinstance(skill, dict) and 'id' in skill:
        skill['event_id'] = event_id
        skill['event_name'] = event_name
        skill['team_id'] = skill['team']['id']
        skill['team_number'] = skill['team']['name']
        skill.pop('team', None)
        skill.pop('division', None)
        return skill
    else:
        return None

def extract_skills_from_event(item):
    event_id = item['id']
    event_name = item.get('name', None)
    skills = []
    if 'skills' in item:
        for skill in item['skills']:
            transformed_skill = transform_skill_data(skill, event_id, event_name)
            if transformed_skill is not None:
                skills.append(transformed_skill)
    return skills

def batch_write_skills(skills_table, skills):
    with skills_table.batch_writer() as batch:
        for skill in skills:
            batch.put_item(Item=skill)

def update_skills_for_all_events(event_table, skills_table):
    scan_kwargs = {}
    page = 0
    count = 0
    while True:
        page += 1
        print(f"Scanning page {page}")
        response = event_table.scan(**scan_kwargs)
        for item in response.get('Items', []):
            skills = extract_skills_from_event(item)
            count += 1
            print(f"Adding skills from event {count}")
            if skills:
                batch_write_skills(skills_table, skills)
        if 'LastEvaluatedKey' in response:
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
        else:
            break

def update_skills_for_single_event(event_table, skills_table, event_id):
    try:
        response = event_table.get_item(Key={'id': event_id})
        item = response.get('Item', None)
        if item:
            skills = extract_skills_from_event(item)
            if skills:
                batch_write_skills(skills_table, skills)
                print(f"Updated skills for event ID: {event_id}")
            else:
                print(f"No skills found for event ID: {event_id}")
        else:
            print(f"No event found with ID: {event_id}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == '__main__':
    event_table = dynamodb.Table('event-data')
    skills_table = dynamodb.Table('skills-data')
    
    # Uncomment one of the lines below based on your need:
    
    # To update skills for all events
    update_skills_for_all_events(event_table, skills_table)
    
    # # To update skills for a single event (replace 'your_event_id_here' with your actual event ID)
    # test_event_id = 51500
    # update_skills_for_single_event(event_table, skills_table, test_event_id)
