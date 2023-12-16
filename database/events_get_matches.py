import json
import requests
import boto3
import time
import sys

# DynamoDB and API setup
# Replace 'your-access-key-id' and 'your-secret-access-key' with your AWS access key ID and secret access key
aws_access_key_id = 'REDACTED_API_KEY'
aws_secret_access_key = 'REDACTED_API_KEY'
aws_region = 'us-east-1'
table_name = 'event-data'

# Create a DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name=aws_region, aws_access_key_id=aws_access_key_id, aws_secret_access_key=aws_secret_access_key)

events_table = dynamodb.Table('event-data')  # Replace with your DynamoDB table name

API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiODU4MTYxMzQ1MmUyMjE2YjE5MWEwY2Q5NjVkMmE4YThkNWZkYjZhNjI4ZWEwNjM3YzMyNjM1OWVkMmRiZWU3ODdjMjBiNDcyMDhiM2ZkMjUiLCJpYXQiOjE3MDIxMDAyNDguNDA4MjA1LCJuYmYiOjE3MDIxMDAyNDguNDA4MjA3OSwiZXhwIjoyNjQ4ODcxNDQ4LjM5OTk1OTEsInN1YiI6IjkwODM3Iiwic2NvcGVzIjpbXX0.Tk_BPVkoN42aEdJDMH_tAOnhhVZZiZ93VJVxELdwEw3npoJFWoqPKYgCPrPOt4X5YvyOQn82-UBJCUmXbPEJSGWK6gERFKLygi48afODQc-c9s5GnWJKT2Z5OQ608RJm9ZgDzzr7jk6nVJm-6gI9UJ4AUwFxlBTY4D6_uATPJNycD4EqJ7Wu9_jOBhW2Oek84fU9XzYrodTRpfwSmr5-g4mblM_1_r_hxrtIG4y22Gjt-qbRnAaIAnhehF5Z-9K82CQ7x95gLQXC1tzs-AWtv3upLjBqVM_mDiERlztNE08qJZ7o8etRJU9j5m1xFHPk9MF7vrNh2QdkL7JTYkNBoOEB-z-LfF4SJ2vlftFMvhiyxxnQ0YYmzjyBD5utjm5Tn-oZZ3umDmxQuc08yy2K_t21Pf8bTgMLKDs8RUdC6hxLgmNOy7fa1w2lYU7-NhjiZATNNqJ9WTTBoJxUqux290jXtPC2zzJcqFniV5DA4vdYWcFCHQAglPAUe3W5FfiLJ4CVZ4Sd6Kfb7euKVAG7DvuVxF7BwCQspBI8O31L9F0dKp2t-W9YBB0xjRbrQOnVOSPuTQdc1O4-R1OLz7Vr1BzKsNBBwSzt8ejqed3rpnpdrbm-rUJBj3UD7UGJgAYDeFIgNuB1i5MWd5dzfcQMXGQ_a8WGOCKGbXeLZC7WOoU'
API_KEY_2 = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiZjBkNGE3YjYwYjU5ZGY2MjFlYTk1MjZkZDUzMDg5NTA1ZDRjYTM4ZGM3YjJkYjhlNzdhMDY4NGNiNWE4YjVmZDE0MDYyZDA1ZjlmZDM0NTQiLCJpYXQiOjE3MDIyNzQ0MjcuNzE1MDI1OSwibmJmIjoxNzAyMjc0NDI3LjcxNTAzLCJleHAiOjI2NDkwNDU2MjcuNzA2MjQyMSwic3ViIjoiOTA4MzciLCJzY29wZXMiOltdfQ.moxph7N_eE2AlY26W5hY4N3DCbL_AfI1NKC2J1fgLTzzXaUl_k1bCdlnr7ONJrZ6G3TdzcG6qZvTcTtxB1MqMaUOXY3nZYRiHX-3Y0IR2usvMxQQuuH0l91BYdBsc64XctX0CtRYPrikgEACpSLsWedk-pEBXdC7b4_LUut_Ahi65cJnkbB5bvViFZaYbd4zUkMV2uHU7yKwzT93ty1WFH-PwBXv1KKuxgfO5__NwJNTX5sVBQZm6rdgxvkWdkY1t2_QHHoxHgzDxRDhy8kdMiXzpJBQXoKLK6oFydc8jwdcWeLuljTquiHGtiAHxbpwRSysl9H7-omM6YTPOb3gu7EhyEFCKCtXhVVi1r9Z8Y-piVxAvTiG2zjRzRpc3RyRpMnEnXqplSFbCc-LzCFBmZJU--bThZJI-kRRNsguGmKJ7VwAWyvJy2bk2jfRY55mQlw0wpRM3-cCzLyi9PKKNPWG7PbNs_zWplYh1R6eVtLMbmooCEsS4dkNTuGteIUX1HtoYrm65v1iHWLD6BtlYWVYV68GBe1N8OQc27YgIV63EMAw_eaMvbSbFLN_zEoBXRcAAK9khKqF7DtB_ezBEDf51hCJyuJaEm8A_YrUaLpY07xFIKJaB7QsnI_EMphqvoKpt2n_VmPsLNWev1fu511ujvedbcC35wGKJdOztQE'

