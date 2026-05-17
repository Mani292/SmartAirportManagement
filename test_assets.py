import requests
try:
    res = requests.get('http://localhost:8000/api/assets/')
    print(res.status_code)
    print(res.text)
except Exception as e:
    print(e)
