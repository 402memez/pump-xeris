import re

with open('public/index.html', 'r') as f:
    html = f.read()

# 1. Remove the Emergent tracking script
html = re.sub(r'[ \t]*<script[^>]*emergent-main\.js[^>]*></script>\n?', '', html)

# 2. Remove the massive watermark HTML block
html = re.sub(r'[ \t]*<a[^>]*id="emergent-badge"[^>]*>.*?</a>\n?', '', html, flags=re.DOTALL)

with open('public/index.html', 'w') as f:
    f.write(html)
