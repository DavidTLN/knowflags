"""Turn data/wikidata/{history,regions}.json into chunked SQL for Supabase.

Usage: python3 scripts/wikidata/to_sql.py <out_dir> [chunk_size]
Writes history_NN.sql, countries.sql and regions_NN.sql. Existing rows are never overwritten:
history entries overlapping an existing period (±1 year on both ends) are skipped, regions use
ON CONFLICT (slug) DO NOTHING.
"""
import json
import os
import sys
from fractions import Fraction

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
COMMON = ['1:1', '2:3', '1:2', '3:5', '3:4', '4:5', '5:8', '4:7', '7:10', '10:19', '11:18', '5:7', '8:11',
          '7:11', '9:14', '13:15', '6:7', '18:25', '28:37', '17:26']


def q(s):
    return 'NULL' if s is None else "'" + str(s).replace("'", "''") + "'"


def cap(s):
    return s[:1].upper() + s[1:] if s else s


def ratio(w, h):
    if not w or not h:
        return None
    r = h / w
    for c in COMMON:
        a, b = map(int, c.split(':'))
        if abs(a / b - r) / r < 0.015:
            return c
    f = Fraction(r).limit_denominator(40)
    return f'{f.numerator}:{f.denominator}'


def credit(r):
    lic = r.get('license') or 'see Commons'
    art = r.get('artist') or 'Wikimedia Commons contributors'
    return f"{lic} — {art}"


def history(recs):
    out, seen = [], []
    for r in sorted(recs, key=lambda r: (r['iso'], r['date_start'] or '', 0 if (r.get('image_url') or '').endswith('.svg') else 1)):
        if not r.get('image_url') or not r.get('date_start') or not r.get('date_end'):
            continue
        ys, ye = r['year_start'], r['year_end']
        if ys is None or ye is None or ye < ys:
            continue
        if any(i == r['iso'] and abs(a - ys) <= 1 and abs(b - ye) <= 1 for i, a, b in seen):
            continue
        seen.append((r['iso'], ys, ye))
        span = f'{ys}–{ye}'
        fname = os.path.splitext(r.get('file') or '')[0]
        le = r.get('label_en') or (fname if fname.lower().startswith('flag') else f'Flag ({span})')
        lf = cap(r.get('label_fr')) or f'Drapeau ({span})'
        ne = f"Source: Wikimedia Commons ({credit(r)}). {r.get('page') or ''}".strip()
        nf = f"Source : Wikimedia Commons ({credit(r)}). {r.get('page') or ''}".strip()
        out.append(f"({q(r['iso'])},{q(r['image_url'])},{q(r['date_start'])}::date,{q(r['date_end'])}::date,"
                   f"{q(le)},{q(lf)},{q(ne)},{q(nf)})")
    return out


HIST_SQL = """insert into country_flag_history (iso_code, image_url, date_start, date_end, label_en, label_fr, notes_en, notes_fr)
select v.* from (values
{rows}
) v(iso, img, ds, de, le, lf, ne, nf)
where not exists (
  select 1 from country_flag_history h
  where h.iso_code = v.iso
    and h.date_start is not null
    and abs(extract(year from h.date_start) - extract(year from v.ds)) <= 1
    and abs(coalesce(extract(year from h.date_end), 9999) - extract(year from v.de)) <= 1);"""

COUNTRIES_SQL = """insert into flag_taxonomy (slug, name_en, name_fr, flag_type, image_path, iso_code, metadata)
select trim(both '-' from lower(regexp_replace(translate(c.name_en, 'ÅåÉéÍíÓóÚúÇçãÃõôêèÖöÜüÄä''', 'AaEeIiOoUuCcaAooeeOoUuAa '), '[^a-zA-Z0-9]+', '-', 'g'))),
       c.name_en, c.name_fr, 'country', 'https://flagcdn.com/' || c.iso_code || '.svg', c.iso_code,
       jsonb_build_object('iso2', c.iso_code, 'continent', c.region)
from countries c
where c.iso_code in ({isos})
  and not exists (select 1 from flag_taxonomy t where t.flag_type = 'country' and t.iso_code = c.iso_code)
on conflict (slug) do nothing;
update flag_taxonomy set country_id = id where flag_type = 'country' and country_id is null;"""

REG_SQL = """insert into flag_taxonomy (slug, name_en, name_fr, flag_type, image_path, parent_id, country_id, iso_code, sort_order, metadata)
select v.slug, v.en, v.fr, 'region', v.img, n.id, n.id, null, v.ord, v.meta::jsonb
from (values
{rows}
) v(iso, slug, en, fr, img, ord, meta)
join flag_taxonomy n on n.flag_type = 'country' and n.iso_code = v.iso
on conflict (slug) do nothing;"""


def regions(recs):
    out, slugs = [], set()
    by = {}
    for r in recs:
        by.setdefault(r['iso'], []).append(r)
    for iso, lst in by.items():
        lst.sort(key=lambda r: r['name_en'].lower())
        for i, r in enumerate(lst, 1):
            slug = r['slug']
            n = 2
            while slug in slugs:
                slug = f"{r['slug']}-{n}"
                n += 1
            slugs.add(slug)
            meta = {'source': 'wikidata', 'wikidata': r['qid']}
            if r.get('code'):
                meta['abbr'] = r['code'].split('-', 1)[-1]
                meta['iso_3166_2'] = r['code']
            if r.get('capital_en'):
                meta['capital_en'] = r['capital_en']
            if r.get('population'):
                meta['population'] = r['population']
            if r.get('image_path'):
                rt = ratio(r.get('width'), r.get('height'))
                if rt:
                    meta['ratio'] = rt
                meta['license'] = r.get('license')
                meta['author'] = r.get('artist')
                meta['commons'] = r.get('page')
            out.append((iso, f"({q(iso)},{q(slug)},{q(cap(r['name_en']))},{q(cap(r['name_fr']))},"
                             f"{q(r.get('image_path'))},{i},{q(json.dumps(meta, ensure_ascii=False))})"))
    return out


def main():
    out_dir = sys.argv[1]
    size = int(sys.argv[2]) if len(sys.argv) > 2 else 150
    os.makedirs(out_dir, exist_ok=True)
    d = os.path.join(ROOT, 'data', 'wikidata')
    hp, rp = os.path.join(d, 'history.json'), os.path.join(d, 'regions.json')
    if os.path.exists(hp):
        rows = history(json.load(open(hp)))
        for k in range(0, len(rows), size):
            open(os.path.join(out_dir, f'history_{k // size:02d}.sql'), 'w').write(
                HIST_SQL.format(rows=',\n'.join(rows[k:k + size])))
        print('history rows', len(rows))
    if os.path.exists(rp):
        rows = regions(json.load(open(rp)))
        isos = sorted({i for i, _ in rows})
        open(os.path.join(out_dir, 'countries.sql'), 'w').write(
            COUNTRIES_SQL.format(isos=','.join(q(i) for i in isos)))
        vals = [r for _, r in rows]
        for k in range(0, len(vals), size):
            open(os.path.join(out_dir, f'regions_{k // size:02d}.sql'), 'w').write(
                REG_SQL.format(rows=',\n'.join(vals[k:k + size])))
        print('region rows', len(vals), 'countries', len(isos))


if __name__ == '__main__':
    main()
