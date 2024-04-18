from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import boto3
from boto3.dynamodb.conditions import Key, Attr
import json
import time
from datetime import datetime
import os
from fuzzywuzzy import fuzz
from fuzzywuzzy import process
import nltk
from nltk.corpus import stopwords
nltk.download('punkt')
nltk.download('stopwords')
from datetime import datetime, timedelta, timezone
import html

stop_words = set(stopwords.words('english'))

YOUTUBE_API_KEY = os.getenv('EXODB_YOUTUBE_API_KEY')

youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('event-data')

less_important_keywords = {'vex', 'vrc', 'robotics', 'competition', 'high', 'middle', 'school', 'turning', 'point'}


def make_aware(dt):
    """Ensure datetime is timezone-aware."""
    if dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

def extract_keywords(text):
    words = nltk.word_tokenize(text)
    filtered_words = [word.lower() for word in words if word.lower() not in stop_words and word.isalnum()]
    keywords = set(filtered_words)
    return keywords

def match_event_with_title(event_keywords, title_keywords, event_name, video_title, event_start_date, video_post_date):
    event_date = make_aware(datetime.strptime(event_start_date, '%Y-%m-%dT%H:%M:%S%z'))
    try:
        post_date = make_aware(datetime.strptime(video_post_date, '%Y-%m-%dT%H:%M:%S.%fZ'))
    except ValueError:
        post_date = make_aware(datetime.strptime(video_post_date, '%Y-%m-%dT%H:%M:%SZ'))
        
    if abs((post_date - event_date).days) > 90:
        return False
    
    common_keywords = event_keywords.intersection(title_keywords)
    weighted_match_score = len(common_keywords) / len(event_keywords)
    
    if weighted_match_score > 0.3:  # Adjust this threshold based on performance
        return True

    # Fuzzy matching for additional verification
    similarity_score = fuzz.token_sort_ratio(event_name, video_title)
    if similarity_score > 70:  # Adjust this threshold based on tolerance
        return True
    # print("returning false")
    return False

def search_videos(event_name, event_start_date):
    max_results_per_call = 20
    max_total_results = 20
    next_page_token = None
    total_results = 0
    while total_results < max_total_results:
        try:
            search_response = youtube.search().list(
                q=event_name,
                part='snippet',
                maxResults=max_results_per_call,
                type='video',
                pageToken=next_page_token
            ).execute()

            for item in search_response.get('items', []):
                video_id = item['id']['videoId']
                video_title = item['snippet']['title']
                video_title = html.unescape(video_title)
                video_post_date = item['snippet']['publishedAt']
                event_keywords = extract_keywords(event_name)
                title_keywords = extract_keywords(video_title)
                # print(event_keywords)
                # print(title_keywords)
                
                # thanks discrete math 1
                if 'world' in event_keywords and ('worlds' not in title_keywords and 'world' not in title_keywords or 'vex' not in title_keywords):
                    # print(1)
                    continue
                if ('vex' in event_keywords or 'vrc' in event_keywords) and ('vexu' in title_keywords or 'iq' in title_keywords or 'vexiq' in title_keywords or 'viqc' in title_keywords):
                    # print(2)
                    continue
                if 'high' in event_keywords and 'school' in event_keywords and ('vexu' in title_keywords or 'elementary' in title_keywords or 'middle' in title_keywords or 'ms' in title_keywords):
                    # print(3)
                    continue
                if (('middle' in event_keywords and 'school' in event_keywords) or 'ms' in event_keywords) and (('high' in title_keywords or 'vexu' in title_keywords or 'hs' in title_keywords or 'elementary' in title_keywords) or ('middle' not in title_keywords and 'ms' not in title_keywords)):
                    # print(4)
                    continue
                if 'elementary' in event_keywords and ('ms' in title_keywords or 'middle' in title_keywords or 'high' in title_keywords or 'vexu' in title_keywords):
                    # print(5)
                    continue
                if (('vex' and 'u' in event_keywords) or 'vexu' in event_keywords) and (('high' in title_keywords or 'middle' in title_keywords or 'elementary' in title_keywords or 'ms' in title_keywords) or ('vexu' not in title_keywords and ('vex' and 'u' not in title_keywords))):
                    # print(6)
                    continue
                if 'championship' in event_keywords and 'championship' not in title_keywords:
                    # print(7)
                    continue
                if ('iq' in event_keywords or 'viqc' in event_keywords or 'vexiq' in event_keywords) and ('iq' not in title_keywords and 'viqc' not in title_keywords and 'vexiq' not in title_keywords):
                    # print(8)
                    continue
                if ('vexu' in event_keywords or ('vex' in event_keywords and 'u' in event_keywords)) and ('vexu' not in title_keywords and ('vex' not in title_keywords and 'u' not in title_keywords)):
                    # print(9)
                    continue
                
                event_keywords = event_keywords - less_important_keywords
                title_keywords = title_keywords - less_important_keywords
                
                if len(event_keywords) < 4 or len(title_keywords) < 4 and 'world' not in event_keywords:
                    # print(10)
                    continue
                
                if match_event_with_title(event_keywords, title_keywords, event_name, video_title, event_start_date, video_post_date):
                    youtube_url = f"https://www.youtube.com/watch?v={video_id}"
                    print(f"Found a match: event_name: {event_name}, video_title: {video_title}")
                    # process_event_data(event_name, youtube_url, video_title, published_at)

            next_page_token = search_response.get('nextPageToken')
            total_results += len(search_response.get('items', []))
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

def process_event_data(event_name, youtube_url, video_title, published_at):
    try:
        message_date = datetime.strptime(published_at, '%Y-%m-%dT%H:%M:%S.%fZ').strftime('%Y-%m-%dT%H:%M:%S')
    except ValueError:
        message_date = datetime.strptime(published_at, '%Y-%m-%dT%H:%M:%SZ').strftime('%Y-%m-%dT%H:%M:%S')

    # Update DynamoDB item
    # response = table.update_item(
    #     Key={'event_name': event_name},
    #     UpdateExpression="SET streams = list_append(if_not_exists(streams, :empty_list), :stream)",
    #     ExpressionAttributeValues={
    #         ':stream': [{
    #             'stream_url': youtube_url,
    #             'stream_title': video_title,
    #             'post_date': message_date
    #         }],
    #         ':empty_list': []
    #     },
    #     ReturnValues="UPDATED_NEW"
    # )
    print(f"Updated DynamoDB for event {event_name}")

def main():
    # Scan DynamoDB table for all events
    response = table.scan()
    count = 0
    while 'Items' in response:
        count += 1
        print(f"Scanning page {count}")
        for event in response['Items']:
            event_name = event['name']
            event_start_date = event['start']
            if event['program'] == 'WORKSHOP':
                continue
            search_videos(event_name, event_start_date)
        
        if 'LastEvaluatedKey' not in response:
            break
        if count == 1:
            break
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        
def search_videos_for_event_id(event_id):
    try:
        response = table.get_item(Key={'id': event_id})
        event = response.get('Item')
        if event:
            event_name = event['name']
            event_start_date = event['start']
            search_videos(event_name, event_start_date)
        else:
            print("Event not found.")
    except Exception as e:
        print(f"Error accessing DynamoDB: {e}")
        
if __name__ == '__main__':
    # main()
    # search_videos_for_event_id(51488)
    # search_videos_for_event_id(35176)
    search_videos_for_event_id(49316)