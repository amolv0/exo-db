import boto3

# Initialize a DynamoDB resource
dynamodb = boto3.resource('dynamodb')
team_table = dynamodb.Table('team-data')

def delete_attributes_from_teams():
    # Define the attributes to be removed
    attributes_to_remove = ['elo', 'elo_rankings', 'teamskill', 'teamskill_rankings']
    
    # Use scan operation with pagination to iterate through all teams
    scan_kwargs = {
        'ProjectionExpression': '#id, ' + ', '.join(attributes_to_remove),
        'ExpressionAttributeNames': {'#id': 'id'}  # 'id' might be a reserved keyword
    }

    done = False
    start_key = None

    while not done:
        if start_key:
            scan_kwargs['ExclusiveStartKey'] = start_key
        response = team_table.scan(**scan_kwargs)
        teams = response.get('Items', [])
        
        # Update each team to remove the specified attributes if they exist
        for team in teams:
            update_expression = "REMOVE " + ', '.join(filter(lambda attr: attr in team, attributes_to_remove))
            if update_expression != "REMOVE ":
                print(f"Updating team {team['id']} to remove attributes.")
                try:
                    team_table.update_item(
                        Key={'id': team['id']},
                        UpdateExpression=update_expression
                    )
                except Exception as e:
                    print(f"Error updating team {team['id']}: {e}")
        
        start_key = response.get('LastEvaluatedKey', None)
        done = start_key is None

if __name__ == "__main__":
    delete_attributes_from_teams()