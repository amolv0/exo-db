import json
import requests
import time

API_KEY = 'REDACTED_API_KEY'
API_KEY_2 = 'REDACTED_API_KEY'
json_path = 'data/team_data.json'

baseUrl = 'https://www.robotevents.com/api/v2/teams?myTeams=false&page=1&per_page=250'  #washington had ~2600 events recorded
headers = {
    'accept': 'application/json',
    'Authorization': f'Bearer {API_KEY}'
}
combined_data = []

def make_request(url, headers, retries=5, delay=10):
    for _ in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json().get('data', [])
        elif response.status_code == 429:
            print(f"Rate limit exceeded. Retrying in {delay} seconds...")
            time.sleep(delay)
        else:
            print(f"Request failed with status code: {response.status_code}")
            break

    return []


for i in range(1, 413):
    url = f'https://www.robotevents.com/api/v2/teams?myTeams=false&page={i}&per_page=250' #250 is the max to show per page, to get all must go to page 413
    print(i)
    data = make_request(url, headers)

    combined_data += data

combined_json = {"data": combined_data}
with open(json_path, 'w') as json_file:
    json.dump(combined_json, json_file, indent=4)
    print("JSON combined")