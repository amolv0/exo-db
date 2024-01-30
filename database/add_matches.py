import boto3
import time
import requests
from botocore.exceptions import ClientError

# One-time script intended to add matches to every team in the team-data database.
 

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('team-data')


API_KEY = 'REDACTED_API_KEY'
API_KEY_2 = 'REDACTED_API_KEY'
headers = {
    'accept': 'application/json',
    'Authorization': f'Bearer {API_KEY_2}'
}

# Fetch team data from the DynamoDB table with pagination
def fetch_teams():
    print("Scanning teams")
    response = table.scan()
    teams = response['Items']
    count = 1
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        teams.extend(response['Items'])
        print(f"Scanned page {count}")
        count += 1
        if count == 5:
            print("count is 5, breaking for testing purposess")
            break

    return teams

# Fetch match data for a team across all pages from the API

def make_request(url, headers, initial_delay=5, retries = 15):
    for _ in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json()
        elif response.status_code == 429:
            print(f"Rate limit exceeded. Retrying in {initial_delay} seconds...")
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            print(f"Request failed with status code: {response.status_code}")
            return None

    return None

def fetch_matches(team_id):
    matches = []
    page = 1
    while True:
        base_url = f"https://www.robotevents.com/api/v2/teams/{team_id}/matches?page={page}&per_page=250"
        response_json = make_request(base_url, headers)

        if response_json is None:
            print(f"Failed to fetch matches for team {team_id} at page {page}")
            break  # Exit if the request failed

        page_matches = response_json.get('data', [])
        matches.extend(page_matches)

        if not response_json.get('meta', {}).get('next_page_url'):
            break  # No more pages to fetch

        page += 1

    return matches

# Update the matches attribute in DynamoDB
def update_matches_in_dynamodb(team_id, matches):
    try:
        response = table.update_item(
            Key={'id': team_id},
            UpdateExpression='SET matches = :val',
            ExpressionAttributeValues={
                ':val': matches
            },
            ReturnValues='UPDATED_NEW'  # Returns the attribute values as they appear after the UpdateItem operation
        )
        # Check for successful update by inspecting the HTTP status code in the response
        if response['ResponseMetadata']['HTTPStatusCode'] != 200:
            print(f"Failed to update matches for team {team_id}, HTTPStatusCode: {response['ResponseMetadata']['HTTPStatusCode']}")
    except ClientError as e:
        # Handle specific DynamoDB errors or general AWS service errors
        print(f"Error updating matches for team {team_id}: {e.response['Error']['Message']}")

def main():
    teams = fetch_teams()
    count = 1
    for team in teams:
        team_id = team['id']
        matches = fetch_matches(team_id)
        update_matches_in_dynamodb(team_id, matches)
        print(f"Updated matches for team {team_id}. {count} teams updated.")

if __name__ == "__main__":
    main()