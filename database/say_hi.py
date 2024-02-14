import boto3
import requests
from requests_aws4auth import AWS4Auth

region = 'us-east-1'  # or your region
service = 'es'
awsauth = AWS4Auth(boto3.Session().get_credentials().access_key,
                   boto3.Session().get_credentials().secret_key,
                   region, service, session_token=boto3.Session().get_credentials().token)

opensearch_endpoint = 'OPENSEARCH_API_ENDPOINT'  # Replace with your domain endpoint

# Make a signed request
response = requests.get(f'{opensearch_endpoint}/_cluster/health', auth=awsauth)

print(response.text)