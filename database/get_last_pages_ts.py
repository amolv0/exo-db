import requests
import boto3
import os

API_BASE_URL = f"{os.getenv('EXODB_API_GATEWAY_BASE_URL')}/dev/tsranking"

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('last-page-data')



seasons = [181, 182, 173, 175, 154, 156, 139, 140, 130, 131, 125, 126, 119, 120, 115, 116, 110, 111, 102, 103]

seasons = [92, 93]

regions = [
    "Maine", "Washington", "Zhejiang", "Bahrain", "Kentucky", "San Luis Potosí", "Fujian", "Donegal", "Virginia", "Nevada",
    "Panama", "Connecticut", "Türkiye", "Vietnam", "Idaho", "Macau", "Louisiana", "Ghana", "Montana", "Baden-Württemberg",
    "Jalisco", "Chile", "Japan", "Egypt", "Quebec", "Ethiopia", "Hebei", "Taiwan", "Russia", "Michigan", "Tamaulipas",
    "Indonesia", "Alaska", "Tunisia", "Georgia", "Hidalgo", "Basel-Stadt", "Illinois", "North Carolina", "Saudi Arabia",
    "Guanajuato", "Michoacán", "Berlin", "Durango", "Azerbaijan", "Shandong", "Oregon", "Jiangsu", "Jiangxi", "Delaware",
    "Tabasco", "North Dakota", "Australia", "South Dakota", "Henan", "Brazil", "Maryland", "Arkansas", "Veracruz",
    "Chihuahua", "Andorra", "District of Columbia", "Mexico City", "Hamburg", "New York", "Gansu", "Kuwait", "Tennessee",
    "South Carolina", "Iowa", "New Jersey", "United States", "Hawaii", "Philippines", "Alberta", "Tianjin", "West Virginia",
    "Barcelona", "British Columbia", "France", "Basel-Landschaft", "Coahuila", "Korea, Republic of", "Nebraska", "United Arab Emirates",
    "Wisconsin", "Aargau", "Aguascalientes", "United Kingdom", "Rhode Island", "California", "Pennsylvania", "Mississippi",
    "Luxembourg", "Florida", "Rhône", "Beijing", "Nuevo León", "Guangdong", "Alabama", "Massachusetts", "Kazakhstan", "Vermont",
    "Morelos", "Colorado", "Finland", "Nordrhein-Westfalen", "Oman", "Jilin", "Saskatchewan", "Ohio", "Indiana", "Switzerland",
    "Limerick", "Utah", "Canada", "Minnesota", "Sichuan", "Kansas", "Girona", "Paraguay", "Ontario", "Shaanxi", "Manitoba",
    "Oklahoma", "Singapore", "Shanghai", "Thailand", "Ireland", "Madrid", "Cork", "Quintana Roo", "Spain", "Niedersachsen",
    "China", "Lebanon", "Slovakia", "Yucatán", "New Mexico", "New Hampshire", "New Zealand", "Guizhou", "Morocco", "Malaysia",
    "Tlaxcala", "Guipuzcoa", "Mexico State", "Chiapas", "Jordan", "Hong Kong", "Texas", "Baja California", "Vizcaya", "Offaly",
    "Rheinland-Pfalz", "Belgium", "Arizona", "Puerto Rico", "Colombia", "Wyoming", "Qatar", "Germany", "Hainan", "Missouri", "Mexico", ""
]

# regions = [
#     "China", "United States", "Spain", "Germany", "Ireland", "Switzerland", "Canada", "Mexico"
# ]

def find_last_valid_page(season, region):
    page = 1
    while True:
        params = {
            'season': season,
            'region': region,
            'page': page
        }
        response = requests.get(API_BASE_URL, params=params)
        if response.status_code == 500:
            return page - 1
        elif response.status_code != 200:
            print(f"Unexpected error fetching page {page} for parameters: {params}, status code: {response.status_code}")
            return page - 1  # Consider the last successful page as the last valid page
        page += 1

def save_last_page_to_dynamodb(season, region, last_page):
    item_id = f"trueskill-{season}"
    if region != "":
        item_id += f"-{region}"
    try:
        table.put_item(
            Item={
                'id': item_id,
                'last_page': last_page
            }
        )
        # print(f"Saved last page info for {item_id} to DynamoDB.")
    except Exception as e:
        print(f"Error saving last page info for {item_id} to DynamoDB: {e}")

print("Starting process")
for season in seasons:
    for region in regions:
        last_page = find_last_valid_page(season, region)
        save_last_page_to_dynamodb(season, region, last_page)
        print(f"Last page for Season: {season}, Region: {region} is {last_page}")

print("Finished processs")


# season = 181
# region = "Washington"
# last_page = find_last_valid_page(season, region)
# save_last_page_to_dynamodb(season, region, last_page)
# print(f"Last page for Season: {season}, Region: {region} is {last_page}")
