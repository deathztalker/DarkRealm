import urllib.request
import re

urls = [
    'https://opengameart.org/content/84-free-rpg-beings-and-monsters',
    'https://opengameart.org/content/rpg-monsters-2',
    'https://opengameart.org/content/monster-sprites-by-kemono'
]

for url in urls:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        links = re.findall(r'href=[\'\"]([^\'\"]+\.zip)[\'\"]', html)
        print(f"Links for {url}:")
        for l in links: 
            print("  " + l)
    except Exception as e:
        pass
