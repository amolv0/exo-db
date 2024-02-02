#!/bin/bash

# Stop on any error
set -e

# Build the SAM application
echo "Building SAM application..."
sam build

# Package the SAM application and upload artifacts to S3
echo "Packaging SAM application..."
sam package \
    --output-template-file packaged.yaml \
    --s3-bucket exodblambdafunctions

# Deploy the SAM application to CloudFormation
echo "Deploying SAM application..."
sam deploy \
    --template-file packaged.yaml \
    --stack-name exodb-lambda-stack \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --region us-east-1

echo "Deployment completed successfully"