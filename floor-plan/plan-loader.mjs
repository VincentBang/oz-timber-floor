const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_SOURCE_PIXELS = 32_000_000;
const MAX_SOURCE_EDGE = 16_384;
const MAX_CANVAS_PIXELS = 8_000_000;
const MAX_CANVAS_EDGE = 4096;
const MAX_PAGES = 30;
const PDF_ASSETS = new URL('./vendor/pdfjs-6.5.438/', import.meta.url);
const INVALID_IMAGE = 'This image is incomplete or damaged. Export it again as JPG or PNG.';
const INVALID_PDF = 'This PDF could not be drawn. Try an unlocked PDF or a JPG or PNG export.';

class PlanError extends Error {}

function checkDimensions(width, height) {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) {
    throw new PlanError(INVALID_IMAGE);
  }
  if (width > MAX_SOURCE_EDGE || height > MAX_SOURCE_EDGE || width * height > MAX_SOURCE_PIXELS) {
    throw new PlanError('This image is too large to open safely. Export a smaller plan (up to 32 megapixels and 16,384 pixels per side).');
  }
}

// Inspect dimensions before asking a browser decoder to allocate pixel memory.
function inspectPng(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 33 || view.getUint32(8) !== 13 || view.getUint32(12) !== 0x49484452) {
    throw new PlanError(INVALID_IMAGE);
  }
  checkDimensions(view.getUint32(16), view.getUint32(20));
  let sawData = false;
  for (let pos = 8; pos + 12 <= bytes.length;) {
    const size = view.getUint32(pos), chunk = view.getUint32(pos + 4);
    if (pos + size + 12 > bytes.length) break;
    if (chunk === 0x6163544c) throw new PlanError('Animated PNG plans are not supported. Export a single still image.');
    if (chunk === 0x49444154) sawData = true;
    if (chunk === 0x49454e44 && !size && sawData && pos + 12 === bytes.length) return;
    pos += size + 12;
  }
  throw new PlanError(INVALID_IMAGE);
}

function inspectJpeg(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 4 || view.getUint16(bytes.length - 2) !== 0xffd9) throw new PlanError(INVALID_IMAGE);
  for (let pos = 2; pos + 4 < bytes.length;) {
    if (bytes[pos] !== 0xff) break;
    while (pos < bytes.length && bytes[pos] === 0xff) pos++;
    const marker = bytes[pos++];
    if (marker === 0xda || marker === 0xd9 || pos + 2 > bytes.length) break;
    const length = view.getUint16(pos);
    if (length < 2 || pos + length > bytes.length) break;
    if ([0xc0, 0xc1, 0xc2].includes(marker) && length >= 8) {
      checkDimensions(view.getUint16(pos + 5), view.getUint16(pos + 3));
      if (bytes[pos + 7] === 4) {
        throw new PlanError('This JPG uses print colour (CMYK). Export it as an RGB/sRGB JPG or PNG, then choose the exported file.');
      }
      return;
    }
    pos += length;
  }
  throw new PlanError('This JPG is incomplete or uses an unsupported format. Export a standard JPG or PNG.');
}

function identify(bytes, file) {
  const starts = signature => signature.every((value, index) => bytes[index] === value);
  let type;
  if (starts([137, 80, 78, 71, 13, 10, 26, 10])) type = 'png';
  else if (starts([255, 216, 255])) type = 'jpeg';
  else if (starts([37, 80, 68, 70, 45])) type = 'pdf';
  else throw new PlanError('Choose a genuine JPG, PNG or PDF file.');

  const mime = file.type.toLowerCase();
  const allowedMime = { png: ['image/png'], jpeg: ['image/jpeg', 'image/jpg', 'image/pjpeg'], pdf: ['application/pdf'] };
  const hasExtension = typeof file.name === 'string' && file.name.includes('.');
  const extension = hasExtension ? file.name.split('.').pop().toLowerCase() : undefined;
  const namedType = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', pdf: 'pdf' }[extension];
  if ((mime && mime !== 'application/octet-stream' && !allowedMime[type].includes(mime)) ||
      (hasExtension && namedType !== type)) throw new PlanError('The file type does not match its contents. Export a new JPG, PNG or PDF.');
  return type;
}

function drawSize(width, height, desiredScale = 1) {
  const scale = Math.min(desiredScale, MAX_CANVAS_EDGE / Math.max(width, height), Math.sqrt(MAX_CANVAS_PIXELS / (width * height)));
  if (!(scale > 0 && Number.isFinite(scale))) throw new PlanError('This page has invalid dimensions.');
  return { width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale)), scale };
}

function canvasOf(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  try {
    if (!canvas.getContext('2d')) throw new PlanError('This browser cannot display a plan canvas. Try a current browser.');
  } catch (error) {
    canvas.width = 0; canvas.height = 0;
    throw error;
  }
  return canvas;
}

