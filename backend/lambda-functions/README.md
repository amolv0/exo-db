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

OpenSearch Queries:

Base Lucene:

((team_name:\"${queryTerm}\"^8 OR team_name:${queryTerm}*^6 OR team_name:*${queryTerm}*^3 OR team_number:${queryTerm}^10 OR team_number:${queryTerm}*^7 OR team_number:*${queryTerm}*^3.5 AND (team_registered:true^1.5 OR team_registered:false) AND NOT event_name:*) OR ((event_name:\"${queryTerm}\"^6 OR event_name:${queryTerm}*^3 OR event_name:*${queryTerm}*^1.5) AND NOT team_name:* AND (event_name:* AND (event_start:[now-1y TO now]^2 OR event_start:[now+1y TO now]^2 OR event_start:[now-2y TO now-1y]^1.5 OR event_start:[now-3y TO now-2y]^1.2 OR event_start:[now-4y TO now-3y]^1.1 OR event_start:[now-5y TO now-4y]^1)))) AND (program:VRC^2 OR program:*VRC*^2 OR *:* AND NOT program:WORKSHOP)

Sample Queries:

