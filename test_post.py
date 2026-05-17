import requests
import json

data = {
    "short_description": "Test Issue",
    "location": "Terminal 1",
    "area": "Gate 5",
    "department": "Facilities",
    "reported_via": "App",
    "reporter_phone": "+1234567890"
}
res = requests.post('http://localhost:8000/api/incidents/', json=data)
print(res.status_code)
print(res.text)
