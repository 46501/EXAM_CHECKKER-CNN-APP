import requests
url = 'http://127.0.0.1:8000/evaluate/mcq'
try:
    resp = requests.post(url, data={'config': 'invalid json'})
    print('STATUS:', resp.status_code)
    print('BODY:', resp.text)
except Exception as e:
    print('ERROR:', e)
