import boto3
from boto3.dynamodb.conditions import Attr

# Initialize a DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = 'event-data'  # Replace with your table name
table = dynamodb.Table(table_name)

# Function to update each item with gsiPartitionKey
def update_item(item):
    response = table.update_item(
        Key={
            'id': item['id']
        },
        UpdateExpression='SET gsiPartitionKey = :val',
        ExpressionAttributeValues={
            ':val': 'ALL_EVENTS'
        }
    )
    return response

# Scan the table and update each item
def add_gsi_partition_key_to_items():
    # Scan the table
    response = table.scan(
        FilterExpression=Attr('gsiPartitionKey').not_exists()  # Filter items without gsiPartitionKey
    )
    items = response.get('Items', [])

    # Update each item
    for item in items:
        update_response = update_item(item)
        print(f"Updated item: {item['id']}, response: {update_response}")

    print(f"Total items updated: {len(items)}")

# Run the update function
add_gsi_partition_key_to_items()
