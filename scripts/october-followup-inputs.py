"""Read only the named Oz exports. Keep all private derived evidence ignored by Git."""
import csv, hashlib, json, re
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET
from urllib.parse import urlsplit

root = Path(__file__).resolve().parents[1]
audit = Path('/Users/daibang/Documents/Codex/2026-10-07/referenced-chatgpt-conversation-this-is-an/outputs')
downloads = Path('/Users/daibang/Downloads')
out = root / 'docs/migration-october-2026-followup/private'
out.mkdir(parents=True, exist_ok=True)
sources, routes = [], {}

def route(value):
    if not value or value in ('(not set)', '(other)'): return None
    u = urlsplit(value if value.startswith('http') else 'https://oztimberfloor.com.au' + value)
    if u.hostname not in ('oztimberfloor.com.au', 'www.oztimberfloor.com.au'): return None
    p = u.path or '/'
    if not p.startswith('/'): return None
    # Queries are deliberately not persisted: they can contain contact details.
    return p if '.' in p.rsplit('/', 1)[-1] or p.endswith('/') else p + '/'

def add(value, evidence):
    p = route(value)
    if p: routes.setdefault(p, []).append(evidence)

def read_csv(file, ga=False):
    content = file.read_text(encoding='utf-8-sig')
    if ga: assert '# Account: oztimberfloor.com.au' in content
    rows = list(csv.DictReader(line for line in content.splitlines() if line.strip() and not line.startswith('#')))
    sources.append({'name': file.name, 'sha256': hashlib.sha256(file.read_bytes()).hexdigest(), 'rows': len(rows), 'comments': [l for l in content.splitlines() if l.startswith('#')]})
    return rows

inventory = read_csv(audit / 'source-inventory.csv')
for name in ['priority-url-review.csv', 'migration-url-checks.csv', 'sitemap-url-checks.csv']:
    rows = read_csv(audit / name)
    for row in rows:
        add(row.get('legacy_path') or row.get('path'), {'source': name, 'kind': 'dated-audit-observation', 'status': row.get('status') or row.get('staging_status')})
scope = (audit / 'audit-scope-and-limitations.txt').read_text()
sources.append({'name':'audit-scope-and-limitations.txt','sha256':hashlib.sha256(scope.encode()).hexdigest()})

ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def xlsx(file):
    with ZipFile(file) as z:
        shared = []
        if 'xl/sharedStrings.xml' in z.namelist():
            shared = [''.join(t.itertext()) for t in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',ns)]
        rels = {r.attrib['Id']:r.attrib['Target'].lstrip('/') for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        sheets = {}
        for sheet in ET.fromstring(z.read('xl/workbook.xml')).findall('s:sheets/s:sheet',ns):
            target = rels[sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
            if not target.startswith('xl/'): target = 'xl/' + target
            rows = []
            for row in ET.fromstring(z.read(target)).findall('s:sheetData/s:row', ns):
                values = []
                for cell in row:
                    letters = re.match(r'[A-Z]+', cell.attrib['r']).group()
                    index = 0
                    for c in letters: index = index * 26 + ord(c) - 64
                    while len(values) < index: values.append('')
                    v = cell.find('s:v', ns)
                    val = v.text if v is not None else ''.join(cell.find('s:is',ns).itertext()) if cell.find('s:is',ns) is not None else ''
                    values[index-1] = shared[int(val)] if cell.attrib.get('t') == 's' else val
                rows.append(values)
            sheets[sheet.attrib['name']] = rows
        return sheets

totals = []
for item in inventory:
    file = downloads / item['file']
    if file.suffix == '.csv':
        rows = read_csv(file, ga=True)
        period = re.search(r'# Start date: (\d+)\n# End date: (\d+)', file.read_text()).groups()
        sums = {k:sum(float(r.get(k) or 0) for r in rows) for k in ['Sessions','Key events','Event count'] if rows and k in rows[0]}
        totals.append({'source':file.name,'period':period,'totals':sums})
        for r in rows:
            if 'Landing page' in r:
                add(r['Landing page'], {'source':file.name, 'period':period, 'kind':'GA4 landing export; filter undocumented', 'sessions':r.get('Sessions'), 'key_events':r.get('Key events')})
    else:
        assert file.name.startswith('https___oztimberfloor.com.au_-Performance-on-Search-2026-10-07')
        sheets = xlsx(file)
        sources.append({'name':file.name,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'sheetRows':{k:len(v)-1 for k,v in sheets.items()},'filters':sheets.get('Filters')})
        header, *rows = sheets['Pages']
        for values in rows:
            r = dict(zip(header,values))
            add(values[0], {'source':file.name,'kind':'GSC pages; periods overlap, not summed','clicks':r.get('Clicks'),'impressions':r.get('Impressions'),'historical_average_position':r.get('Position')})
        chart = sheets['Chart']
        totals.append({'source':file.name,'totals':{k:sum(float(dict(zip(chart[0],r)).get(k) or 0) for r in chart[1:]) for k in ['Clicks','Impressions']}})
for suffix in ['Top target pages','Latest links','More sample links']:
    file = downloads / f'https___oztimberfloor.com.au_-{suffix}-2026-05-18.csv'
    if file.exists():
        for row in read_csv(file):
            for value in row.values():
                if value.startswith(('https://oztimberfloor.com.au','http://oztimberfloor.com.au','https://www.oztimberfloor.com.au')):
                    add(value, {'source':file.name,'kind':'historical internal-link target export' if suffix == 'Top target pages' else 'historical backlink target'})
result={'sources':sources,'totals':totals,'routes':routes,'caveats':['Missing row is unknown, not zero traffic/backlinks.','GA4 organic landing CSV metadata does not document filters.','Acquisition (2)/(3) populations unresolved; not labelled google/organic.','Overlapping GSC periods are not summed.','Historical average position is not current ranking.','No customer fields or URL queries copied.']}
(out/'input-evidence.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'sources':len(sources),'uniquePaths':len(routes),'totals':totals},indent=2))
