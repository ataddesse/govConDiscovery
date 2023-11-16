import requests
import json

# Replace with your server's IP and port
url = "http://localhost:5000/search"

# Replace 'your search text' with the actual query
data = {"query": "radio cables"}

# Make the POST request
response = requests.post(url, json=data)

# Print the response
print(json.dumps(response.json(), indent=4))
