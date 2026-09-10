import json
import os

filepath = os.path.expanduser('~/.claude/settings.json')
data = {}
if os.path.exists(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
            if content.strip():
                data = json.loads(content)
    except Exception as e:
        print("Error reading JSON:", e)

if 'env' not in data:
    data['env'] = {}

data['env']['ANTHROPIC_BASE_URL'] = 'https://openrouter.ai/api'
data['env']['ANTHROPIC_AUTH_TOKEN'] = 'YOUR_API_KEY_HERE'
data['env']['ANTHROPIC_API_KEY'] = ''
data['env']['ANTHROPIC_MODEL'] = 'openrouter/free'
data['model'] = 'sonnet[1m]'

with open(filepath, 'w') as f:
    json.dump(data, f, indent=2)

print("FILE_UPDATED")
with open(filepath, 'r') as f:
    print(f.read())
