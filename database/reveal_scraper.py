from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import boto3
import json
import re, time
from datetime import datetime
import os
import html

YOUTUBE_API_KEY = os.getenv('EXODB_YOUTUBE_API_KEY')
QUEUE_URL = os.getenv('SQS_TEAM_REVEAL_URL')

youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

def search_videos(query):
    total_results = 0
    next_page_token = None
    max_results_per_call = 50
    max_total_results = 1000

    while total_results < max_total_results:
        try:
            search_response = youtube.search().list(
                q=query,
                part='snippet',
                maxResults=max_results_per_call,
                type='video',
                pageToken=next_page_token
            ).execute()
            
            for item in search_response.get('items', []):
                video_id = item['id']['videoId']
                video_title = item['snippet']['title']
                description = item['snippet']['description']
                channel_title = item['snippet']['channelTitle']
                published_at = item['snippet']['publishedAt']
                process_video_data(video_id, video_title, description, channel_title, published_at)

            total_results += len(search_response.get('items', []))
            next_page_token = search_response.get('nextPageToken')

            if not next_page_token:
                break 

        except HttpError as e:
            error = json.loads(e.content).get('error')
            if error.get('errors')[0].get('reason') in ['quotaExceeded', 'rateLimitExceeded']:
                print("Quota exceeded! Waiting 2 hours before retrying...")
                time.sleep(7200)
                continue
            else:
                raise  # Re-raise the exception if it's not a quota issue

def contains_keywords(text):
    reveal_keywords = ['reveal']
    other_keywords = ['vrc', 'vex', 'itz', 'in the zone', 'robot', 'change up', 'spin up', 'tipping point', 'starstruck', 'nothing but net', 'nbn', 'toss up', 'gateway', 'sack attack']
    return any(re.search(rf'\b{keyword}\b', text, re.IGNORECASE) for keyword in reveal_keywords) and \
           any(re.search(rf'\b{keyword}\b', text, re.IGNORECASE) for keyword in other_keywords)

def process_video_data(video_id, video_title, description, channel_title, published_at):
    video_title = html.unescape(video_title)
    
    if not (contains_keywords(video_title) or contains_keywords(description)):
        return 
    
    team_number_general_pattern = r'\b\d+[A-Z]\b'
    team_number_description_pattern = r'\b\d{2,}[A-Z]\b'

    team_numbers = set()
    
    team_numbers.update(re.findall(team_number_general_pattern, video_title))
    team_numbers.update(re.findall(team_number_general_pattern, channel_title))
    
    team_numbers.update(re.findall(team_number_description_pattern, description))

    youtube_url = f"https://www.youtube.com/watch?v={video_id}"

    try:
        message_date = datetime.strptime(published_at, '%Y-%m-%dT%H:%M:%S.%fZ').strftime('%Y-%m-%dT%H:%M:%S')
    except ValueError:
        message_date = datetime.strptime(published_at, '%Y-%m-%dT%H:%M:%SZ').strftime('%Y-%m-%dT%H:%M:%S')
        
    if team_numbers:
        sqs = boto3.client('sqs')
        for team_number in team_numbers:
            msg_body = {
                'team_number': team_number,
                'reveal_url': youtube_url,
                'reveal_title': video_title,
                'post_date': message_date  
            }
            message_body_json = json.dumps(msg_body)
            response = sqs.send_message(QueueUrl=QUEUE_URL, MessageBody=message_body_json)
            print(f"Sent to SQS: {msg_body}")
            
# List of queries
queries = [
    "vex robotics reveal",
    "vrc reveal",
    "vex reveal",
    "over under reveal",
    "spin up reveal",
    "tipping point reveal",
    "change up reveal",
    "tower takeover reveal",
    "turning point reveal",
    "in the zone reveal",
    "itz reveal"
    "starstruck reveal",
    "nothing but net reveal",
    "nbn reveal",
    "skyrise reveal",
    "toss up reveal",
    "sack attack reveal",
    "gateway reveal",
    "vex over under reveal",
    "vex spin up reveal",
    "vex tipping point reveal",
    "vex change up reveal",
    "vex tower takeover reveal",
    "vex turning point reveal",
    "vex in the zone reveal",
    "vex itz reveal"
    "vex starstruck reveal",
    "vex nothing but net reveal",
    "vex nbn reveal",
    "vex skyrise reveal",
    "vex toss up reveal",
    "vex sack attack reveal",
    "vex gateway reveal"
]

for query in queries:
    search_videos(query)
