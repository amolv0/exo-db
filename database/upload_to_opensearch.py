import boto3
import json
import requests
import os
from requests_aws4auth import AWS4Auth
from boto3.dynamodb.types import TypeDeserializer
from decimal import Decimal


region = 'us-east-1'
service = 'es'
opensearch_endpoint = os.getenv('OPENSEARCH_API_ENDPOINT')
index_name = 'search-index' 


dynamodb = boto3.client('dynamodb', region_name=region)
credentials = boto3.Session().get_credentials()
awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, region, service, session_token=credentials.token)

deserializer = TypeDeserializer()

def deserialize_dynamodb_item(item):
    return {k: deserializer.deserialize(v) for k, v in item.items()}

def decimal_to_number(value):
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    return value

def delete_index():
    try:
        response = requests.delete(f'{opensearch_endpoint}/{index_name}', auth=awsauth)
        if response.status_code == 200:  # 200 OK or 404 NOT FOUND are both acceptable responses
            print(f"Index '{index_name}' deleted successfully")
        elif response.status_code == 400:
            print(f"Index '{index_name}' did not exist")
        else:
            response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Failed to delete index: {e}")


def scan_dynamodb_table(table_name):
    count = 1
    response = dynamodb.scan(TableName=table_name)
    print(f"Scanned page {count}")
    items = response.get('Items', [])
    for item in items:
        yield deserialize_dynamodb_item(item)

    while 'LastEvaluatedKey' in response:
        response = dynamodb.scan(TableName=table_name, ExclusiveStartKey=response['LastEvaluatedKey'])
        items = response.get('Items', [])
        count += 1
        print(f"Scanned page {count}")
        for item in items:
            yield deserialize_dynamodb_item(item)

def create_index_with_combined_mapping():
    # Create a combined mapping that includes mappings for both 'event-data' and 'team-data'
    mapping = {
        "mappings": {
            "properties": {
                "program": {"type": "keyword"},
                # Add specific fields for 'event-data'
                "event_id": {"type": "keyword", "index": True},
                "event_name": {"type": "text"},
                "event_start": {"type": "date", "format": "date_optional_time"},
                # Add specific fields for 'team-data'
                "team_id": {"type": "keyword", "index": True},
                "team_number": {"type": "text"},
                "team_name": {"type": "text"},
                "team_registered": {"type": "boolean"}
            }
        }
    }
    try:
        response = requests.put(f'{opensearch_endpoint}/{index_name}', auth=awsauth, json=mapping)
        if response.status_code == 200:
            print(f"Index '{index_name}' created with custom mapping successfully")
        else:
            response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Failed to create index with mapping: {e}")

def extract_relevant_attributes(item, source_table):
    common_data = {
        'program': item.get('program')
        # Extract common fields here
    }
    if source_table == 'event-data':
        # Extract specific fields for 'event-data'
        common_data.update({
            'event_id': decimal_to_number(item.get('id')),
            'event_name': item.get('name'),
            'event_start': item.get('start')

        })
    elif source_table == 'team-data':
        registered = item.get('registered')
        registered_bool = False  # Default value if 'registered' is missing
        if registered is not None:
            registered_bool = registered.lower() == 'true'

        # Extract specific fields for 'team-data'
        common_data.update({
            'team_id': decimal_to_number(item.get('id')),
            'team_number': decimal_to_number(item.get('number')),
            'team_name': item.get('team_name'),
            'team_registered': registered_bool
        })
    return common_data

# Function to bulk upload pre-processed data to OpenSearch
def bulk_upload_to_opensearch(data):
    global count
    bulk_data = ''
    for doc in data: 
        bulk_data += json.dumps({"index": {"_index": "search-index"}}) + '\n'
        bulk_data += json.dumps(doc) + '\n'

    headers = {"Content-Type": "application/json"}
    response = requests.post(f'{opensearch_endpoint}/_bulk', auth=awsauth, data=bulk_data, headers=headers, timeout=60)
    if response.status_code == 200:
        print(f"Bulk upload successful. {count} uploads complete")
    else:
        print(f"Error during bulk upload: {response.text}")


if __name__ == '__main__':
    print("Starting process, deleting current index data")
    delete_index()  # Delete existing index if necessary
    create_index_with_combined_mapping()  # Create a new index with combined mapping
    
    # Initialize variables for bulk upload
    count = 0
    data_to_upload = []

    # Process 'event-data' table
    print("Uploading data from 'event-data' table")
    for item in scan_dynamodb_table('event-data'):
        data_to_upload.append(extract_relevant_attributes(item, 'event-data'))
        if len(data_to_upload) >= 100:  # Bulk upload in batches of 100 
            bulk_upload_to_opensearch(data_to_upload)
            count += 1 
            data_to_upload = []

 
    if data_to_upload:
        bulk_upload_to_opensearch(data_to_upload)
        count += 1 
        data_to_upload = [] 

    # Process 'team-data' table
    print("Uploading data from 'team-data' table")
    for item in scan_dynamodb_table('team-data'):
        data_to_upload.append(extract_relevant_attributes(item, 'team-data'))
        if len(data_to_upload) >= 100: 
            bulk_upload_to_opensearch(data_to_upload)
            count += 1 
            data_to_upload = []


    if data_to_upload:
        bulk_upload_to_opensearch(data_to_upload)
        count += 1

    print(f"Process finished. Total bulk uploads completed: {count}")
