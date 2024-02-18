import boto3
import time
import requests
from botocore.exceptions import ClientError

# Script to get team skills, awards, and rankings data.


# Initialize a DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('team-data')

API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiODU4MTYxMzQ1MmUyMjE2YjE5MWEwY2Q5NjVkMmE4YThkNWZkYjZhNjI4ZWEwNjM3YzMyNjM1OWVkMmRiZWU3ODdjMjBiNDcyMDhiM2ZkMjUiLCJpYXQiOjE3MDIxMDAyNDguNDA4MjA1LCJuYmYiOjE3MDIxMDAyNDguNDA4MjA3OSwiZXhwIjoyNjQ4ODcxNDQ4LjM5OTk1OTEsInN1YiI6IjkwODM3Iiwic2NvcGVzIjpbXX0.Tk_BPVkoN42aEdJDMH_tAOnhhVZZiZ93VJVxELdwEw3npoJFWoqPKYgCPrPOt4X5YvyOQn82-UBJCUmXbPEJSGWK6gERFKLygi48afODQc-c9s5GnWJKT2Z5OQ608RJm9ZgDzzr7jk6nVJm-6gI9UJ4AUwFxlBTY4D6_uATPJNycD4EqJ7Wu9_jOBhW2Oek84fU9XzYrodTRpfwSmr5-g4mblM_1_r_hxrtIG4y22Gjt-qbRnAaIAnhehF5Z-9K82CQ7x95gLQXC1tzs-AWtv3upLjBqVM_mDiERlztNE08qJZ7o8etRJU9j5m1xFHPk9MF7vrNh2QdkL7JTYkNBoOEB-z-LfF4SJ2vlftFMvhiyxxnQ0YYmzjyBD5utjm5Tn-oZZ3umDmxQuc08yy2K_t21Pf8bTgMLKDs8RUdC6hxLgmNOy7fa1w2lYU7-NhjiZATNNqJ9WTTBoJxUqux290jXtPC2zzJcqFniV5DA4vdYWcFCHQAglPAUe3W5FfiLJ4CVZ4Sd6Kfb7euKVAG7DvuVxF7BwCQspBI8O31L9F0dKp2t-W9YBB0xjRbrQOnVOSPuTQdc1O4-R1OLz7Vr1BzKsNBBwSzt8ejqed3rpnpdrbm-rUJBj3UD7UGJgAYDeFIgNuB1i5MWd5dzfcQMXGQ_a8WGOCKGbXeLZC7WOoU'
headers = {
    'accept': 'application/json',
    'Authorization': f'Bearer {API_KEY}'
}

# Function to make API requests with rate limiting handling
def make_request(url, headers, initial_delay=5, retries=15):
    for _ in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json()
        elif response.status_code == 429:  # Rate limit exceeded
            print(f"Rate limit exceeded. Retrying in {initial_delay} seconds...")
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            print(f"Request failed with status code: {response.status_code}")
            return None

    return None

# General function to fetch data for a team (skills, rankings, awards)
def fetch_team_data(team_id, data_type):
    data = []
    page = 1
    while True:
        base_url = f"https://www.robotevents.com/api/v2/teams/{team_id}/{data_type}?page={page}&per_page=250"
        response_json = make_request(base_url, headers)

        if response_json is None:
            print(f"Failed to fetch {data_type} for team {team_id} at page {page}")
            break

        page_data = response_json.get('data', [])
        data.extend(page_data)

        if not response_json.get('meta', {}).get('next_page_url'):
            break  # No more pages to fetch

        page += 1

    return data

# Update DynamoDB with the fetched data
def update_team_data_in_dynamodb(team_id, data, data_type):
    try:
        update_expression = f"SET {data_type} = :val"
        response = table.update_item(
            Key={'id': team_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues={
                ':val': data
            },
            ReturnValues='UPDATED_NEW'
        )
        if response['ResponseMetadata']['HTTPStatusCode'] != 200:
            print(f"Failed to update {data_type} for team {team_id}, HTTPStatusCode: {response['ResponseMetadata']['HTTPStatusCode']}")
    except ClientError as e:
        print(f"Error updating {data_type} for team {team_id}: {e.response['Error']['Message']}")

# Main function to process each team
def process_teams():
    done = False
    start_key = None
    page_count = 1

    while not done:
        # Fetch a page of teams
        scan_kwargs = {
            'ProjectionExpression': 'id',
            'Limit': 25  # Adjust based on your capacity and needs
        }
        if start_key:
            scan_kwargs['ExclusiveStartKey'] = start_key

        response = table.scan(**scan_kwargs)
        teams = response.get('Items', [])
        print(f"Processing page {page_count} with {len(teams)} teams")

        # Process each team in the current page
        for team in teams:
            team_id = team['id']
            for data_type in ['skills', 'rankings', 'awards']:
                team_data = fetch_team_data(team_id, data_type)
                update_team_data_in_dynamodb(team_id, team_data, data_type)
                print(f"Updated {data_type} for team {team_id}")

        # Check if there are more pages to fetch
        start_key = response.get('LastEvaluatedKey', None)
        done = start_key is None
        page_count += 1

if __name__ == "__main__":
    process_teams()