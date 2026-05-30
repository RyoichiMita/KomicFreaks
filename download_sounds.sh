#!/bin/bash
mkdir -p public/sounds/anime
cd public/sounds/anime

curl -s "https://www.myinstants.com/en/search/?name=one%20piece" \
  | grep -oE "onclick=\"play\('/media/sounds/[^']+'" \
  | cut -d "'" -f 2 \
  | head -n 12 > /tmp/urls.txt

echo "Downloading..."
while read url; do
  file=$(basename "$url")
  echo "Downloading $file"
  curl -s -O "https://www.myinstants.com$url"
done < /tmp/urls.txt

echo "Done downloading"
