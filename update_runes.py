import re
import os

filepath = r'c:\Users\Death\.gemini\antigravity\scratch\dark-realm\src\data\items.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

def repl(m):
    rune_name = m.group(1)
    return m.group(0).replace("item_rune_base", f"item_rune_{rune_name}")

content = re.sub(r'rune_([a-z]+):\s*{(.*?)icon:\s*\'item_rune_base\'', repl, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated rune icons successfully.")
