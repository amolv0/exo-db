import boto3
import time
import requests
from botocore.exceptions import ClientError

# One-time script intended to add matches to every team in the team-data database.
 

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('team-data')


API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiODU4MTYxMzQ1MmUyMjE2YjE5MWEwY2Q5NjVkMmE4YThkNWZkYjZhNjI4ZWEwNjM3YzMyNjM1OWVkMmRiZWU3ODdjMjBiNDcyMDhiM2ZkMjUiLCJpYXQiOjE3MDIxMDAyNDguNDA4MjA1LCJuYmYiOjE3MDIxMDAyNDguNDA4MjA3OSwiZXhwIjoyNjQ4ODcxNDQ4LjM5OTk1OTEsInN1YiI6IjkwODM3Iiwic2NvcGVzIjpbXX0.Tk_BPVkoN42aEdJDMH_tAOnhhVZZiZ93VJVxELdwEw3npoJFWoqPKYgCPrPOt4X5YvyOQn82-UBJCUmXbPEJSGWK6gERFKLygi48afODQc-c9s5GnWJKT2Z5OQ608RJm9ZgDzzr7jk6nVJm-6gI9UJ4AUwFxlBTY4D6_uATPJNycD4EqJ7Wu9_jOBhW2Oek84fU9XzYrodTRpfwSmr5-g4mblM_1_r_hxrtIG4y22Gjt-qbRnAaIAnhehF5Z-9K82CQ7x95gLQXC1tzs-AWtv3upLjBqVM_mDiERlztNE08qJZ7o8etRJU9j5m1xFHPk9MF7vrNh2QdkL7JTYkNBoOEB-z-LfF4SJ2vlftFMvhiyxxnQ0YYmzjyBD5utjm5Tn-oZZ3umDmxQuc08yy2K_t21Pf8bTgMLKDs8RUdC6hxLgmNOy7fa1w2lYU7-NhjiZATNNqJ9WTTBoJxUqux290jXtPC2zzJcqFniV5DA4vdYWcFCHQAglPAUe3W5FfiLJ4CVZ4Sd6Kfb7euKVAG7DvuVxF7BwCQspBI8O31L9F0dKp2t-W9YBB0xjRbrQOnVOSPuTQdc1O4-R1OLz7Vr1BzKsNBBwSzt8ejqed3rpnpdrbm-rUJBj3UD7UGJgAYDeFIgNuB1i5MWd5dzfcQMXGQ_a8WGOCKGbXeLZC7WOoU'
API_KEY_2 = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiZjBkNGE3YjYwYjU5ZGY2MjFlYTk1MjZkZDUzMDg5NTA1ZDRjYTM4ZGM3YjJkYjhlNzdhMDY4NGNiNWE4YjVmZDE0MDYyZDA1ZjlmZDM0NTQiLCJpYXQiOjE3MDIyNzQ0MjcuNzE1MDI1OSwibmJmIjoxNzAyMjc0NDI3LjcxNTAzLCJleHAiOjI2NDkwNDU2MjcuNzA2MjQyMSwic3ViIjoiOTA4MzciLCJzY29wZXMiOltdfQ.moxph7N_eE2AlY26W5hY4N3DCbL_AfI1NKC2J1fgLTzzXaUl_k1bCdlnr7ONJrZ6G3TdzcG6qZvTcTtxB1MqMaUOXY3nZYRiHX-3Y0IR2usvMxQQuuH0l91BYdBsc64XctX0CtRYPrikgEACpSLsWedk-pEBXdC7b4_LUut_Ahi65cJnkbB5bvViFZaYbd4zUkMV2uHU7yKwzT93ty1WFH-PwBXv1KKuxgfO5__NwJNTX5sVBQZm6rdgxvkWdkY1t2_QHHoxHgzDxRDhy8kdMiXzpJBQXoKLK6oFydc8jwdcWeLuljTquiHGtiAHxbpwRSysl9H7-omM6YTPOb3gu7EhyEFCKCtXhVVi1r9Z8Y-piVxAvTiG2zjRzRpc3RyRpMnEnXqplSFbCc-LzCFBmZJU--bThZJI-kRRNsguGmKJ7VwAWyvJy2bk2jfRY55mQlw0wpRM3-cCzLyi9PKKNPWG7PbNs_zWplYh1R6eVtLMbmooCEsS4dkNTuGteIUX1HtoYrm65v1iHWLD6BtlYWVYV68GBe1N8OQc27YgIV63EMAw_eaMvbSbFLN_zEoBXRcAAK9khKqF7DtB_ezBEDf51hCJyuJaEm8A_YrUaLpY07xFIKJaB7QsnI_EMphqvoKpt2n_VmPsLNWev1fu511ujvedbcC35wGKJdOztQE'
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