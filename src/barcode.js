// Barcode scanning and product lookup.
//
// Scanning uses the browser's Barcode Detection API where it exists (it is
// experimental and missing from some major browsers, per MDN). Elsewhere it
// loads the `barcode-detector` ponyfill, which runs ZXing in WebAssembly;
// it is vendored in /vendor so scanning works offline.
// https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API
// https://github.com/Sec-ant/barcode-detector
//
// Products are looked up in Open Food Facts, a free, open database (ODbL).
// Reads need no account; product reads are limited to 15 per minute.
// https://openfoodfacts.github.io/openfoodfacts-server/api/

import { normalizeName, normalizeUnit } from './units.js';

const PONYFILL_URL = new URL('../vendor/barcode-detector/ponyfill.js', import.meta.url).href;
const WASM_URL = new URL('../vendor/barcode-detector/zxing_reader.wasm', import.meta.url).href;
const OFF_URL = 'https://world.openfoodfacts.org/api/v2/product/';
const OFF_FIELDS = 'product_name,product_name_en,brands,quantity,product_quantity,product_quantity_unit';
export const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

// "1.89 L", "500 g", "12 x 355 ml", "1kg" -> { qty, unit } in units.js terms.
export function parseQuantity(text) {
  const match = String(text || '').toLowerCase().replace(',', '.').match(/(?:(\d+)\s*[x×]\s*)?(\d+(?:\.\d+)?)\s*(kg|g|mg|l|litres?|liters?|ml|cl|lb|lbs|oz)\b/);
  if (!match) return null;
  const count = match[1] ? Number(match[1]) : 1;
  let qty = Number(match[2]) * count;
  let unit = match[3];
  if (unit === 'mg') { qty /= 1000; unit = 'g'; }
  if (unit === 'cl') { qty *= 10; unit = 'ml'; }
  try {
    return { qty, unit: normalizeUnit(unit) };
  } catch {
    return null;
  }
}

// Pick the price-catalogue item whose name (or alias) appears in the
// product name, preferring the longest match: "Natrel 2% Milk" -> "milk".
export function matchCatalog(productName, catalog) {
  const words = ` ${normalizeName(productName).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).map(normalizeName).join(' ')} `;
  let best = null;
  for (const entry of catalog) {
    for (const name of [entry.key, ...(entry.aliases || [])]) {
      const n = normalizeName(name);
      if (words.includes(` ${n} `) && (!best || n.length > best.length)) best = { key: entry.key, length: n.length };
    }
  }
  return best?.key ?? null;
}

export function productFromOff(code, json, catalog) {
  if (!json || json.status !== 1 || !json.product) return null;
  const p = json.product;
  const name = (p.product_name_en || p.product_name || '').trim();
  if (!name) return null;
  let size = null;
  if (p.product_quantity && p.product_quantity_unit) size = parseQuantity(`${p.product_quantity} ${p.product_quantity_unit}`);
  if (!size) size = parseQuantity(p.quantity);
  return {
    code,
    name,
    brand: (p.brands || '').split(',')[0].trim(),
    qty: size?.qty ?? 1,
    unit: size?.unit ?? 'ea',
    key: matchCatalog(name, catalog),
    source: 'Open Food Facts',
  };
}

// Look a barcode up, using what you saved for it before when possible.
export async function lookupBarcode(code, state, catalog, fetchImpl = globalThis.fetch.bind(globalThis)) {
  const clean = String(code).replace(/\D/g, '');
  if (!clean) throw new Error('That barcode has no digits');
  if (state.barcodes?.[clean]) return { ...state.barcodes[clean], cached: true };
  const res = await fetchImpl(`${OFF_URL}${clean}?fields=${OFF_FIELDS}`);
  if (res.status === 404) return null;
  if (res.status === 429) throw new Error('Open Food Facts is rate limiting lookups; wait a minute and try again.');
  if (!res.ok) throw new Error(`Product lookup failed (${res.status})`);
  return productFromOff(clean, await res.json(), catalog);
}

export function rememberBarcode(state, product) {
  state.barcodes[product.code] = {
    code: product.code, name: product.name, brand: product.brand || '', qty: product.qty, unit: product.unit, key: product.key || null,
  };
}

async function detectorClass() {
  if ('BarcodeDetector' in globalThis) {
    const supported = await globalThis.BarcodeDetector.getSupportedFormats();
    if (FORMATS.some((f) => supported.includes(f))) return globalThis.BarcodeDetector;
  }
  const mod = await import(PONYFILL_URL);
  mod.setZXingModuleOverrides({ locateFile: (path, prefix) => (path.endsWith('.wasm') ? WASM_URL : prefix + path) });
  return mod.BarcodeDetector;
}

// Open the rear camera in `video` and resolve with the first barcode seen.
// Call the returned stop() to cancel.
export function startScanner(video) {
  let stopped = false;
  let stream = null;
  const stop = () => {
    stopped = true;
    stream?.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
  };
  const result = (async () => {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser cannot use the camera. Type the barcode number instead.');
    const Detector = await detectorClass();
    const detector = new Detector({ formats: FORMATS });
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    video.srcObject = stream;
    await video.play();
    while (!stopped) {
      const codes = await detector.detect(video).catch(() => []);
      if (codes.length) {
        const value = codes[0].rawValue;
        stop();
        return value;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    return null;
  })();
  result.catch(stop);
  return { result, stop };
}
