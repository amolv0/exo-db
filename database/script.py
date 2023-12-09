# API KEY: REDACTED_API_KEY

import requests
import json

baseUrl = 'https://www.robotevents.com/api/v2/events?region=Washington&myEvents=false&page=1&per_page=1000'
headers = {
    'accept': 'application/json',
    'Authorization': 'Bearer REDACTED_API_KEY'
}
combined_data = []
for i in range(1, 4):
    url = f'https://www.robotevents.com/api/v2/events?region=Washington&myEvents=false&page={i}&per_page=1000'
    print(i)
    response = requests.get(url, headers=headers)
    # Check if the request was successful (status code 200)
    if response.status_code == 200:
        combined_data += response.json().get('data', [])
            
        print('JSON page added')
    else:
        print(f'Request failed with status code: {response.status_code}')

combined_json = {"data": combined_data}
with open('data/washington.json', 'w') as json_file:
    json.dump(combined_json, json_file, indent=4)
    print("JSON combined")