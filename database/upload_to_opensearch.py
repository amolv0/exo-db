import boto3
import json
import requests
from requests_aws4auth import AWS4Auth
from boto3.dynamodb.types import TypeDeserializer
from decimal import Decimal

# AWS Configuration
region = 'us-east-1'
service = 'es'
dynamodb_table_name = 'team-data'
index_name = 'team-data'
opensearch_endpoint = 'OPENSEARCH_API_ENDPOINT'  # Replace with your OpenSearch endpoint

# Initialize AWS services
dynamodb = boto3.client('dynamodb', region_name=region)
credentials = boto3.Session().get_credentials()
awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, region, service, session_token=credentials.token)
# Function to deserialize DynamoDB items to Python dictionary
deserializer = TypeDeserializer()
def deserialize_dynamodb_item(item):
    return {k: deserializer.deserialize(v) for k, v in item.items()}

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

# Function to convert Decimal to float (or int, based on the value)
def decimal_to_number(value):
    if isinstance(value, Decimal):
        # Convert to int if the Decimal is an integer, float otherwise
        return int(value) if value % 1 == 0 else float(value)
    return value

# Function to scan DynamoDB table and yield items
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

def extract_relevant_attributes(item):
    return {
        'id': decimal_to_number(item.get('id')), 
        'number': decimal_to_number(item.get('number')), 
        'team_name': item.get('team_name'),
        'program': item.get('program')
    }

# Function to bulk upload data to OpenSearch
def bulk_upload_to_opensearch(data):
    global count
    bulk_data = ''
    for record in data:
        # Prepare document with only relevant attributes
        doc = extract_relevant_attributes(record)
        # Add action and metadata JSON without the '_type' field
        bulk_data += json.dumps({"index": {"_index": "team-data"}}) + '\n'  # Removed "_type" field
        # Add the actual document
        bulk_data += json.dumps(doc) + '\n'

    headers = {"Content-Type": "application/json"}
    response = requests.post(f'{opensearch_endpoint}/_bulk', auth=awsauth, data=bulk_data, headers=headers, timeout=60)
    if response.status_code == 200:
        print(f"Bulk upload successful. {count} uploads complete")
    else:
        print(f"Error during bulk upload: {response.text}")

# Main script execution
if __name__ == '__main__':
    print("Starting process, deleting current index data")
    delete_index()
    count = 0
    data_to_upload = []
    appeneded = 0
    for item in scan_dynamodb_table(dynamodb_table_name):
        appeneded += 1
        data_to_upload.append(item)
        # print(f"Appeneded {appeneded} item.")
        # Bulk upload in batches of 100 documents (adjust batch size as needed)
        if len(data_to_upload) >= 100:
            bulk_upload_to_opensearch(data_to_upload)
            count += 1
            data_to_upload = []  # Reset batch list after uploading
            appeneded = 0

    # Upload any remaining documents
    if data_to_upload:
        bulk_upload_to_opensearch(data_to_upload)
    print("Process finished")