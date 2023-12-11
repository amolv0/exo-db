import json
from decimal import Decimal
import boto3
from botocore.exceptions import NoCredentialsError

# Replace 'your-access-key-id' and 'your-secret-access-key' with your AWS access key ID and secret access key
aws_access_key_id = 'REDACTED_API_KEY'
aws_secret_access_key = 'REDACTED_API_KEY'
aws_region = 'us-east-1'
table_name = 'event-data'

# Create a DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name=aws_region, aws_access_key_id=aws_access_key_id, aws_secret_access_key=aws_secret_access_key)

table = dynamodb.Table(table_name)

json_file_path = 'data/all_events.json'

with open(json_file_path, 'r') as json_file:
    item_data = json.load(json_file)

# 'data' is a list of items
data_list = item_data.get('data', [])

# Function to recursively convert float values to Decimal
def convert_float_to_decimal(obj):
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {key: convert_float_to_decimal(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_float_to_decimal(element) for element in obj]
    else:
        return obj

for item in data_list:
    # Convert float values to Decimal
    item = convert_float_to_decimal(item)

    try:
        # Put each item into DynamoDB
        response = table.put_item(Item=item)
        print("PutItem succeeded:", response)
    except NoCredentialsError:
        print("Credentials not available")
