import boto3
import time

# Initialize a DynamoDB client
dynamodb = boto3.resource('dynamodb')

# Reference to your DynamoDB tables
event_data_table = dynamodb.Table('event-data')
team_data_table = dynamodb.Table('team-data')

events = 1
# Function to split a list into chunks of a specified size
def chunk_list(input_list, chunk_size):
    for i in range(0, len(input_list), chunk_size):
        yield input_list[i:i + chunk_size]

# Updated function to handle more than 100 team IDs
def get_team_numbers(team_ids):
    team_numbers = []

    # Split team_ids into chunks of 100 or fewer
    for chunk in chunk_list(team_ids, 100):
        keys = [{'id': team_id} for team_id in chunk]
        response = dynamodb.batch_get_item(
            RequestItems={
                'team-data': {
                    'Keys': keys,
                    'ProjectionExpression': "#num",  # Use a placeholder for the reserved keyword
                    'ExpressionAttributeNames': {
                        "#num": "number"  # Define the placeholder
                    }
                }
            }
        )

        # Accumulate team numbers from the response
        for item in response['Responses']['team-data']:
            if 'number' in item:
                team_numbers.append(item['number'])
            else:
                # Log the issue or handle the missing 'number' attribute as appropriate
                print(f"Warning: A team item does not have a 'number' attribute: {item}")
    
    return team_numbers

# Function to update a single event with team_numbers
def update_event_with_team_numbers(event):
    global events
    if 'team_numbers' in event:
        print(f"Event {event['id']} already has 'team_numbers', skipping. {events} events processed")
        events += 1
        return
    if 'teams' not in event or not event['teams']:
        print(f"Event {event['id']} has no 'teams' attribute, skipping. {events} events processed")
        events += 1
        return

    team_ids = event['teams']
    team_numbers = get_team_numbers(team_ids)

    try:
        # Update the event item with team_numbers
        event_data_table.update_item(
            Key={'id': event['id']},
            UpdateExpression='SET team_numbers = :val',
            ExpressionAttributeValues={':val': team_numbers}
        )
        print(f"Processed event {event['id']}, {events} processed")
    except Exception as e:
        print(f"Failed to update event {event['id']} due to error: {str(e)}")
    finally:
        events += 1

def process_event(event_id):
    global events
    # Fetch the event by its ID
    response = event_data_table.get_item(Key={'id': event_id})
    if 'Item' in response:
        event = response['Item']
        update_event_with_team_numbers(event)
        

def process_events():
    global events
    scan_kwargs = {}
    done = False
    count = 0
    while not done:
        count += 1
        response = event_data_table.scan(**scan_kwargs)
        print(f"Scanned page {count}")
        for event in response['Items']:
            update_event_with_team_numbers(event)
        # Check if there are more items to process
        if 'LastEvaluatedKey' in response:
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
        else:
            done = True

print("Starting process")
# process_event(49725)
process_events()
print("Process complete")
