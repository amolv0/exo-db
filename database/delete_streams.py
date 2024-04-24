import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('event-data')

def delete_streams():
    count = 0
    reveals_count = 0
    exclusive_start_key = None

    while True:
        count += 1
        print(f"Scanning page {count}")
        if exclusive_start_key:
            response = table.scan(
                ProjectionExpression='id', 
                ExclusiveStartKey=exclusive_start_key
            )
        else:
            response = table.scan(ProjectionExpression='id')

        for item in response['Items']:
            item_id = item['id']
            # table.update_item(
            #     Key={'id': item_id},
            #     UpdateExpression='REMOVE streams',
            #     ReturnValues='UPDATED_NEW'
            # )
            reveals_count += 1
        if 'LastEvaluatedKey' in response:
            exclusive_start_key = response['LastEvaluatedKey']
        else:
            break

    # print("Completed removing 'streams' from all events.")
    print(f"Found {reveals_count} reveals")

if __name__ == "__main__":
    delete_streams()
