import boto3

# Initialize a boto3 client
dynamodb = boto3.resource('dynamodb')

table1_name = 'event-data1'
table2_name = 'event-data'

table1 = dynamodb.Table(table1_name)
table2 = dynamodb.Table(table2_name)

# FReplace items in Table 2 with items from Table 1 if "matches" attribute exists
def replace_if_matches_exists(item2):
    # Check if the "matches" attribute exists in the item
    if "matches" in item2:
        # Retrieve the corresponding item from Table 1 using the same partition key
        response = table1.get_item(Key={'id': item2['id']})
        item1 = response.get('Item')

        # If the item exists in Table 1, replace the item in Table 2 with it
        if item1:
            table2.put_item(Item=item1)
            print(f"Replaced item in Table 2 with ID: {item2['id']}")

count = 1
response = table2.scan()
print("Scanned page 1")
for item in response['Items']:
    replace_if_matches_exists(item)

# Handle pagination
while 'LastEvaluatedKey' in response:
    response = table2.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
    for item in response['Items']:
        replace_if_matches_exists(item)
    count += 1
    print(f"Scanned page {count}")

print("Replacement process completed.")
