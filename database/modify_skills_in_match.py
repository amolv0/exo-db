import boto3

## Update skills items in event-data table to remove 'events'

# Initialize the DynamoDB resource
dynamodb = boto3.resource('dynamodb')
event_table = dynamodb.Table('event-data')

def update_skills_for_all_events():
    page = 0
    count = 0
    scan_kwargs = {}
    while True:
        page += 1
        print(f"Scanning page {page}")
        response = event_table.scan(**scan_kwargs)
        for item in response.get('Items', []):
            count += 1
            print(f"Updating skills for event {item['id']}. {count} events processed")
            update_event_skills(item['id'])
        
        # Check for pagination
        if 'LastEvaluatedKey' in response:
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
        else:
            break

def update_event_skills(event_id):
    event_item = event_table.get_item(Key={'id': event_id}).get('Item')
    if not event_item:
        print(f"No event found with ID: {event_id}")
        return
    if 'skills' not in event_item:
        print(f"No skills found in event id: {event_id}")
        return
    skills = event_item['skills']
    for skill in skills:
        skill.pop('event', None)

    # Update the event item with the modified skills
    event_table.update_item(
        Key={'id': event_id},
        UpdateExpression='SET skills = :skills',
        ExpressionAttributeValues={':skills': skills}
    )
    # print(f"Skills updated for event ID: {event_id}")

def update_skills_for_single_event(event_id):
    print(f"Starting update for event {event_id}")
    update_event_skills(event_id)
    print(f"Update complete for event {event_id}")

print("Starting process to update skills")

# update_skills_for_single_event(35176)
update_skills_for_all_events()

print("Process to update skills for all events complete")