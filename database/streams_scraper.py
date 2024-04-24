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
import re

stop_words = set(stopwords.words('english'))
stop_words.remove('s')
API_KEYS = [os.getenv(f'EXODB_YOUTUBE_API_KEY_{i}') for i in range(1, 22)]
current_key_index = 14
def get_youtube_client():
    global current_key_index
    return build('youtube', 'v3', developerKey=API_KEYS[current_key_index])

youtube = get_youtube_client()
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('event-data')

less_important_keywords = {'vex', 'vrc', 'robotics', 'competition', 'high', 'middle', 'school', 'turning', 'point', 'league', 'championship'}

def make_aware(dt):
    """Ensure datetime is timezone-aware."""
    if dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

def extract_keywords(text):
    # Use re.split to handle non-alphanumeric characters; split on any character that is not a letter or number
    words = re.split(r'\W+', text)
    filtered_words = [word.lower() for word in words if word.lower() not in stop_words]
    keywords = set(filtered_words)
    return keywords

def match_event_with_title(event_keywords, title_keywords, event_name, video_title, event_start_date, video_post_date, weighted_match_threshold, similarity_threshold):    
    event_date = make_aware(datetime.strptime(event_start_date, '%Y-%m-%dT%H:%M:%S%z'))
    try:
        post_date = make_aware(datetime.strptime(video_post_date, '%Y-%m-%dT%H:%M:%S.%fZ'))
    except ValueError:
        post_date = make_aware(datetime.strptime(video_post_date, '%Y-%m-%dT%H:%M:%SZ'))
        
    if abs((post_date - event_date).days) > 90:
        # print(11)
        return False
    
    common_keywords = event_keywords.intersection(title_keywords)
    weighted_match_score = len(common_keywords) / len(event_keywords)
    print(weighted_match_score)
    if weighted_match_score < weighted_match_threshold:  # Adjust this threshold based on performance
        # print()
        return False

    # Fuzzy matching for additional verification
    similarity_score = fuzz.token_sort_ratio(event_name, video_title)
    print(similarity_score)
    if similarity_score > similarity_threshold:  # Adjust this threshold based on tolerance
        return True
    # print(12)
    return False

