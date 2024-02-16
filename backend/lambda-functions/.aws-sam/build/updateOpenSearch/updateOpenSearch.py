import boto3
import requests
import logging
from requests_aws4auth import AWS4Auth
from boto3.dynamodb.types import TypeDeserializer

# Initialize AWS services
region = 'us-east-1'
service = 'es'
opensearch_endpoint = 'https://search-team-data-search-xaeptdqqk2djjjmer2bq63eetq.us-east-1.es.amazonaws.com'
index_name = 'search-index'

credentials = boto3.Session().get_credentials()
awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, region, service, session_token=credentials.token)

# Deserializer for DynamoDB items
deserializer = TypeDeserializer()

logging = logging.getLogger()
logging.setLevel("INFO")

def deserialize_dynamodb_item(item):
    return {k: deserializer.deserialize(v) for k, v in item.items()}

# Define relevant attributes for each source table
relevant_attributes = {
    'event-data': ['program', 'name', 'start'],  # 'name' and 'start' in DynamoDB for 'event-data'
    'team-data': ['program', 'number', 'team_name', 'registered']  # 'number' and 'registered' in DynamoDB for 'team-data'
}


def determine_table(record):
    arn = record['eventSourceARN']
    return arn.split(':')[5].split('/')[1]

def find_document_id_in_opensearch(item, source_table):
    field_name = 'event_id' if source_table == 'event-data' else 'team_id'
    search_value = item.get('id')
    if not search_value:
        return None
    query = {"query": {"match": {field_name: search_value}}}
    search_url = f"{opensearch_endpoint}/_search"
    response = requests.get(search_url, auth=awsauth, json=query)
    if response.status_code == 200:
        search_results = response.json()
        logging.info(f"Response: {search_results}")
        hits = search_results.get('hits', {}).get('hits', [])
        if hits:
            logging.info(f"Finding document id successful: {hits[0].get('_id')}")
            return hits[0].get('_id')
    else:
        logging.info(f"Error in getting document id response code: {response.status_code}")
    return None

def update_document_in_opensearch(updates, document_id, source_table):
    # Rename attributes to match OpenSearch document format
    if source_table == 'event-data':
        if 'name' in updates: updates['event_name'] = updates.pop('name')
        if 'start' in updates: updates['event_start'] = updates.pop('start')
    elif source_table == 'team-data':
        if 'number' in updates: updates['team_number'] = updates.pop('number')
        if 'registered' in updates: updates['team_registered'] = updates.pop('registered')
    
    update_url = f"{opensearch_endpoint}/{index_name}/_update/{document_id}"
    payload = {"doc": updates}
    response = requests.post(update_url, auth=awsauth, json=payload)
    if response.status_code in [200, 201]:
        logging.info(f"Document with ID {document_id} updated successfully")
    else:
        logging.info(f"Error updating document with ID {document_id}: {response.text}")

def delete_document_from_opensearch(document_id):
    delete_url = f"{opensearch_endpoint}/{index_name}/_doc/{document_id}"
    response = requests.delete(delete_url, auth=awsauth)
    if response.status_code == 200:
        print(f"Document with ID {document_id} deleted successfully")
    else:
        print(f"Error deleting document with ID {document_id}: {response.text}")


def handler(event, context):
    logging.info("Starting process")
    for record in event['Records']:
        source_table = determine_table(record)
        relevant_updates = {}

        if record['eventName'] in ('INSERT', 'MODIFY'):
            new_image = deserialize_dynamodb_item(record['dynamodb'].get('NewImage', {}))
            old_image = deserialize_dynamodb_item(record['dynamodb'].get('OldImage', {}))
            
            for attr in relevant_attributes.get(source_table, []):
                dynamo_attr = attr  # Attribute name as it is in DynamoDB
                if new_image.get(dynamo_attr) != old_image.get(dynamo_attr):
                    relevant_updates[dynamo_attr] = new_image.get(dynamo_attr)
                    logging.info(f"Relevant attribute changed: {dynamo_attr}")
            
            if relevant_updates:
                document_id = find_document_id_in_opensearch(new_image, source_table)
                if document_id:
                    update_document_in_opensearch(relevant_updates, document_id, source_table)
        elif record['eventName'] == 'REMOVE':
            old_image = deserialize_dynamodb_item(record['dynamodb'].get('OldImage', {}))
            document_id = find_document_id_in_opensearch(old_image, source_table)
            if document_id:
                delete_document_from_opensearch(document_id)
    logging.info("Process complete")