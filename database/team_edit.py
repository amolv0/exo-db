import json
import requests
import time

API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiODU4MTYxMzQ1MmUyMjE2YjE5MWEwY2Q5NjVkMmE4YThkNWZkYjZhNjI4ZWEwNjM3YzMyNjM1OWVkMmRiZWU3ODdjMjBiNDcyMDhiM2ZkMjUiLCJpYXQiOjE3MDIxMDAyNDguNDA4MjA1LCJuYmYiOjE3MDIxMDAyNDguNDA4MjA3OSwiZXhwIjoyNjQ4ODcxNDQ4LjM5OTk1OTEsInN1YiI6IjkwODM3Iiwic2NvcGVzIjpbXX0.Tk_BPVkoN42aEdJDMH_tAOnhhVZZiZ93VJVxELdwEw3npoJFWoqPKYgCPrPOt4X5YvyOQn82-UBJCUmXbPEJSGWK6gERFKLygi48afODQc-c9s5GnWJKT2Z5OQ608RJm9ZgDzzr7jk6nVJm-6gI9UJ4AUwFxlBTY4D6_uATPJNycD4EqJ7Wu9_jOBhW2Oek84fU9XzYrodTRpfwSmr5-g4mblM_1_r_hxrtIG4y22Gjt-qbRnAaIAnhehF5Z-9K82CQ7x95gLQXC1tzs-AWtv3upLjBqVM_mDiERlztNE08qJZ7o8etRJU9j5m1xFHPk9MF7vrNh2QdkL7JTYkNBoOEB-z-LfF4SJ2vlftFMvhiyxxnQ0YYmzjyBD5utjm5Tn-oZZ3umDmxQuc08yy2K_t21Pf8bTgMLKDs8RUdC6hxLgmNOy7fa1w2lYU7-NhjiZATNNqJ9WTTBoJxUqux290jXtPC2zzJcqFniV5DA4vdYWcFCHQAglPAUe3W5FfiLJ4CVZ4Sd6Kfb7euKVAG7DvuVxF7BwCQspBI8O31L9F0dKp2t-W9YBB0xjRbrQOnVOSPuTQdc1O4-R1OLz7Vr1BzKsNBBwSzt8ejqed3rpnpdrbm-rUJBj3UD7UGJgAYDeFIgNuB1i5MWd5dzfcQMXGQ_a8WGOCKGbXeLZC7WOoU'
API_KEY_2 = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiZjBkNGE3YjYwYjU5ZGY2MjFlYTk1MjZkZDUzMDg5NTA1ZDRjYTM4ZGM3YjJkYjhlNzdhMDY4NGNiNWE4YjVmZDE0MDYyZDA1ZjlmZDM0NTQiLCJpYXQiOjE3MDIyNzQ0MjcuNzE1MDI1OSwibmJmIjoxNzAyMjc0NDI3LjcxNTAzLCJleHAiOjI2NDkwNDU2MjcuNzA2MjQyMSwic3ViIjoiOTA4MzciLCJzY29wZXMiOltdfQ.moxph7N_eE2AlY26W5hY4N3DCbL_AfI1NKC2J1fgLTzzXaUl_k1bCdlnr7ONJrZ6G3TdzcG6qZvTcTtxB1MqMaUOXY3nZYRiHX-3Y0IR2usvMxQQuuH0l91BYdBsc64XctX0CtRYPrikgEACpSLsWedk-pEBXdC7b4_LUut_Ahi65cJnkbB5bvViFZaYbd4zUkMV2uHU7yKwzT93ty1WFH-PwBXv1KKuxgfO5__NwJNTX5sVBQZm6rdgxvkWdkY1t2_QHHoxHgzDxRDhy8kdMiXzpJBQXoKLK6oFydc8jwdcWeLuljTquiHGtiAHxbpwRSysl9H7-omM6YTPOb3gu7EhyEFCKCtXhVVi1r9Z8Y-piVxAvTiG2zjRzRpc3RyRpMnEnXqplSFbCc-LzCFBmZJU--bThZJI-kRRNsguGmKJ7VwAWyvJy2bk2jfRY55mQlw0wpRM3-cCzLyi9PKKNPWG7PbNs_zWplYh1R6eVtLMbmooCEsS4dkNTuGteIUX1HtoYrm65v1iHWLD6BtlYWVYV68GBe1N8OQc27YgIV63EMAw_eaMvbSbFLN_zEoBXRcAAK9khKqF7DtB_ezBEDf51hCJyuJaEm8A_YrUaLpY07xFIKJaB7QsnI_EMphqvoKpt2n_VmPsLNWev1fu511ujvedbcC35wGKJdOztQE'
json_path = 'data/team_data.json'


def make_request(url, headers, retries=5, initial_delay=5):
    for attempt in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            
            print(f"Remaining Limit: {response.headers.get('x-ratelimit-remaining')}. ", end = '')
            time.sleep(1)
            return response.json().get('data', [])
        elif response.status_code == 429:
            remaining_limit = int(response.headers.get('x-ratelimit-remaining', 0))
            print(f"Rate limit exceeded. Remaining limit: {remaining_limit}. ", end = '')

            if remaining_limit == 0:
                print(f"No remaining limit, attempt: {attempt+1}. Retrying after delay of {initial_delay}...")
                time.sleep(initial_delay)
                initial_delay *= 2
            else:
                print(f"Retrying in {initial_delay} seconds...")
                time.sleep(initial_delay)
        else:
            print(f"Request failed with status code: {response.status_code}")
            break

    return []


def get_events_data(team_id, count):
    page = 1
    all_events_data = []
    while True:
        # Make an API call to get events data for a specific team id and page
        api_url = f"https://www.robotevents.com/api/v2/teams/{team_id}/events?page={page}"
        events_data = make_request(api_url, headers={'Authorization': f'Bearer {API_KEY}'})

        if events_data:
            all_events_data.extend(events_data)

            # Check if there are more pages
            if isinstance(events_data, list) and events_data:
                last_page = events_data[0].get('meta', {}).get('last_page', 0)
                if page >= last_page:
                    print(f"Fetched data for team {team_id}, team count: {count}")
                    break
                else:
                    page += 1
            else:
                # Handle case where 'meta' or 'last_page' is not present in the response
                break
            
        else:
            # Handle API error or empty response
            print(f"Error fetching data for team {team_id}")
            break

    return all_events_data

def iterate_and_update(file_path):
    count = 0
    # Read the JSON data from the file
    with open(file_path, 'r') as file:
        json_data = json.load(file)

    # Iterate through the 'data' field in the JSON
    for entry in json_data.get('data', []):
        team_id = entry.get('id')
        
        # Skip if team_id is not available
        if team_id is None:
            continue

        # Make API call to get events data
        count += 1
        events_data = get_events_data(team_id, count)

        # Add the 'events' field to the current entry
        entry['events'] = events_data

    # Save the updated JSON data back to the file
    with open(file_path, 'w') as file:
        json.dump(json_data, file, indent=2)

if __name__ == "__main__":
    # Call the function to iterate and update the JSON data
    iterate_and_update(json_path)
