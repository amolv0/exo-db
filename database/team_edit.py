import json
import requests
import time

API_KEY = 'REDACTED_API_KEY'
API_KEY_2 = 'REDACTED_API_KEY'
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
