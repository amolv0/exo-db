import json

# Your JSON data as a string (ensure it's valid JSON)
data_string = "[{\"team_name\":\"Skill Issue\",\"season\":181,\"team_number\":\"16868K\",\"score\":415,\"team_id\":131739,\"program\":\"VRC\",\"driver_component\":222,\"team_grade\":\"High School\",\"event_team_id\":\"54838-131739\",\"team_org\":\"Checkmate Robotics\",\"programming_component\":193,\"event_id\":54838,\"region\":\"Ontario\",\"event_start\":\"2024-02-11T00:00:00-05:00\",\"event_name\":\"TCTM & CSAA Blended VRC Lunar New Year Qualifier - In-Person Judging and Skills, Remote Notebook Submission\",\"type\":\"robot\"},{\"team_name\":\"ACE Robotics\",\"season\":181,\"team_number\":\"229V\",\"score\":415,\"team_id\":139521,\"program\":\"VRC\",\"driver_component\":222,\"team_grade\":\"High School\",\"event_team_id\":\"53390-139521\",\"team_org\":\"ACE Robotics\",\"programming_component\":193,\"event_id\":53390,\"region\":\"Florida\",\"event_start\":\"2024-01-20T00:00:00-05:00\",\"event_name\":\"Blue Darter Winter Over and Under Event Middle and High School teams\",\"type\":\"robot\"},{\"team_name\":\"Shanghai RuiGuan Team 9123X\",\"season\":181,\"team_number\":\"9123X\",\"score\":412,\"team_id\":105778,\"program\":\"VRC\",\"driver_component\":208,\"team_grade\":\"High School\",\"event_team_id\":\"51540-105778\",\"team_org\":\"ShangHai RuiGuan\",\"programming_component\":204,\"event_id\":51540,\"region\":\"Indonesia\",\"event_start\":\"2024-01-26T00:00:00-05:00\",\"event_name\":\"2024 VEX Asia-Pacific Robotics VRC Signature Event (HS Only)\",\"type\":\"robot\"},{\"team_name\":\"Pika Pika\",\"season\":181,\"team_number\":\"2131Y\",\"score\":407,\"team_id\":93665,\"program\":\"VRC\",\"driver_component\":211,\"team_grade\":\"High School\",\"event_team_id\":\"54124-93665\",\"team_org\":\"DAVIS HIGH\",\"programming_component\":196,\"event_id\":54124,\"region\":\"Utah\",\"event_start\":\"2024-02-10T00:00:00-05:00\",\"event_name\":\"Tooele Robotics Competition\",\"type\":\"robot\"},{\"team_name\":\"MARS\",\"season\":181,\"team_number\":\"78792E\",\"score\":406,\"team_id\":100737,\"program\":\"VRC\",\"driver_component\":223,\"team_grade\":\"High School\",\"event_team_id\":\"54189-100737\",\"team_org\":\"The Mount Academy\",\"programming_component\":183,\"event_id\":54189,\"region\":\"New York\",\"event_start\":\"2024-02-10T00:00:00-05:00\",\"event_name\":\"Clash at Kennedy - VRC Over Under Qualifier (MS/HS)\",\"type\":\"robot\"}]"




data = json.loads(data_string)

# Pretty-print the parsed data
pretty_data_string = json.dumps(data, indent=4, sort_keys=True)

with open('data/formatted_data.json', 'w') as f:
    json.dump(data, f, indent=4, sort_keys=True)