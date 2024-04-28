import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('event-data')

def delete_streams():
    page_count = 0
    streams_count = 0
    exclusive_start_key = None

    while True:
        page_count += 1
        print(f"Scanning page {page_count}")
        if exclusive_start_key:
            response = table.scan(
                ProjectionExpression='id, streams', 
                ExclusiveStartKey=exclusive_start_key
            )
        else:
            response = table.scan(ProjectionExpression='id, streams')

        for item in response['Items']:
            if 'streams' in item:
                item_id = item['id']
                table.update_item(
                    Key={'id': item_id},
                    UpdateExpression='REMOVE streams',
                    ReturnValues='UPDATED_NEW'
                )
                streams_count += 1
        if 'LastEvaluatedKey' in response:
            exclusive_start_key = response['LastEvaluatedKey']
        else:
            break

    print(f"Completed removing 'streams' from all events. Removed {streams_count} streams.")
    # print(f"Found {streams_count} reveals")

if __name__ == "__main__":
    delete_streams()
