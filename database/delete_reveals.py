import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('team-data')

def delete_reveals():
    count = 0
    exclusive_start_key = None
    reveals_count = 0
    while True:
        count += 1
        print(f"Scanning page {count}")
        if exclusive_start_key:
            response = table.scan(
                ProjectionExpression='id, reveals', 
                ExclusiveStartKey=exclusive_start_key
            )
        else:
            response = table.scan(ProjectionExpression='id')

        for item in response['Items']:
            if 'reveals' in item:
                item_id = item['id']
                table.update_item(
                    Key={'id': item_id},
                    UpdateExpression='REMOVE reveals',
                    ReturnValues='UPDATED_NEW'
                )
                reveals_count += 1
        if 'LastEvaluatedKey' in response:
            exclusive_start_key = response['LastEvaluatedKey']
        else:
            break

    print(f"Completed removing 'reveals' from all teams. Removed {reveals_count} reveals")
    # print(f"Found {reveals_count} reveals")
if __name__ == "__main__":
    delete_reveals()
