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

((team_name:"10B"^2 OR team_name:10B*^1.5 OR team_name:*10B* OR team_number:"10B"^2.5 OR team_number:10B*^2 OR team_number:*10B*^1.5 AND (team_registered:true^1.5 OR team_registered:false) AND NOT event_name:*) OR ((event_name:"10B"^2.5 OR event_name:10B*^2 OR event_name:*10B*^1.5) AND NOT team_name:*)) AND (program:VRC^1.5 OR program:*VRC*^1.5 OR *:*)

((team_name:"Wash"^2 OR team_name:Wash*^1.5 OR team_name:*Wash* OR team_number:"Wash"^2.5 OR team_number:Wash*^2 OR team_number:*Wash*^1.5 AND (team_registered:true^1.5 OR team_registered:false) AND NOT event_name:*) OR ((event_name:"Wash"^2.5 OR event_name:Wash*^2 OR event_name:*Wash*^1.5) AND NOT team_name:*)) AND (program:VRC^1.5 OR program:*VRC*^1.5 OR *:*)


((team_name:{query_term}^4 OR team_name:{query_term}*^3 OR team_name:*{query_term}*^1.5 OR team_number:{query_term}^5 OR team_number:{query_term}*^3.5 OR team_number:*{query_term}*^1.75 AND (team_registered:true^2 OR team_registered:false) AND NOT event_name:*) OR ((event_name:{query_term}^3 OR event_name:{query_term}*^2 OR event_name:*{query_term}*^1) AND NOT team_name:* AND (event_name:* AND (event_start:[now-1y TO now]^1.5 OR event_start:[now+1y TO now]^1.5 OR event_start:[now-2y TO now-1y]^1.3 OR event_start:[now-3y TO now-2y]^1.2 OR event_start:[now-4y TO now-3y]^1.1 OR event_start:[now-5y TO now-4y]^1)))) AND (program:VRC^2 OR program:*VRC*^2 OR *:*)

((team_name:10B^4 OR team_name:10B*^3 OR team_name:*10B*^1.5 OR team_number:10B^5 OR team_number:10B*^3.5 OR team_number:*10B*^1.75 AND (team_registered:true^1.5 OR team_registered:false) AND NOT event_name:*) OR ((event_name:10B^3 OR event_name:10B*^2 OR event_name:*10B*^1) AND NOT team_name:* AND (event_name:* AND (event_start:[now-1y TO now]^1.5 OR event_start:[now+1y TO now]^1.5 OR event_start:[now-2y TO now-1y]^1.3 OR event_start:[now-3y TO now-2y]^1.2 OR event_start:[now-4y TO now-3y]^1.1 OR event_start:[now-5y TO now-4y]^1)))) AND (program:VRC^1.5 OR program:*VRC*^1.5 OR *:*)