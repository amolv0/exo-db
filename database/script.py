# API KEY: eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiODU4MTYxMzQ1MmUyMjE2YjE5MWEwY2Q5NjVkMmE4YThkNWZkYjZhNjI4ZWEwNjM3YzMyNjM1OWVkMmRiZWU3ODdjMjBiNDcyMDhiM2ZkMjUiLCJpYXQiOjE3MDIxMDAyNDguNDA4MjA1LCJuYmYiOjE3MDIxMDAyNDguNDA4MjA3OSwiZXhwIjoyNjQ4ODcxNDQ4LjM5OTk1OTEsInN1YiI6IjkwODM3Iiwic2NvcGVzIjpbXX0.Tk_BPVkoN42aEdJDMH_tAOnhhVZZiZ93VJVxELdwEw3npoJFWoqPKYgCPrPOt4X5YvyOQn82-UBJCUmXbPEJSGWK6gERFKLygi48afODQc-c9s5GnWJKT2Z5OQ608RJm9ZgDzzr7jk6nVJm-6gI9UJ4AUwFxlBTY4D6_uATPJNycD4EqJ7Wu9_jOBhW2Oek84fU9XzYrodTRpfwSmr5-g4mblM_1_r_hxrtIG4y22Gjt-qbRnAaIAnhehF5Z-9K82CQ7x95gLQXC1tzs-AWtv3upLjBqVM_mDiERlztNE08qJZ7o8etRJU9j5m1xFHPk9MF7vrNh2QdkL7JTYkNBoOEB-z-LfF4SJ2vlftFMvhiyxxnQ0YYmzjyBD5utjm5Tn-oZZ3umDmxQuc08yy2K_t21Pf8bTgMLKDs8RUdC6hxLgmNOy7fa1w2lYU7-NhjiZATNNqJ9WTTBoJxUqux290jXtPC2zzJcqFniV5DA4vdYWcFCHQAglPAUe3W5FfiLJ4CVZ4Sd6Kfb7euKVAG7DvuVxF7BwCQspBI8O31L9F0dKp2t-W9YBB0xjRbrQOnVOSPuTQdc1O4-R1OLz7Vr1BzKsNBBwSzt8ejqed3rpnpdrbm-rUJBj3UD7UGJgAYDeFIgNuB1i5MWd5dzfcQMXGQ_a8WGOCKGbXeLZC7WOoU

import requests
import json

baseUrl = 'https://www.robotevents.com/api/v2/events?region=Washington&myEvents=false&page=1&per_page=1000'
headers = {
    'accept': 'application/json',
    'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiODU4MTYxMzQ1MmUyMjE2YjE5MWEwY2Q5NjVkMmE4YThkNWZkYjZhNjI4ZWEwNjM3YzMyNjM1OWVkMmRiZWU3ODdjMjBiNDcyMDhiM2ZkMjUiLCJpYXQiOjE3MDIxMDAyNDguNDA4MjA1LCJuYmYiOjE3MDIxMDAyNDguNDA4MjA3OSwiZXhwIjoyNjQ4ODcxNDQ4LjM5OTk1OTEsInN1YiI6IjkwODM3Iiwic2NvcGVzIjpbXX0.Tk_BPVkoN42aEdJDMH_tAOnhhVZZiZ93VJVxELdwEw3npoJFWoqPKYgCPrPOt4X5YvyOQn82-UBJCUmXbPEJSGWK6gERFKLygi48afODQc-c9s5GnWJKT2Z5OQ608RJm9ZgDzzr7jk6nVJm-6gI9UJ4AUwFxlBTY4D6_uATPJNycD4EqJ7Wu9_jOBhW2Oek84fU9XzYrodTRpfwSmr5-g4mblM_1_r_hxrtIG4y22Gjt-qbRnAaIAnhehF5Z-9K82CQ7x95gLQXC1tzs-AWtv3upLjBqVM_mDiERlztNE08qJZ7o8etRJU9j5m1xFHPk9MF7vrNh2QdkL7JTYkNBoOEB-z-LfF4SJ2vlftFMvhiyxxnQ0YYmzjyBD5utjm5Tn-oZZ3umDmxQuc08yy2K_t21Pf8bTgMLKDs8RUdC6hxLgmNOy7fa1w2lYU7-NhjiZATNNqJ9WTTBoJxUqux290jXtPC2zzJcqFniV5DA4vdYWcFCHQAglPAUe3W5FfiLJ4CVZ4Sd6Kfb7euKVAG7DvuVxF7BwCQspBI8O31L9F0dKp2t-W9YBB0xjRbrQOnVOSPuTQdc1O4-R1OLz7Vr1BzKsNBBwSzt8ejqed3rpnpdrbm-rUJBj3UD7UGJgAYDeFIgNuB1i5MWd5dzfcQMXGQ_a8WGOCKGbXeLZC7WOoU'
}
combined_data = []
for i in range(1, 4):
    url = f'https://www.robotevents.com/api/v2/events?region=Washington&myEvents=false&page={i}&per_page=1000'
    print(i)
    response = requests.get(url, headers=headers)
    # Check if the request was successful (status code 200)
    if response.status_code == 200:
        combined_data += response.json().get('data', [])
            
        print('JSON page added')
    else:
        print(f'Request failed with status code: {response.status_code}')

combined_json = {"data": combined_data}
with open('data/washington.json', 'w') as json_file:
    json.dump(combined_json, json_file, indent=4)
    print("JSON combined")