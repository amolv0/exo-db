import json
import requests
import time

API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiODU4MTYxMzQ1MmUyMjE2YjE5MWEwY2Q5NjVkMmE4YThkNWZkYjZhNjI4ZWEwNjM3YzMyNjM1OWVkMmRiZWU3ODdjMjBiNDcyMDhiM2ZkMjUiLCJpYXQiOjE3MDIxMDAyNDguNDA4MjA1LCJuYmYiOjE3MDIxMDAyNDguNDA4MjA3OSwiZXhwIjoyNjQ4ODcxNDQ4LjM5OTk1OTEsInN1YiI6IjkwODM3Iiwic2NvcGVzIjpbXX0.Tk_BPVkoN42aEdJDMH_tAOnhhVZZiZ93VJVxELdwEw3npoJFWoqPKYgCPrPOt4X5YvyOQn82-UBJCUmXbPEJSGWK6gERFKLygi48afODQc-c9s5GnWJKT2Z5OQ608RJm9ZgDzzr7jk6nVJm-6gI9UJ4AUwFxlBTY4D6_uATPJNycD4EqJ7Wu9_jOBhW2Oek84fU9XzYrodTRpfwSmr5-g4mblM_1_r_hxrtIG4y22Gjt-qbRnAaIAnhehF5Z-9K82CQ7x95gLQXC1tzs-AWtv3upLjBqVM_mDiERlztNE08qJZ7o8etRJU9j5m1xFHPk9MF7vrNh2QdkL7JTYkNBoOEB-z-LfF4SJ2vlftFMvhiyxxnQ0YYmzjyBD5utjm5Tn-oZZ3umDmxQuc08yy2K_t21Pf8bTgMLKDs8RUdC6hxLgmNOy7fa1w2lYU7-NhjiZATNNqJ9WTTBoJxUqux290jXtPC2zzJcqFniV5DA4vdYWcFCHQAglPAUe3W5FfiLJ4CVZ4Sd6Kfb7euKVAG7DvuVxF7BwCQspBI8O31L9F0dKp2t-W9YBB0xjRbrQOnVOSPuTQdc1O4-R1OLz7Vr1BzKsNBBwSzt8ejqed3rpnpdrbm-rUJBj3UD7UGJgAYDeFIgNuB1i5MWd5dzfcQMXGQ_a8WGOCKGbXeLZC7WOoU'

def read_json(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

def make_request(url, headers, retries=5, initial_delay=5):
    for attempt in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            print(f"Remaining Limit: {response.headers.get('x-ratelimit-remaining')}. ", end='')
            time.sleep(1)
            return response.json().get('data', [])
        elif response.status_code == 429:
            remaining_limit = int(response.headers.get('x-ratelimit-remaining', 0))
            print(f"Rate limit exceeded. Remaining limit: {remaining_limit}. ", end='')

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

def fetch_matches_for_team(team_id):
    matches = []
    page = 1
    while True:
        api_url = f"https://www.robotevents.com/api/v2/teams/{team_id}/matches?page={page}&per_page=250"
        response = make_request(api_url, headers={'Authorization': f'Bearer {API_KEY}'})
        if response:
            matches.extend(response['data'])
            if page >= response['meta']['last_page']:
                break
            page += 1
        else:
            break
    return matches

def update_team_data(team_data, matches):
    for match in matches:
        event_id = match['event']['id']
        if event_id in team_data['events-attended']:
            if 'matches' not in team_data['events-attended'][event_id]:
                team_data['events-attended'][event_id]['matches'] = {}
            match_id = match['id']
            team_data['events-attended'][event_id]['matches'][str(match_id)] = match

def main(json_path):
    data = read_json(json_path)
    for team in data:
        team_id = team['team-id']
        matches = fetch_matches_for_team(team_id)
        update_team_data(team, matches)
    
    with open(json_path, 'w') as file:
        json.dump(data, file, indent=4)

if __name__ == "__main__":
    json_path = 'data/team_data.json'
    main(json_path)
