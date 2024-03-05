import discord
import re
import boto3
import json
import datetime

# Run this code to start the backfill bot. 

# URL to join a server: https://discord.com/oauth2/authorize?client_id=1214629877601406996&permissions=68608&scope=bot

# Initialize SQS client
sqs = boto3.client('sqs')
queue_url = 'REDACTED_SQS_URL/TeamRevealsQueue'

TOKEN = 'MTIxNDYyOTg3NzYwMTQwNjk5Ng.GMRKf9.fmfNal4rkPc2DyQzrzaYoO9T9gDN3xA_xqukTc'

CHANNEL_ID = 1214628203285446777

intents = discord.Intents.default()
intents.messages = True
intents.guilds = True
intents.message_content = True  

# Creating an instance of a Client to connect to Discord
client = discord.Client(intents=intents)

async def process_existing_messages(channel_id):
    channel = client.get_channel(channel_id)
    if channel:
        async for message in channel.history(limit=None): 
            await process_message(message)
    else:
        print(f"Channel with ID {channel_id} not found.")

async def process_message(message):
    if message.author == client.user:
        print("a")
        # return

    urls = re.findall('http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', message.content)
    url_name = ""
    team_names = []
    for embed in message.embeds:
        if embed.title:
            team_names.extend(re.findall(r'\b\d+[A-Z]\b', embed.title))
            url_name = embed.title
            # print(f"Embed title: {embed.title}")
    # print(f"Urls: {urls}")
    # print(f"Team names: {team_names}")
    
    message_date = message.created_at.strftime('%Y-%m-%dT%H:%M:%S')

    if urls and team_names:
        for team_name in team_names:
            msg_body = {
                'team_number': team_name,
                'reveal_url': urls[0],
                'reveal_title': url_name,
                'post_date': message_date  
            }
            message_body_json = json.dumps(msg_body)

            response = sqs.send_message(QueueUrl=queue_url, MessageBody=message_body_json)
            print(f"Sent to SQS: {msg_body}")

@client.event
async def on_ready():
    print(f'We have logged in as {client.user}')
    await process_existing_messages(CHANNEL_ID)  

@client.event
async def on_message(message):
    await process_message(message)

client.run(TOKEN)