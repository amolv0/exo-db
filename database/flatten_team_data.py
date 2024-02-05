import boto3

# Initialize a DynamoDB resource
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('team-data')

def get_all_items():
    response = table.scan()
    items = response['Items']
    count = 0
    # Handle pagination if the dataset is large
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items.extend(response['Items'])
        count += 1
        print(f"Scanning page {count}")

    return items

def update_item_matches(item):
    match_objects = item.get('matches', [])
    match_ids = []
    if not isinstance(match_objects, list):
        return
    for match in match_objects:
        if not isinstance(match, dict):
            return
        if 'id' not in match:
            continue
        match_ids.append(match['id'])
    # match_ids = [match['id'] for match in match_objects]

    # Update the 'matches' attribute of the item
    if len(match_ids) > 0 and not None:
        print(f"updated team id: {item['id']}")
        table.update_item(
            Key={'id': item['id']},  # Assuming 'id' is the partition key
            UpdateExpression='SET matches = :val',
            ExpressionAttributeValues={
                ':val': [match_id for match_id in match_ids]
            }
        )

def main():
    print("getting items")
    items = get_all_items()
    for item in items:
        update_item_matches(item)

if __name__ == '__main__':
    main()