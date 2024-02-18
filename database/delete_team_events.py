import boto3

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
team_data_table = dynamodb.Table('team-data')

def delete_events_attribute():
    count = 0
    t = 0
    # Initialize scan parameters
    scan_kwargs = {}
    done = False
    start_key = None

    while not done:
        count += 1
        print(f"Scanned {count} pages.")
        if start_key:
            scan_kwargs['ExclusiveStartKey'] = start_key
        response = team_data_table.scan(**scan_kwargs)
        teams = response.get('Items', [])

        # Iterate through the teams and remove 'events' attribute
        for team in teams:
            t += 1
            print(f"Processing team {team['id']}. {t} teams processed")
            if 'events' in team:
                team_data_table.update_item(
                    Key={'id': team['id']},
                    UpdateExpression='REMOVE events',
                    ReturnValues='UPDATED_NEW'
                )

        # Handle pagination if there's more data
        start_key = response.get('LastEvaluatedKey', None)
        done = start_key is None

delete_events_attribute()
