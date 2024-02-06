# Lambda Function Deployment

First, update functions in their respective directories and make sure package.json is updated

Update template.yaml to account for all functions and their properties

Run `sam build` and then  `sam package     --output-template-file packaged.yaml     --s3-bucket exodblambdafunctions` to package.

To deploy, run `sam deploy     --template-file packaged.yaml     --stack-name exodb-lambda-stack      --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM     --region us-east-1`

or use ./deploy-sam.sh

Dev API link: `EXODB_API_GATEWAY_BASE_URL/dev`

Query to determine the size of a log group in cloudwatch:

fields @timestamp, @message
| stats sum(bytes)
