import boto3

def log_message(message):
    print(message)
    with open("output.log", "a") as log_file:
        log_file.write(message + "\n")

def scan_event_data(dynamodb, table_name):
    log_message("Scanning")
    table = dynamodb.Table(table_name)
    scan_kwargs = {}
    done = False
    start_key = None
    all_items = []  # List to store all items
    count = 0

    while not done:
        if start_key:
            scan_kwargs['ExclusiveStartKey'] = start_key
        response = table.scan(**scan_kwargs)
        count += 1
        log_message(f"Scanned page {count}, retrieved {len(response.get('Items', []))} items")
        all_items.extend(response.get('Items', []))  # Add items from this page to the list
        start_key = response.get('LastEvaluatedKey', None)
        done = start_key is None

    log_message("Completed scanning")
    return all_items  # Return the list of all items


def scan_event_data_first_page(dynamodb, table_name):
    table = dynamodb.Table(table_name)
    response = table.scan()
    return response.get('Items', [])

def extract_matches(event_data):
    team_matches = {}
    for event_item in event_data:
        for division in event_item.get('divisions', []):
            for match in division.get('matches', {}).get('L', []):
                match_id = match.get('id')  # Directly access the match ID
                if not match_id:
                    continue  # Skip if match ID is not present

                alliances = match.get('alliances', [])
                for alliance in alliances:
                    teams = alliance.get('teams', {})
                    for team_info in teams:
                        team_id = team_info.get('team', {}).get('id', {})
                        if team_id:
                            if team_id not in team_matches:
                                team_matches[team_id] = []
                            team_matches[team_id].append(match_id)  # Append only the match ID

    log_message("Finished appending match IDs")
    return team_matches
1
def update_team_data(dynamodb, team_data_table, team_matches):
    table = dynamodb.Table(team_data_table)
    count = 0
    for team_id, matches in team_matches.items():
        count += 1
        # Update the item with the new matches attribute
        table.update_item(
            Key={
                'id': team_id, 
            },
            UpdateExpression="SET matches = :m",
            ExpressionAttributeValues={
                ':m': matches
            }
        )
        log_message(f"updated item count: {count}")

def main():
    # DynamoDB and API setup
    aws_access_key_id = 'REDACTED'
    aws_secret_access_key = 'REDACTED_API_KEY'
    aws_region = 'us-east-1'

    # Create a DynamoDB client
    dynamodb = boto3.resource('dynamodb', region_name=aws_region, aws_access_key_id=aws_access_key_id, aws_secret_access_key=aws_secret_access_key)
    event_data_table = 'event-data'
    team_data_table = 'team-data'

    event_data = scan_event_data(dynamodb, event_data_table)
    team_matches = extract_matches(event_data)
    update_team_data(dynamodb, team_data_table, team_matches)

if __name__ == "__main__":
    main()
 