import requests, json
url = 'http://127.0.0.1:8000/evaluate/mcq'
files = {'file': ('dummy.png', b'fake_image_bytes', 'image/png')}
data = {'config': json.dumps([{'q': 1, 'answer': 'A', 'marks': 1, 'negative': 0}])}
try:
    resp = requests.post(url, files=files, data=data)
    print('STATUS:', resp.status_code)
    print('BODY:', resp.text)
except Exception as e:
    print('ERROR:', e)
