from datetime import datetime
from decimal import Decimal
import pytz
import json
import requests
import time
import boto3
from botocore.exceptions import ClientError


# This script is meant to be run to update the event-data with any information on events, including events that have retroactively taken place and events that are recorded in the future
# It is not a lambda function and takes a long time (couple hours) to fully run. This function, when other lambda functions are built, should not need to be called since events that have already 
# taken place (with matches recorded) should be updated in real-time, and future events should be updated by a periodic lambda function. 
# Its meant to be run to make update the database before those other functions are working properly

# Run with nohup: nohup python3 -u update_retroactive_events.py > ./logs/output.log 2>&1 &
# Find elapsed time with: ps -p $(pgrep -f update_retroactive_events.py) -o etime=

API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiODU4MTYxMzQ1MmUyMjE2YjE5MWEwY2Q5NjVkMmE4YThkNWZkYjZhNjI4ZWEwNjM3YzMyNjM1OWVkMmRiZWU3ODdjMjBiNDcyMDhiM2ZkMjUiLCJpYXQiOjE3MDIxMDAyNDguNDA4MjA1LCJuYmYiOjE3MDIxMDAyNDguNDA4MjA3OSwiZXhwIjoyNjQ4ODcxNDQ4LjM5OTk1OTEsInN1YiI6IjkwODM3Iiwic2NvcGVzIjpbXX0.Tk_BPVkoN42aEdJDMH_tAOnhhVZZiZ93VJVxELdwEw3npoJFWoqPKYgCPrPOt4X5YvyOQn82-UBJCUmXbPEJSGWK6gERFKLygi48afODQc-c9s5GnWJKT2Z5OQ608RJm9ZgDzzr7jk6nVJm-6gI9UJ4AUwFxlBTY4D6_uATPJNycD4EqJ7Wu9_jOBhW2Oek84fU9XzYrodTRpfwSmr5-g4mblM_1_r_hxrtIG4y22Gjt-qbRnAaIAnhehF5Z-9K82CQ7x95gLQXC1tzs-AWtv3upLjBqVM_mDiERlztNE08qJZ7o8etRJU9j5m1xFHPk9MF7vrNh2QdkL7JTYkNBoOEB-z-LfF4SJ2vlftFMvhiyxxnQ0YYmzjyBD5utjm5Tn-oZZ3umDmxQuc08yy2K_t21Pf8bTgMLKDs8RUdC6hxLgmNOy7fa1w2lYU7-NhjiZATNNqJ9WTTBoJxUqux290jXtPC2zzJcqFniV5DA4vdYWcFCHQAglPAUe3W5FfiLJ4CVZ4Sd6Kfb7euKVAG7DvuVxF7BwCQspBI8O31L9F0dKp2t-W9YBB0xjRbrQOnVOSPuTQdc1O4-R1OLz7Vr1BzKsNBBwSzt8ejqed3rpnpdrbm-rUJBj3UD7UGJgAYDeFIgNuB1i5MWd5dzfcQMXGQ_a8WGOCKGbXeLZC7WOoU'
API_KEY_2 = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiZjBkNGE3YjYwYjU5ZGY2MjFlYTk1MjZkZDUzMDg5NTA1ZDRjYTM4ZGM3YjJkYjhlNzdhMDY4NGNiNWE4YjVmZDE0MDYyZDA1ZjlmZDM0NTQiLCJpYXQiOjE3MDIyNzQ0MjcuNzE1MDI1OSwibmJmIjoxNzAyMjc0NDI3LjcxNTAzLCJleHAiOjI2NDkwNDU2MjcuNzA2MjQyMSwic3ViIjoiOTA4MzciLCJzY29wZXMiOltdfQ.moxph7N_eE2AlY26W5hY4N3DCbL_AfI1NKC2J1fgLTzzXaUl_k1bCdlnr7ONJrZ6G3TdzcG6qZvTcTtxB1MqMaUOXY3nZYRiHX-3Y0IR2usvMxQQuuH0l91BYdBsc64XctX0CtRYPrikgEACpSLsWedk-pEBXdC7b4_LUut_Ahi65cJnkbB5bvViFZaYbd4zUkMV2uHU7yKwzT93ty1WFH-PwBXv1KKuxgfO5__NwJNTX5sVBQZm6rdgxvkWdkY1t2_QHHoxHgzDxRDhy8kdMiXzpJBQXoKLK6oFydc8jwdcWeLuljTquiHGtiAHxbpwRSysl9H7-omM6YTPOb3gu7EhyEFCKCtXhVVi1r9Z8Y-piVxAvTiG2zjRzRpc3RyRpMnEnXqplSFbCc-LzCFBmZJU--bThZJI-kRRNsguGmKJ7VwAWyvJy2bk2jfRY55mQlw0wpRM3-cCzLyi9PKKNPWG7PbNs_zWplYh1R6eVtLMbmooCEsS4dkNTuGteIUX1HtoYrm65v1iHWLD6BtlYWVYV68GBe1N8OQc27YgIV63EMAw_eaMvbSbFLN_zEoBXRcAAK9khKqF7DtB_ezBEDf51hCJyuJaEm8A_YrUaLpY07xFIKJaB7QsnI_EMphqvoKpt2n_VmPsLNWev1fu511ujvedbcC35wGKJdOztQE'
headers = {
    'accept': 'application/json',
    'Authorization': f'Bearer {API_KEY_2}'
}


