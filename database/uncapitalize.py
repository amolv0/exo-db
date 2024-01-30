import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('event-data')

def update_items():
    response = table.scan()
    items = response['Items']
    count = 1

    while True:
        for item in items:
            ongoing = item.get('ongoing', '')
            if ongoing and ongoing != ongoing.lower():
                table.update_item(
                    Key={'id': item['id']},
                    UpdateExpression='SET ongoing = :val',
                    ExpressionAttributeValues={':val': ongoing.lower()}
                )

        # Handle pagination
        if 'LastEvaluatedKey' not in response:
            break
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items = response['Items']
        print(f"Updated page {count}")
        count += 1

update_items()