async function drawImage(file, signal) {
  const bitmapSupported = typeof createImageBitmap === 'function';
  let bitmap, url, image, canvas;
  const release = () => {
    bitmap?.close();
    if (url) {
      image.removeAttribute('src');
      URL.revokeObjectURL(url);
      url = null;
    }
  };
  signal.addEventListener('abort', release, { once: true });
  try {
    if (bitmapSupported) {
      try {
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      } catch {
        // Some engines reject valid EXIF-oriented JPEGs in their bitmap
        // decoder. Use the native image decoder for the same validated file;
        // never retry a cancelled operation or relax file/size checks.
        signal.throwIfAborted();
      }
    }
    if (!bitmap) {
      image = new Image();
      url = URL.createObjectURL(file);
      image.src = url;
      await image.decode();
    }
    signal.throwIfAborted();
    const width = bitmap ? bitmap.width : image.naturalWidth;
    const height = bitmap ? bitmap.height : image.naturalHeight;
    checkDimensions(width, height);
    const size = drawSize(width, height);
    canvas = canvasOf(size.width, size.height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap || image, 0, 0, canvas.width, canvas.height);
    return { canvas, pageCount: 1, pageNumber: 1 };
  } catch (error) {
    // A failed draw is never returned to the caller, so release its raster
    // allocation here rather than retaining it until garbage collection.
    if (canvas) { canvas.width = 0; canvas.height = 0; }
    throw error;
  } finally {
    signal.removeEventListener('abort', release);
    release();
  }
}

async function drawPdf(bytes, pageNumber, signal) {
  const { getDocument, PDFWorker, AnnotationMode } = await import('./vendor/pdfjs-6.5.438/pdf.min.mjs');
  signal.throwIfAborted();
  // Give each document its own real worker. Terminating it also bounds failed
  // and superseded decodes; do not fall back to parsing on the UI thread.
  const port = new Worker(new URL('pdf.worker.min.mjs', PDF_ASSETS), { type: 'module' });
  const worker = new PDFWorker({ port });
  const asset = name => new URL(name, PDF_ASSETS).href;
  const task = getDocument({
    data: bytes, worker, stopAtErrors: true, enableXfa: false, disableWorkerRendering: true,
    useSystemFonts: false, useWorkerFetch: true, cMapUrl: asset('cmaps/'), cMapPacked: true,
    standardFontDataUrl: asset('standard_fonts/'), wasmUrl: asset('wasm/'), iccUrl: asset('iccs/'),
    maxImageSize: MAX_SOURCE_PIXELS, canvasMaxAreaInBytes: MAX_CANVAS_PIXELS * 4,
  });
  let completed = false;
  const terminated = new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    port.addEventListener('error', () => reject(new PlanError(INVALID_PDF)), { once: true });
  });
  try {
    const doc = await Promise.race([task.promise, terminated]);
    if (doc.numPages > MAX_PAGES) throw new PlanError('This PDF has more than 30 pages. Export the relevant pages as a smaller PDF.');
    if (pageNumber > doc.numPages) throw new PlanError('That page is not in this PDF.');
    const page = await Promise.race([doc.getPage(pageNumber), terminated]);
    const viewport = page.getViewport({ scale: 1 });
    const size = drawSize(viewport.width, viewport.height, 2);
    const canvas = canvasOf(size.width, size.height);
    // Render visible annotation appearances into pixels only; no interactive
    // annotation layer, links, JavaScript actions or editable forms are opened.
    await Promise.race([page.render({ canvas, viewport: page.getViewport({ scale: size.scale }),
      annotationMode: AnnotationMode.ENABLE, background: 'white' }).promise, terminated]);
    completed = true;
    return { canvas, pageCount: doc.numPages, pageNumber };
  } catch (error) {
    if (error?.name === 'PasswordException') throw new PlanError('This PDF is password-protected. Export an unlocked copy or an image.');
    throw error;
  } finally {
    // On cancellation an unresponsive worker cannot acknowledge destroy().
    // Release local resources without waiting for that acknowledgement.
    try {
      const closing = task.destroy().catch(() => {});
      if (completed) await Promise.race([closing, terminated]).catch(() => {});
    } finally {
      worker.destroy();
      port.terminate();
    }
  }
}

export async function loadPlan(file, pageNumber = 1, externalSignal) {
  if (!(file instanceof Blob) || !file.size || file.size > MAX_FILE_BYTES) {
    throw new PlanError('Choose a non-empty plan file of 20 MiB or less.');
  }
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > MAX_PAGES) throw new PlanError('Choose a valid page number from 1 to 30.');
  const controller = new AbortController();
  const cancel = () => controller.abort(new PlanError('Loading this plan was cancelled.'));
  const timer = setTimeout(() => controller.abort(new PlanError('This plan took too long to open. Try a smaller plan or a JPG or PNG export.')), 30_000);
  const signal = controller.signal;
  const aborted = new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
  externalSignal?.addEventListener('abort', cancel, { once: true });
  if (externalSignal?.aborted) cancel();
  let type;
  try {
    const read = async () => {
      signal.throwIfAborted();
      const bytes = new Uint8Array(await file.arrayBuffer());
      signal.throwIfAborted();
      type = identify(bytes, file);
      if (type === 'pdf') return drawPdf(bytes, pageNumber, signal);
      if (pageNumber !== 1) throw new PlanError('An image has only one page.');
      if (type === 'png') inspectPng(bytes);
      else inspectJpeg(bytes);
      return drawImage(file, signal);
    };
    return await Promise.race([read(), aborted]);
  } catch (error) {
    if (error instanceof PlanError) throw error;
    throw new PlanError(type === 'pdf' ? INVALID_PDF : INVALID_IMAGE);
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener('abort', cancel);
  }
}
