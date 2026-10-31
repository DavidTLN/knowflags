"""Download specific Commons files (reference rasters) listed one title per line."""
import os
import sys
import time

from fetch_commons import imageinfo, safe, S, OUT

titles = [l.strip() for l in open(sys.argv[1]) if l.strip()]
info = imageinfo(['File:' + t if not t.startswith('File:') else t for t in titles])
os.makedirs(f'{OUT}/ref', exist_ok=True)
for t, m in info.items():
    if not m.get('url'):
        print('missing', t)
        continue
    url = m['url']
    if m.get('mime', '').startswith('image/') and not url.endswith('.svg') and (m.get('width') or 0) > 2000:
        # use a 2000px thumbnail for big rasters
        j = S.get('https://commons.wikimedia.org/w/api.php', params=dict(action='query', titles=t, prop='imageinfo',
                  iiprop='url', iiurlwidth=2000, format='json', formatversion=2), timeout=60).json()
        url = j['query']['pages'][0]['imageinfo'][0].get('thumburl', url)
    if m.get('mime') == 'application/pdf':
        continue
    r = S.get(url, timeout=120)
    ext = os.path.splitext(url)[1] or '.bin'
    name = safe(t)
    if not name.lower().endswith(ext.lower()):
        name += ext
    open(f'{OUT}/ref/{name}', 'wb').write(r.content)
    print('ok', t, r.status_code, len(r.content))
    time.sleep(0.5)
