## This function is to get representation of the stream from event-data to be used in testing. 

import boto3
import json
from datetime import datetime

dynamodbstreams = boto3.client('dynamodbstreams')


stream_arn = 'arn:aws:dynamodb:us-east-1:228049799584:table/event-data/stream/2023-12-19T14:10:25.386'

# Describe the stream
stream_description = dynamodbstreams.describe_stream(StreamArn=stream_arn)
shards = stream_description['StreamDescription']['Shards']

# Prepare a list to hold all the stream records
all_records = []

class DateTimeEncoder(json.JSONEncoder):
    """ Custom encoder for datetime objects """
    def default(self, obj):
        if isinstance(obj, datetime):
            # Format datetime objects as strings
            return obj.isoformat()
        # Let the base class default method raise the TypeError
        return json.JSONEncoder.default(self, obj)

# Iterate over the shards in the stream
for shard in shards:
    shard_id = shard['ShardId']
    
    # Get a shard iterator for the current shard
    shard_iterator_response = dynamodbstreams.get_shard_iterator(
        StreamArn=stream_arn,
        ShardId=shard_id,
        ShardIteratorType='TRIM_HORIZON'  # or use 'LATEST', 'AT_SEQUENCE_NUMBER', 'AFTER_SEQUENCE_NUMBER'
    )

    shard_iterator = shard_iterator_response['ShardIterator']
    
    # Use the shard iterator to read stream records from the shard
    response = dynamodbstreams.get_records(ShardIterator=shard_iterator)
    
    # Add the records to the all_records list
    all_records.extend(response['Records'])
    
# Now, write the all_records list to a JSON file
with open('stream_data.json', 'w') as file:
    json.dump(all_records, file, cls=DateTimeEncoder, indent=4)

print(f"Saved {len(all_records)} records to stream_data.json")
