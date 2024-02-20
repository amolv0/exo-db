import boto3

# Initialize a DynamoDB client
dynamodb = boto3.resource('dynamodb')

# Specify your table name and partition key
table_name = 'event-data'
partition_key_name = 'id'
partition_key_value = 52043

table = dynamodb.Table(table_name)

def calculate_item_size(item):
    # DynamoDB item size calculation logic
    size = 0
    for key, value in item.items():
        size += len(key.encode('utf-8'))  # Size of the attribute name
        # Add size of the attribute value
        if isinstance(value, str):
            size += len(value.encode('utf-8'))
        elif isinstance(value, (int, float)):
            size += len(str(value).encode('utf-8'))
        elif isinstance(value, dict):  # For Map type attributes
            size += calculate_item_size(value)
        elif isinstance(value, list):  # For List type attributes
            size += sum(calculate_item_size({str(i): v}) for i, v in enumerate(value))
        # Add logic here for other data types as needed, such as Binary, Set, etc.
    return size

def get_item_size(table, partition_key_name, partition_key_value):
    # Fetch the item based on the partition key
    response = table.get_item(Key={partition_key_name: partition_key_value})
    item = response.get('Item')

    if not item:
        print(f"No item found with partition key {partition_key_value}")
        return None

    # Calculate the size of the fetched item
    item_size = calculate_item_size(item)
    return item_size

item_size = get_item_size(table, partition_key_name, partition_key_value)
if item_size is not None:
    print(f"Size of the item with partition key {partition_key_value}: {item_size} bytes")