def search_videos(event_name, event_start_date):
    global current_key_index
    global youtube
    try:
        
        team_number_pattern = re.compile(r'\b\d+[A-Z]\b')
        search_response = youtube.search().list(
            q=event_name,
            part='snippet',
            maxResults=10,
            type='video',
        ).execute()
        for item in search_response.get('items', []):
            video_id = item['id']['videoId']
            video_title = item['snippet']['title']
            video_title = html.unescape(video_title)
            video_post_date = item['snippet']['publishedAt']
            title_keywords = extract_keywords(video_title)
            event_keywords = extract_keywords(event_name)
            # print(event_keywords)
            # print(title_keywords)
            # print(video_title)
            # thanks discrete math 1
            worlds = False
            if 'world' in event_keywords or 'worlds' in event_keywords:
                worlds = True
            if ('world' in event_keywords) and (('worlds' not in title_keywords and 'world' not in title_keywords or 'vex' not in title_keywords) or 'reveal' in title_keywords or bool(team_number_pattern.search(video_title))):
                # print(1)
                continue
            if ('vex' in event_keywords or 'vrc' in event_keywords) and ('vexu' in title_keywords or 'iq' in title_keywords or 'vexiq' in title_keywords or 'viqc' in title_keywords or ('u' in title_keywords and 's' not in title_keywords)):
                # print(2)
                continue
            if (('high' in event_keywords and 'school' in event_keywords) or 'hs' in event_keywords) and ('vexu' in title_keywords or 'elementary' in title_keywords or 'middle' in title_keywords or 'ms' in title_keywords or ('u' in title_keywords and 's' not in title_keywords)) and not (('middle' in title_keywords and 'high' in title_keywords) or ('ms' in title_keywords and 'hs' in title_keywords)):
                # print(3)
                continue
            if ((('middle' in event_keywords and 'school' in event_keywords) or 'ms' in event_keywords) and (('high' in title_keywords or 'vexu' in title_keywords or 'hs' in title_keywords or 'elementary' in title_keywords) or ('middle' not in title_keywords and 'ms' not in title_keywords))) and not (('middle' in title_keywords and 'high' in title_keywords) or ('ms' in title_keywords and 'hs' in title_keywords)):
                # print(4)
                continue
            if 'elementary' in event_keywords and ('ms' in title_keywords or 'middle' in title_keywords or 'high' in title_keywords or 'vexu' in title_keywords):
                # print(5)
                continue
            if (('vex' and ('u' in title_keywords and 's' not in title_keywords)) or 'vexu' in event_keywords) and (('high' in title_keywords or 'middle' in title_keywords or 'elementary' in title_keywords or 'ms' in title_keywords) or ('vexu' not in title_keywords and ('vex' and 'u' not in title_keywords))):
                # print(6)
                continue
            if ('world' in event_keywords or 'worlds' in event_keywords) and ('final' not in title_keywords and 'finals' not in title_keywords and 'semi-final' not in title_keywords and 'semis' not in title_keywords and 'semi' not in title_keywords and 'quarter' not in title_keywords and 'qf' not in event_keywords and 'sf' not in event_keywords):
                # print(7)
                continue
            # if 'championship' in event_keywords and 'championship' not in title_keywords:
            #     print(7)
            #     continue
            if ('iq' in event_keywords or 'viqc' in event_keywords or 'vexiq' in event_keywords) and ('iq' not in title_keywords and 'viqc' not in title_keywords and 'vexiq' not in title_keywords):
                # print(8)
                continue
            if ('vexu' in event_keywords or ('vex' in event_keywords and 'u' in event_keywords)) and ('vexu' not in title_keywords and ('vex' not in title_keywords and ('u' in title_keywords and 's' not in title_keywords))):
                # print(9)
                continue
            if ('spring' in event_keywords and 'fall' in title_keywords) or ('fall' in event_keywords and 'spring' in title_keywords):
                # print(13)
                continue
            if 'ftc' in title_keywords or 'frc' in title_keywords or 'fll' in title_keywords:
                # print(14)
                continue
            
            event_keywords = event_keywords - less_important_keywords
            title_keywords = title_keywords - less_important_keywords
            
            if (len(event_keywords) < 4 or len(title_keywords) < 4) and ('world' not in event_keywords and 'worlds' not in event_keywords):
                # print(10)
                # print(len(event_keywords))
                # print(len(title_keywords))
                continue
            weighted_match_threshold = 0.2 if worlds else 0.3 # 0.2 if worlds else 0.3
            similarity_threshold = 35 if worlds else 45  # 50 if worlds else 70
                
            if match_event_with_title(event_keywords, title_keywords, event_name, video_title, event_start_date, video_post_date, weighted_match_threshold, similarity_threshold):
                youtube_url = f"https://www.youtube.com/watch?v={video_id}"
                print(f"Found a match: event_name: {event_name}, video_title: {video_title}")
                # process_event_data(event_name, youtube_url, video_title, video_post_date)
            
    except HttpError as e:
        error = json.loads(e.content).get('error')
        if error.get('errors')[0].get('reason') in ['quotaExceeded', 'rateLimitExceeded']:       
            current_key_index = (current_key_index + 1) % len(API_KEYS)
            if current_key_index == 0:  # All keys have been cycled through
                print("All API keys quota exceeded! Waiting 2 hours before retrying...")
                time.sleep(7200)
            else:
                print(f"Switching to the next API key: {current_key_index + 1}")
            youtube = get_youtube_client()  # Refresh the YouTube client with the new key
            return
        else:
            raise  # Re-raise the exception if it's not a quota issue

def process_event_data(event_name, youtube_url, video_title, published_at):
    try:
        message_date = datetime.strptime(published_at, '%Y-%m-%dT%H:%M:%S.%fZ').strftime('%Y-%m-%dT%H:%M:%S')
    except ValueError:
        message_date = datetime.strptime(published_at, '%Y-%m-%dT%H:%M:%SZ').strftime('%Y-%m-%dT%H:%M:%S')

    try:
        response = table.query(
            IndexName='EventNameIndex',  # The name of the secondary index
            KeyConditionExpression=Key('name').eq(event_name)
        )
        if response['Items']:
            event_id = response['Items'][0]['id']  # Assuming 'id' is the partition key and items are returned
        else:
            print(f"No event found for {event_name}")
            return
    except Exception as e:
        print(f"Failed to query DynamoDB: {str(e)}")
        return
    
    try:
        update_response = table.update_item(
            Key={'id': event_id},  # Use event ID as the key
            UpdateExpression="SET streams = list_append(if_not_exists(streams, :empty_list), :stream)",
            ExpressionAttributeValues={
                ':stream': [{
                    'stream_url': youtube_url,
                    'stream_title': video_title,
                    'post_date': message_date
                }],
                ':empty_list': []
            },
            ReturnValues="UPDATED_NEW"
        )
        print(f"Updated DynamoDB for event {event_name} with ID {event_id}")
    except Exception as e:
        print(f"Failed to update DynamoDB: {str(e)}")



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
    search_videos_for_event_id(45258)
    # search_videos_for_event_id(49316)