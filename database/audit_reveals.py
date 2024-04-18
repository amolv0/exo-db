import boto3
from urllib.parse import urlparse, parse_qs

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('team-data')

def normalize_youtube_url(url):
    parsed_url = urlparse(url)
    if 'youtu.be' in parsed_url.netloc:
        return parsed_url.path.split('/')[-1]
    elif 'youtube.com' in parsed_url.netloc:
        video_params = parse_qs(parsed_url.query)
        return video_params['v'][0] if 'v' in video_params else None
    return None

def remove_duplicate_reveals():
    count = 0
    exclusive_start_key = None

    while True:
        count += 1
        print(f"Scanning page {count}")

        if exclusive_start_key:
            response = table.scan(
                ProjectionExpression='id, reveals',
                ExclusiveStartKey=exclusive_start_key
            )
        else:
            response = table.scan(ProjectionExpression='id, reveals')

        for item in response['Items']:
            if 'reveals' in item and item['reveals']:
                unique_ids = {}
                updates = False

                for reveal in item['reveals']:
                    url = reveal['reveal_url']
                    normalized_id = normalize_youtube_url(url)
                    if normalized_id and normalized_id not in unique_ids:
                        unique_ids[normalized_id] = reveal
                    else:
                        updates = True

                if updates:
                    updated_reveals = list(unique_ids.values())
                    table.update_item(
                        Key={'id': item['id']},
                        UpdateExpression='SET reveals = :val',
                        ExpressionAttributeValues={':val': updated_reveals}
                    )
                    print(f"Updated reveals for team {item['id']} to remove duplicates.")
        if 'LastEvaluatedKey' in response:
            exclusive_start_key = response['LastEvaluatedKey']
        else:
            break

    print("Completed processing all teams for duplicate reveals.")

if __name__ == "__main__":
    remove_duplicate_reveals()