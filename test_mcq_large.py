import requests
import json
url = 'http://127.0.0.1:8000/evaluate/mcq'
files = {'file': ('test.jpg', b'0' * (5 * 1024 * 1024), 'image/jpeg')}
data = {'config': json.dumps([{'q': 1, 'answer': 'A', 'marks': 1, 'negative': 0}])}
try:
    resp = requests.post(url, files=files, data=data)
    print('STATUS:', resp.status_code)
    print('HEADERS:', resp.headers)
    print('BODY:', resp.text)
except Exception as e:
    print('ERROR:', e)
