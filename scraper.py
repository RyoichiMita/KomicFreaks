import urllib.request
import re
import os
import ssl
import json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://www.myinstants.com/en/search/?name=one%20piece"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
html = urllib.request.urlopen(req, context=ctx).read().decode("utf-8")

pattern = r"onclick=\"play\('(/media/sounds/[^']+)'[^\"]*\" title=\"Play ([^\"]+)\""
matches = re.findall(pattern, html, re.IGNORECASE)

out_dir = "public/sounds/anime"
os.makedirs(out_dir, exist_ok=True)

count = 0
results = []
for mp3_path, title in matches:
    if count >= 12: break
    full_url = "https://www.myinstants.com" + mp3_path
    filename = mp3_path.split("/")[-1]
    title = title.replace("Play", "").replace("sound", "").replace("effect", "").strip()
    
    filepath = os.path.join(out_dir, filename)
    try:
        if not os.path.exists(filepath):
            urllib.request.urlretrieve(full_url, filepath)
        print(f"Downloaded: {title} -> {filename}")
        results.append({"label": title, "file": f"/sounds/anime/{filename}"})
        count += 1
    except Exception as e:
        print(f"Failed {filename}: {e}")

with open("sounds_data.json", "w") as f:
    json.dump(results, f, indent=2)

print("Saved to sounds_data.json")