def log_message(message):
    with open("output.log", "a") as log_file:
        log_file.write(message + "\n")
        log_file.flush()  # Flush the file buffer immediately
    sys.stdout.write(message + "\n")
    sys.stdout.flush()  # Flush the stdout buffer immediately

sys.stdout = open("output.log", "w")
sys.stderr = sys.stdout

def make_request(url, headers, retries=10, initial_delay=5):
    for attempt in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            
            #print(f"Remaining Limit: {response.headers.get('x-ratelimit-remaining')}. ", end = '')
            log_message(f"Remaining Limit: {response.headers.get('x-ratelimit-remaining')}. ")
            time.sleep(1)
            return response.json().get('data', [])
        elif response.status_code == 429:
            remaining_limit = int(response.headers.get('x-ratelimit-remaining', 0))
            #print(f"Rate limit exceeded. Remaining limit: {remaining_limit}. ", end = '')
            log_message(f"Rate limit exceeded. Remaining limit: {remaining_limit}. ")
            if remaining_limit == 0:
                #print(f"No remaining limit, attempt: {attempt+1}. Retrying after delay of {initial_delay}...")
                log_message(f"No remaining limit, attempt: {attempt+1}. Retrying after delay of {initial_delay}...")
                time.sleep(initial_delay)
                initial_delay *= 2
            else:
                #print(f"Retrying in {initial_delay} seconds...")
                log_message(f"Retrying in {initial_delay} seconds...")
                time.sleep(initial_delay)
        else:
            #print(f"Request failed with status code: {response.status_code}")
            log_message(f"Request failed with status code: {response.status_code}")
            break

    return []

def get_matches(event_id, division_id):
    page = 1
    all_matches = []
    while True:
        api_url = f"https://www.robotevents.com/api/v2/events/{event_id}/divisions/{division_id}/matches?page={page}"
        matches_data = make_request(api_url, headers={'Authorization': f'Bearer {API_KEY}'})
        
        if matches_data:
            all_matches.extend(matches_data)

            # Check if there are more pages
            last_page = matches_data[0].get('meta', {}).get('last_page', 0)
            if page >= last_page:
                break
            else:
                page += 1
        else:
            break
    return all_matches

def update_dynamodb(event):
    for division in event.get('divisions', {'L': []}).get('L', []):
        division_id = division.get('M', {}).get('id', {}).get('N')
        if division_id:
            matches = get_matches(event['id']['N'], division_id)
            
            # Check if 'matches' item exists in the division, if not, create it
            if 'matches' not in division.get('M', {}):
                division['M']['matches'] = {'L': []}
            
            # Add the matches to the 'matches' item
            division['M']['matches']['L'].extend(matches)

            # Update the DynamoDB table with the new division data
            response = events_table.update_item(
                Key={'id': event['id']['N']},
                UpdateExpression='SET divisions = :d',
                ExpressionAttributeValues={':d': event['divisions']},
                ReturnValues='UPDATED_NEW'
            )
            log_message(f'Updated DynamoDB for Event ID: {event["id"]["N"]}, Division ID: {division_id}')


def scan_events():
    response = events_table.scan()
    events = response.get('Items', [])
    
    # Handling pagination
    while 'LastEvaluatedKey' in response:
        response = events_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        events.extend(response.get('Items', []))
    
    return events

def iterate_and_update_events():
    events_data = scan_events()
    for event in events_data:
        update_dynamodb(event)

if __name__ == "__main__":
    iterate_and_update_events()