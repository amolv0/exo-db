import boto3
from boto3.dynamodb.conditions import Attr
import time

# Initialize a DynamoDB client
dynamodb = boto3.resource('dynamodb')

# Specify your table name
table_name = 'team-data'
table = dynamodb.Table(table_name)

# Function to update items in batches
def update_items():
    # Start the scan operation
    scan_kwargs = {
        'ProjectionExpression': 'id, program',
        'FilterExpression': Attr('program').exists()
    }
    done = False
    start_key = None
    count = 0
    while not done:
        if start_key:
            scan_kwargs['ExclusiveStartKey'] = start_key
        response = table.scan(**scan_kwargs)
        items = response.get('Items', [])

        for item in items:
            update_item(item)
            print(f"Item ID {item['id']} updated successfully. {count} items updated")
            count += 1
            time.sleep(0.05)

        start_key = response.get('LastEvaluatedKey', None)
        done = start_key is None

# Function to update a single item
def update_item(item):
    item_id = item['id']
    if 'code' not in item['program']:
        return # already updated
    program_code = item['program']['code']

    # Update the 'program' attribute to just a string
    update_response = table.update_item(
        Key={'id': item_id},
        UpdateExpression='SET program = :val',
        ExpressionAttributeValues={
            ':val': program_code
        },
        ReturnValues="UPDATED_NEW"
    )

    

# item = table.get_item(Key={'id': 5226}).get('Item', None)
# update_item(item)

# Update all items in the table
update_items()
print("Process completed")