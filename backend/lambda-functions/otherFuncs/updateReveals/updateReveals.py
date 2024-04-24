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

def extract_keywords(text):
    # Split the text into words based on spaces and convert each word to lowercase
    words = text.lower().split()
    # Create a set from the words to remove duplicates
    keywords = set(words)
    return keywords

def handler(event, context):
    table_name = 'team-data'
    table = dynamodb.Table(table_name)
    
    for record in event['Records']:
        message_body = record['body']
        logging.info(f"Received message body: {message_body}")
        message = json.loads(message_body)
        team_number = message['team_number']
        reveal_title=message['reveal_title']

        response = table.query(
            IndexName='TeamNumberIndex',
            KeyConditionExpression='#num = :number',
            ExpressionAttributeNames={
                '#num': 'number', 
            },
            ExpressionAttributeValues={
                ':number': team_number,
            }
        )

        # Choose the item with the longest 'skills' attribute
        if response['Items']:
            program = None
            reveal_keywords = extract_keywords(reveal_title)
            if 'vrc' in reveal_keywords or 'vex' in reveal_keywords or 'itz' in reveal_keywords or 'tp' in reveal_keywords or ('change' in reveal_keywords and 'up' in reveal_keywords) or ('tower' in reveal_keywords and 'takeover' in reveal_keywords) or ('turning' in reveal_keywords and 'point'  in reveal_keywords) or ('tipping' in reveal_keywords and 'point' in reveal_keywords) or ('spin' in reveal_keywords and 'up' in reveal_keywords) or ('toss' in reveal_keywords and 'up' in reveal_keywords) or 'starstruck' in reveal_keywords or 'gateway' in reveal_keywords or 'skyrise' in reveal_keywords or ('sack' in reveal_keywords and 'attack' in reveal_keywords) or ('over' in reveal_keywords and 'under' in reveal_keywords):
                program = 'VRC'
            elif 'viqrc' in reveal_keywords or 'iq' in reveal_keywords:
                program = 'VIQRC'
                
            if program:
                filtered_items = [item for item in response['Items'] if item.get('program') == program]
                if not filtered_items:
                    logging.info(f"No items found with program {program} for team {team_number}")
                    return
                team_item = max(filtered_items, key=lambda item: len(item.get('skills', [])))
            else:
                team_item = max(response['Items'], key=lambda item: len(item.get('skills', [])))
            item_id = team_item['id']

            current_reveals = team_item.get('reveals', [])
            new_reveal_url = normalize_youtube_url(message['reveal_url'])
            new_reveal = {
                'reveal_url': message['reveal_url'],
                'reveal_title': reveal_title,
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