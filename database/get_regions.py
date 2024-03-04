import boto3

dynamodb = boto3.client('dynamodb')

table_name = 'event-data'

def unique_regions_first_page():
    unique_regions = set()

    response = dynamodb.scan(
        TableName=table_name,
        ProjectionExpression="#r",
        ExpressionAttributeNames={"#r": "region"},  
    )


    for item in response['Items']:
        region = item['region']['S']
        print(region)
        unique_regions.add(region)


    with open('./logs/regions.log', 'w') as file:
        for region in unique_regions:
            file.write(f"{region}\n")

    print(f"Logged unique regions from the first page to /mnt/data/regions_first_page.log")

def unique_regions_all_pages():
    unique_regions = set()

    scan_kwargs = {
        'TableName': table_name,
        'ProjectionExpression': "#r",
        'ExpressionAttributeNames': {"#r": "region"}, 
    }

    done = False
    start_key = None
    count = 0
    while not done:
        count += 1
        print(f"Scanning page {count}")
        if start_key:
            scan_kwargs['ExclusiveStartKey'] = start_key
        response = dynamodb.scan(**scan_kwargs)
        for item in response['Items']:
            if 'region' in item:
                region = item['region']['S']
                unique_regions.add(region)
        start_key = response.get('LastEvaluatedKey', None)
        done = start_key is None

    # Log unique regions to a file
    with open('./logs/regions.log', 'w') as file:
        for region in unique_regions:
            file.write(f"{region}\n")

    print(f"Logged all unique regions to /mnt/data/regions.log")


unique_regions_all_pages()
