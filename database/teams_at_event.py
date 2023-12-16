import boto3

def update_event_data_table(dynamodb, event_id, team_id):
    table = dynamodb.Table('event-data')

    # Attempt to retrieve the existing item
    response = table.get_item(Key={'id': event_id})
    item = response.get('Item', {})

    # Check if the 'teams' list exists and update it
    if 'teams' in item:
        if team_id not in item['teams']:
            table.update_item(
                Key={'id': event_id},
                UpdateExpression="SET teams = list_append(teams, :i)",
                ExpressionAttributeValues={
                    ':i': [team_id],
                },
            )
    else:
        # Create a new 'teams' list with the current team
        table.update_item(
            Key={'id': event_id},
            UpdateExpression="SET teams = :i",
            ExpressionAttributeValues={
                ':i': [team_id],
            },
        )

def main():
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    team_data_table = dynamodb.Table('team-data')

    count = 0
    last_evaluated_key = None

    while True:
        if last_evaluated_key:
            response = team_data_table.scan(ExclusiveStartKey=last_evaluated_key)
        else:
            response = team_data_table.scan()

        for team in response['Items']:
            count += 1
            team_id = team['id']
            event_data = team.get('events', [])

            for event in event_data:
                event_id = event['id']
                update_event_data_table(dynamodb, event_id, team_id)

            # Print a message after processing each team
            print(f"Finished processing team ID: {team_id}. {count} teams processed")

        last_evaluated_key = response.get('LastEvaluatedKey')
        if not last_evaluated_key:
            break

if __name__ == "__main__":
    main()
    