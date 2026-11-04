"""Read-only supplier PDF inspection; preserve originals and extract labelled assets."""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image
import pypdfium2 as pdfium
from pypdf import PdfReader
import pdfplumber

base = Path('docs/seo-growth/evidence/2026-11-03-supplier-gaps')
if '--decode-only' in sys.argv:
    for item in json.loads((base / 'PDF_REVIEW.json').read_text()):
        document = pdfium.PdfDocument(base / 'raw' / (item['sha256'] + '.pdf'))
        for page in item['pages']:
            for image in page['images']:
                source = Path(image['file'])
                if source.suffix == '.jp2':
                    assert hashlib.sha256(source.read_bytes()).hexdigest() == image['sha256']
                    position = next(p for p in page['imageLayout'] if p['objectId'] == image['objectId'])
                    pdf_page = document[page['page']-1]
                    matches = [obj for obj in pdf_page.get_objects(filter=[pdfium.raw.FPDF_PAGEOBJ_IMAGE]) if abs(obj.get_bounds()[0]-position['x0']) < .01 and abs(pdf_page.get_height()-obj.get_bounds()[3]-position['top']) < .01]
                    assert len(matches) == 1
                    # PDFium applies the document's colour-space conversion and masks.
                    # No manual colour adjustment, crop or creative reconstruction.
                    matches[0].get_bitmap(render=True, scale_to_original=True).to_pil().save(source.with_suffix('.png'))
        document.close()
    print('Exact embedded JP2 images decoded through PDFium colour management; no colour filters')
    raise SystemExit(0)
records = [r for name in ['DOCUMENT_CAPTURE.json', 'HISTORICAL_BROCHURES.json'] for r in json.loads((base / name).read_text())['records'] if r.get('contentType', '').startswith('application/pdf') and r['status'] == 200]
results = []
for record in records:
    source = Path(record['file'])
    assert hashlib.sha256(source.read_bytes()).hexdigest() == record['sha256']
    reader = PdfReader(source)
    output = base / 'pdf-review' / record['sha256']
    output.mkdir(parents=True, exist_ok=True)
    pages = []
    document = pdfium.PdfDocument(source)
    for i, page in enumerate(reader.pages):
        value = page.extract_text() or ''
        (output / f'page-{i+1}.txt').write_text(value)
        images = []
        if any(word in record['url'].lower() for word in ['brochure', 'swish-native']):
            folder = output / f'page-{i+1}-images'
            folder.mkdir(exist_ok=True)
            for index, image in enumerate(page.images):
                destination = folder / f'{index:02d}-{image.name}'
                destination.write_bytes(image.data)
                images.append({'file': str(destination), 'objectId': image.indirect_reference.idnum if image.indirect_reference else None, 'width': image.image.width, 'height': image.image.height, 'sha256': hashlib.sha256(image.data).hexdigest()})
        render = output / f'page-{i+1}.png'
        # Complete small sheets and brochures; first two pages of long reports.
        if len(reader.pages) <= 6 or i < 2 or 'Brochure' in record['url']:
            document[i].render(scale=1.5).to_pil().save(render)
        pages.append({'page': i+1, 'textFile': str(output / f'page-{i+1}.txt'), 'render': str(render) if render.exists() else None, 'images': images})
    document.close()
    with pdfplumber.open(source) as layout:
        for i, page in enumerate(layout.pages):
            if pages[i]['images']:
                pages[i]['imageLayout'] = [{'objectId': im['stream'].objid, 'name': im['name'], 'x0': im['x0'], 'top': im['top'], 'bottom': im['bottom']} for im in page.images]
    results.append({'source': record['url'], 'sha256': record['sha256'], 'pages': pages})
(base / 'PDF_REVIEW.json').write_text(json.dumps(results, indent=2))
print(json.dumps([{'source': r['source'], 'pages': len(r['pages']), 'images': sum(len(p['images']) for p in r['pages'])} for r in results], indent=2))