def make_request_base(url, headers, initial_delay=5, retries = 5):
    for _ in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json().get('data', [])
        elif response.status_code == 429:
            print(f"Rate limit exceeded. Retrying in {initial_delay} seconds...")
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            print(f"Request failed with status code: {response.status_code}")
            break

    return []


def make_request(event_id, url, headers, initial_delay = 5, retries = 5):    
    for _ in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json().get('data', [])
        elif response.status_code == 429:
            print(f"Rate limit exceeded, Event id: {event_id}. Retrying in {initial_delay} seconds...")
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            print(f"Request failed with status code: {response.status_code}")
            break

    return []


def get_teams(event_id):
    page = 1
    all_teams = []
    while True:
        api_url = f"https://www.robotevents.com/api/v2/events/{event_id}/teams?page={page}&per_page=250"
        teams_data = make_request(event_id, api_url, headers={'Authorization': f'Bearer {API_KEY}'})
        if teams_data:
            team_ids = [team['id'] for team in teams_data]
            all_teams.extend(team_ids)
            last_page = teams_data[0].get('meta', {}).get('last_page', 0)
            if page >= last_page:
                break
            else:
                page += 1
        else:
            break
    return all_teams

def get_matches(event_id, division_id):
    page = 1
    all_matches = []
    while True:
        api_url = f"https://www.robotevents.com/api/v2/events/{event_id}/divisions/{division_id}/matches?page={page}&per_page=250"
        matches_data = make_request(event_id, api_url, headers={'Authorization': f'Bearer {API_KEY}'})
        
        if matches_data:
            all_matches.extend(matches_data)
            last_page = matches_data[0].get('meta', {}).get('last_page', 0)
            if page >= last_page:
                break
            else:
                page += 1
        else:
            break
    return all_matches  

def get_last_page():
    for _ in range(5):
        response = requests.get("https://www.robotevents.com/api/v2/events?page=1&per_page=250", headers=headers)

        if response.status_code == 200:
            return response.json().get('meta', [])['last_page']
        elif response.status_code == 429:
            print(f"Rate limit exceeded. Retrying in {initial_delay} seconds...")
            time.sleep(initial_delay)
            initial_delay *= 2
        else:
            print(f"Request failed with status code: {response.status_code}")
            break
    return -1



# DynamoDB functions

def put_item_in_dynamodb(table, item_data):
    item_data = convert_values(item_data)
    try:
        response = table.put_item(Item=item_data)
        return response
    except ClientError as e:
        print(e.response['Error']['Message'])
        return None
    
def convert_values(obj): # Convert floats to decimals and 'ongoing' to a string
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        for key, value in obj.items():
            if key == 'ongoing' and isinstance(value, bool):
                obj[key] = str(value)
            else:
                obj[key] = convert_values(value)
    elif isinstance(obj, list):
        return [convert_values(v) for v in obj]
    return obj

def main():
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    event_data_table = dynamodb.Table('event-data')

    last_page = get_last_page()
    if(last_page == -1): # this indicates a rate limit that isnt resolved through delays, shouldnt happen
        return
    combined_data = []
    for i in range(last_page-12, last_page+1): # This is what to change to edit how far back this script will go. 
        url = f'https://www.robotevents.com/api/v2/events?page={i}&per_page=250' #250 is the max to show per page
        print(f"Got events page {i}")
        data = make_request_base(url, headers)
        combined_data += data

    current_utc_datetime = datetime.now(pytz.utc)
    for event in combined_data:
        event_id = event['id']

        # Add matches to events, only do this for events in the past
        event_start = datetime.fromisoformat(event['start'])
        if event_start <= current_utc_datetime:
            if 'divisions' in event:
                for division in event['divisions']:
                    division_id = division['id']
                    matches_data = get_matches(event_id, division_id)
                    division['matches'] = matches_data
            else:
                print(f"Divisions not present for Event id {event_id}") # Indicates something is wrong with the initial event data
        else:
            print(f"Event id {event_id} is in the future, skip checking matches")


        # Add teams to events, do this for all events
        event['teams'] = get_teams(event_id)

        # Add GSI partition key (used for sorting by start date)
        event['gsiPartitionKey'] = "ALL_EVENTS"

        # Post to DynamoDB. DynamoDB automatically updates the item if it already exists, otherwise will create a new entry
        response = put_item_in_dynamodb(event_data_table, event)
        if response:
            print(f"Event id {event_id} successfully posted to DynamoDB")
        else:
            print(f"Event id {event_id} failed to post to DynamoDB")

    print("Process finished")
    

if __name__ == "__main__":
    main()
    