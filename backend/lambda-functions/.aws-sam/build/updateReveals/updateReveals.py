import boto3
import json
import logging
from urllib.parse import urlparse, parse_qs

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

logging = logging.getLogger()
logging.setLevel("INFO")

def normalize_youtube_url(url):
    parsed_url = urlparse(url)
    if 'youtu.be' in parsed_url.netloc:
        return parsed_url.path.lstrip('/')
    elif 'youtube.com' in parsed_url.netloc:
        query_params = parse_qs(parsed_url.query)
        return query_params['v'][0] if 'v' in query_params else None
    return None

def handler(event, context):
    table_name = 'team-data'
    table = dynamodb.Table(table_name)
    
    for record in event['Records']:
        message_body = record['body']
        logging.info(f"Received message body: {message_body}")
        message = json.loads(message_body)
        
        team_number = message['team_number']

        response = table.query(
            IndexName='TeamNumberIndex',
            KeyConditionExpression='#num = :number',
            ExpressionAttributeNames={
                '#num': 'number',  # Maps '#num' to the actual attribute name 'number'
            },
            ExpressionAttributeValues={
                ':number': team_number,
            }
        )

        # Choose the item with the longest 'skills' attribute
        if response['Items']:
            team_item = max(response['Items'], key=lambda item: len(item.get('skills', [])))
            item_id = team_item['id']

            current_reveals = team_item.get('reveals', [])
            new_reveal_url = normalize_youtube_url(message['reveal_url'])
            new_reveal = {
                'reveal_url': new_reveal_url,
                'reveal_title': message['reveal_title'],
                'post_date': message['post_date']
            }
            if not any(normalize_youtube_url(reveal['reveal_url']) == new_reveal_url for reveal in current_reveals):
                logging.info(f"Adding reveal {message['reveal_title']} to team {team_number}")
                update_expression = 'SET reveals = list_append(if_not_exists(reveals, :empty_list), :reveal_data)'
                table.update_item(
                    Key={'id': item_id},
                    UpdateExpression=update_expression,
                    ExpressionAttributeValues={
                        ':reveal_data': [new_reveal],
                        ':empty_list': [],
                    }
                )
            else:
                logging.info(f"Reveal {message['reveal_title']} already exists for team {team_number}")

    return {
        'statusCode': 200,
        'body': json.dumps('Successfully processed.')
    }