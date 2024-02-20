import boto3

# Initialize a DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('event-data')

def fix_matches_structure(event_id=None):
    # Variables to keep track of operations
    count = 0
    page = 0
    if event_id:
        # Query for a specific event ID
        response = table.query(
            KeyConditionExpression='id = :event_id',
            ExpressionAttributeValues={':event_id': event_id},
            ProjectionExpression='#div',
            ExpressionAttributeNames={'#div': 'divisions'}
        )

        items = response.get('Items', [])
        for item in items:
            if 'divisions' in item:
                for division in item['divisions']:
                    if 'matches' in division and isinstance(division['matches'], dict) and 'L' in division['matches']:
                        # Fix the structure here
                        fixed_matches = []
                        for match in division['matches']['L']:
                            fixed_matches.append(match)
                        print(fixed_matches)
                        division['matches'] = fixed_matches
                        print(f"Fixed matches structure for division in event {event_id}")

                        # Update the item in the database
                        update_response = table.update_item(
                            Key={'id': event_id},
                            UpdateExpression='SET divisions = :divisions',
                            ExpressionAttributeValues={':divisions': item['divisions']},
                            ReturnValues='UPDATED_NEW'
                        )

    else:
        # Use scan for processing all events if no specific event ID is provided
        scan_kwargs = {
            'ProjectionExpression': '#div, eventId',
            'ExpressionAttributeNames': {
                '#div': 'divisions',
            }
        }

        done = False
        start_key = None
        pages_scanned = 0

        scan_kwargs = {}
        while True:
            page += 1
            print(f"Scanning page {page}")
            response = table.scan(**scan_kwargs)
            for item in response.get('Items', []):
                count += 1
                eventId = item['id']
                # print(f"Processed event {eventId}, {count} events processed")
                if 'divisions' in item:
                    for division in item['divisions']:
                        if 'matches' in division and isinstance(division['matches'], dict) and 'L' in division['matches']:
                            # Fix the structure here
                            fixed_matches = []
                            for match in division['matches']['L']:
                                fixed_matches.append(match)
                            division['matches'] = fixed_matches
                            print(f"Fixed matches structure for division in event {eventId}")

                            # Update the item in the database
                            update_response = table.update_item(
                                Key={'id': eventId},
                                UpdateExpression='SET divisions = :divisions',
                                ExpressionAttributeValues={':divisions': item['divisions']},
                                ReturnValues='UPDATED_NEW'
                            )

            if 'LastEvaluatedKey' in response:
                scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
            else:
                break  # No more items to fetch, exit the loop

        if not event_id:
            print(f"Scanned {pages_scanned} pages.")


# Call the function with an event ID for testing, or without arguments to process all events
# fix_matches_structure('specific-event-id')  # For testing with a specific event
print("Starting process")
fix_matches_structure()  # For processing all events
print("Finished process")
