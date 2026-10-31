"""Look up Commons file names that could not be downloaded.

Reads data/history/find.json: ["search terms", ...]
Writes data/history/find_results.json: {"search terms": [file titles...]}
"""
import json
import time

import requests

S = requests.Session()
S.headers.update({'User-Agent': 'KnowFlagsBot/1.0 (https://knowflags.com; historical flags review)'})


def main():
    out = {}
    for q in json.load(open('data/history/find.json')):
        r = S.get('https://commons.wikimedia.org/w/api.php', params=dict(
            action='query', list='search', srsearch=q, srnamespace=6, srlimit=12, format='json'), timeout=60)
        out[q] = [h['title'].replace('File:', '', 1) for h in r.json().get('query', {}).get('search', [])]
        time.sleep(0.5)
    json.dump(out, open('data/history/find_results.json', 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
