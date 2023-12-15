import boto3

# Initialize the DynamoDB client
dynamodb = boto3.client('dynamodb', region_name='us-east-1')

# Specify your DynamoDB table name
table_name = 'event-data'

# Define a function to update the boolean values in the table
def update_ongoing_values():
    # Use a scan operation to retrieve all items in the table
    response = dynamodb.scan(TableName=table_name)
    
    # Iterate through the items and update the 'ongoing' attribute
    for item in response['Items']:
        # Check if 'ongoing' attribute exists in the item
        if 'ongoing' in item:
            # Check if 'ongoing' attribute is a Boolean
            if 'BOOL' in item['ongoing']:
                # Get the current Boolean value
                ongoing_boolean = item['ongoing']['BOOL']
                
                # Convert the Boolean value to its string representation
                ongoing_string = str(ongoing_boolean).lower()
                
                # Update the item in the table with the string value
                dynamodb.update_item(
                    TableName=table_name,
                    Key={'id': item['id']},
                    UpdateExpression='SET ongoing = :value',
                    ExpressionAttributeValues={':value': {'S': ongoing_string}}
                )
                print(f"Updated item with partition key {item['id']} to 'ongoing': '{ongoing_string}'")
            else:
                # 'ongoing' attribute is already a string, continue
                print(f"'ongoing' attribute for item with partition key {item['id']} is already a string: '{item['ongoing']['S']}'")

# Call the function to update the values
update_ongoing_values()
