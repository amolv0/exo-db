import boto3

# Initialize a session using AWS credentials
dynamodb = boto3.resource('dynamodb')

# Name of the existing table and the new table
old_table_name = 'event-data'
new_table_name = 'events'

# Reference to the new (existing) table
new_table = dynamodb.Table(new_table_name)

# Migrate data from old table to new table using batch operations
old_table = dynamodb.Table(old_table_name)

# Scan and migrate in batches
def migrate_data_in_batches():
    response = old_table.scan()
    items = response['Items']
    
    with new_table.batch_writer() as batch:
        for item in items:
            # Extract 'start' date and 'event-id'
            start_date = item.get('start')
            event_id = item.get('id')

            if start_date and event_id:
                # Convert event_id to integer if it's not already
                event_id = int(event_id) if isinstance(event_id, str) else event_id
                new_item = item
                new_item['event-id'] = event_id
                new_item['start'] = start_date
                batch.put_item(Item=new_item)

    while 'LastEvaluatedKey' in response:
        response = old_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items = response['Items']

        with new_table.batch_writer() as batch:
            for item in items:
                start_date = item.get('start')
                event_id = item.get('id')

                if start_date and event_id:
                    event_id = int(event_id) if isinstance(event_id, str) else event_id
                    new_item = item
                    new_item['event-id'] = event_id
                    new_item['start'] = start_date
                    batch.put_item(Item=new_item)

    print("Data migration complete.")

migrate_data_in_batches()
