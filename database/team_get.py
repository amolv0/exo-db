import json
import requests
import time

API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiODU4MTYxMzQ1MmUyMjE2YjE5MWEwY2Q5NjVkMmE4YThkNWZkYjZhNjI4ZWEwNjM3YzMyNjM1OWVkMmRiZWU3ODdjMjBiNDcyMDhiM2ZkMjUiLCJpYXQiOjE3MDIxMDAyNDguNDA4MjA1LCJuYmYiOjE3MDIxMDAyNDguNDA4MjA3OSwiZXhwIjoyNjQ4ODcxNDQ4LjM5OTk1OTEsInN1YiI6IjkwODM3Iiwic2NvcGVzIjpbXX0.Tk_BPVkoN42aEdJDMH_tAOnhhVZZiZ93VJVxELdwEw3npoJFWoqPKYgCPrPOt4X5YvyOQn82-UBJCUmXbPEJSGWK6gERFKLygi48afODQc-c9s5GnWJKT2Z5OQ608RJm9ZgDzzr7jk6nVJm-6gI9UJ4AUwFxlBTY4D6_uATPJNycD4EqJ7Wu9_jOBhW2Oek84fU9XzYrodTRpfwSmr5-g4mblM_1_r_hxrtIG4y22Gjt-qbRnAaIAnhehF5Z-9K82CQ7x95gLQXC1tzs-AWtv3upLjBqVM_mDiERlztNE08qJZ7o8etRJU9j5m1xFHPk9MF7vrNh2QdkL7JTYkNBoOEB-z-LfF4SJ2vlftFMvhiyxxnQ0YYmzjyBD5utjm5Tn-oZZ3umDmxQuc08yy2K_t21Pf8bTgMLKDs8RUdC6hxLgmNOy7fa1w2lYU7-NhjiZATNNqJ9WTTBoJxUqux290jXtPC2zzJcqFniV5DA4vdYWcFCHQAglPAUe3W5FfiLJ4CVZ4Sd6Kfb7euKVAG7DvuVxF7BwCQspBI8O31L9F0dKp2t-W9YBB0xjRbrQOnVOSPuTQdc1O4-R1OLz7Vr1BzKsNBBwSzt8ejqed3rpnpdrbm-rUJBj3UD7UGJgAYDeFIgNuB1i5MWd5dzfcQMXGQ_a8WGOCKGbXeLZC7WOoU'
API_KEY_2 = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiZjBkNGE3YjYwYjU5ZGY2MjFlYTk1MjZkZDUzMDg5NTA1ZDRjYTM4ZGM3YjJkYjhlNzdhMDY4NGNiNWE4YjVmZDE0MDYyZDA1ZjlmZDM0NTQiLCJpYXQiOjE3MDIyNzQ0MjcuNzE1MDI1OSwibmJmIjoxNzAyMjc0NDI3LjcxNTAzLCJleHAiOjI2NDkwNDU2MjcuNzA2MjQyMSwic3ViIjoiOTA4MzciLCJzY29wZXMiOltdfQ.moxph7N_eE2AlY26W5hY4N3DCbL_AfI1NKC2J1fgLTzzXaUl_k1bCdlnr7ONJrZ6G3TdzcG6qZvTcTtxB1MqMaUOXY3nZYRiHX-3Y0IR2usvMxQQuuH0l91BYdBsc64XctX0CtRYPrikgEACpSLsWedk-pEBXdC7b4_LUut_Ahi65cJnkbB5bvViFZaYbd4zUkMV2uHU7yKwzT93ty1WFH-PwBXv1KKuxgfO5__NwJNTX5sVBQZm6rdgxvkWdkY1t2_QHHoxHgzDxRDhy8kdMiXzpJBQXoKLK6oFydc8jwdcWeLuljTquiHGtiAHxbpwRSysl9H7-omM6YTPOb3gu7EhyEFCKCtXhVVi1r9Z8Y-piVxAvTiG2zjRzRpc3RyRpMnEnXqplSFbCc-LzCFBmZJU--bThZJI-kRRNsguGmKJ7VwAWyvJy2bk2jfRY55mQlw0wpRM3-cCzLyi9PKKNPWG7PbNs_zWplYh1R6eVtLMbmooCEsS4dkNTuGteIUX1HtoYrm65v1iHWLD6BtlYWVYV68GBe1N8OQc27YgIV63EMAw_eaMvbSbFLN_zEoBXRcAAK9khKqF7DtB_ezBEDf51hCJyuJaEm8A_YrUaLpY07xFIKJaB7QsnI_EMphqvoKpt2n_VmPsLNWev1fu511ujvedbcC35wGKJdOztQE'
json_path = 'data/team_data.json'

baseUrl = 'https://www.robotevents.com/api/v2/teams?myTeams=false&page=1&per_page=250'  #washington had ~2600 events recorded
headers = {
    'accept': 'application/json',
    'Authorization': f'Bearer {API_KEY}'
}
combined_data = []

def make_request(url, headers, retries=5, delay=10):
    for _ in range(retries):
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json().get('data', [])
        elif response.status_code == 429:
            print(f"Rate limit exceeded. Retrying in {delay} seconds...")
            time.sleep(delay)
        else:
            print(f"Request failed with status code: {response.status_code}")
            break

    return []


for i in range(1, 413):
    url = f'https://www.robotevents.com/api/v2/teams?myTeams=false&page={i}&per_page=250' #250 is the max to show per page, to get all must go to page 413
    print(i)
    data = make_request(url, headers)

    combined_data += data

combined_json = {"data": combined_data}
with open(json_path, 'w') as json_file:
    json.dump(combined_json, json_file, indent=4)
    print("JSON combined")