import boto3
from boto3.dynamodb.conditions import Attr
import time

# Initialize a DynamoDB client
dynamodb = boto3.resource('dynamodb')


table_name = 'event-data'
table = dynamodb.Table(table_name)

# Function to update items in batches
def update_items():
    scan_kwargs = {
        'ProjectionExpression': '#id, #loc',
        'FilterExpression': 'attribute_exists(#loc.#region)',
        'ExpressionAttributeNames': {
            '#id': 'id',  
            '#loc': 'location',  # Mapping 'location' to '#loc' to avoid reserved keyword conflict
            '#region': 'region',  
        }
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
            count += 1
            print(f"Item ID {item['id']} updated successfully. {count} items updated")
            time.sleep(0.03)

        start_key = response.get('LastEvaluatedKey', None)
        done = start_key is None

# Function to update a single item
def update_item(item):
    item_id = item['id']
    if 'region' in item:
        print(f"{item_id} has already been processed, skipping")
        return
    # Determine the value for the new 'region' attribute
    # Default to None if neither 'region' nor 'country' are present
    region = None  
    if 'location' in item:
        if 'region' in item['location'] and item['location']['region']:
            region = item['location']['region']
        elif 'country' in item['location']:
            region = item['location']['country']

    # Proceed only if a valid region or country value is found
    if region is not None:


        # Update the item to add a new 'region' attribute
        update_response = table.update_item(
            Key={'id': item_id},
            UpdateExpression='SET #region = :val',
            ExpressionAttributeNames={
                '#region': 'region' 
            },
            ExpressionAttributeValues={
                ':val': region
            },
            ReturnValues="UPDATED_NEW"
        )
    else:
        print(f"Item ID {item_id} does not have a valid 'region' or 'country' in 'location', skipping")

# For testing on a single item
# item_id = 35176
# response = table.get_item(Key={'id': item_id})
# item = response.get('Item', None)
# update_item(item)

# Update all items in the table
update_items()
print("Process completed")