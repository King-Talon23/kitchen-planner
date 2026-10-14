// Receipt scanning: turn a photo of a grocery receipt into store prices, a
// spending entry and inventory additions.
//
// Text recognition runs on the device with Tesseract.js (Apache-2.0), loaded
// from jsDelivr the first time it is used and cached by the browser after.
// https://github.com/naptha/tesseract.js
//
// Receipts abbreviate names ("GRND BF MED"), so matching uses an
// abbreviation list plus anything you confirmed on earlier receipts.

import { normalizeName, toBase, convertBase } from './units.js';
import { today } from './inventory.js';

const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.esm.min.js';

export const KNOWN_STORES = [
  'Food Basics', 'Walmart', 'No Frills', 'FreshCo', 'Metro', 'Loblaws', 'Sobeys', 'Costco', 'Giant Tiger',
  'Real Canadian Superstore', 'Superstore', 'Zehrs', 'Fortinos', 'Save-On-Foods', 'IGA', 'Maxi', 'Provigo',
  'Farm Boy', 'T&T', "Longo's", 'Your Independent Grocer', 'Valu-mart', 'Safeway', 'Co-op', 'Foodland',
  'Shoppers Drug Mart', 'Dollarama', 'Adonis', 'Super C', 'Nations Fresh Foods',
];

// Lines that carry money but are not products.
const NOT_ITEMS = /\b(sub\s*-?total|total|tax|hst|gst|pst|qst|change|cash|visa|master\s*card|mastercard|debit|interac|amex|balance|tender|savings?|you saved|points|optimum|scene|air\s*miles|deposit|discount|coupon|rounding|approved|auth|card|account|loyalty|bottle dep|eco fee)\b/i;

// Common receipt abbreviations -> words used in the price list.
const ABBREVIATIONS = {
  grnd: 'ground', grd: 'ground', gr: 'ground', bf: 'beef', bef: 'beef', chkn: 'chicken', chk: 'chicken', chick: 'chicken',
  brst: 'breast', brs: 'breast', bnls: 'boneless', sknls: 'skinless', thgh: 'thigh', thg: 'thigh', thi: 'thigh',
  drm: 'drumstick', drmstk: 'drumstick', pk: 'pork', prk: 'pork', ln: 'loin', shldr: 'shoulder', stk: 'steak',
  slmn: 'salmon', shrmp: 'shrimp', tna: 'tuna', mlk: 'milk', btr: 'butter', bttr: 'butter', chs: 'cheese', chse: 'cheese',
  ched: 'cheddar', chdr: 'cheddar', yog: 'yogurt', ygt: 'yogurt', yogrt: 'yogurt', crm: 'cream', egg: 'egg', eggs: 'egg', lg: '',
  ban: 'banana', bana: 'banana', bnna: 'banana', appl: 'apple', apl: 'apple', orng: 'orange', lmn: 'lemon',
  avo: 'avocado', avoc: 'avocado', strwb: 'strawberry', strw: 'strawberry', pot: 'potato', pots: 'potato', pota: 'potato',
  swt: 'sweet', tom: 'tomato', toma: 'tomato', cabb: 'cabbage', carr: 'carrot', crt: 'carrot', crts: 'carrot', onio: 'onion',
  onn: 'onion', cel: 'celery', clry: 'celery', cuc: 'cucumber', cuke: 'cucumber', mush: 'mushroom', mshrm: 'mushroom',
  rom: 'romaine', lett: 'lettuce', brocc: 'broccoli', broc: 'broccoli', pep: 'pepper', pepr: 'pepper', ppr: 'pepper',
  frz: 'frozen', froz: 'frozen', mxd: 'mixed', veg: 'vegetables', vegs: 'vegetables', grn: 'green', bns: 'beans',
  brd: 'bread', wht: 'white', pta: 'pita', psta: 'pasta', spag: 'spaghetti', spgt: 'spaghetti', rce: 'rice',
  flr: 'flour', sgr: 'sugar', oil: 'oil', olv: 'olive', pb: 'peanut butter',
  pnt: 'peanut', mayo: 'mayonnaise', ktchp: 'ketchup', ctsp: 'ketchup', cnd: 'canned', sce: 'sauce', sauc: 'sauce', lent: 'lentils', hmms: 'hummus', ckr: 'crackers', crkr: 'crackers',
  cer: 'cereal', crl: 'cereal', cof: 'coffee', cofe: 'coffee', oj: 'orange juice', aj: 'apple juice', jce: 'juice',
  alm: 'almonds', almd: 'almonds', pnts: 'peanuts', tfu: 'tofu',
};

export function parseMoney(text) {
  const m = String(text).replace(/\s/g, '').match(/^-?\$?(\d{1,4})[.,](\d{2})-?$/);
  if (!m) return null;
  const negative = /^-|-$/.test(String(text).trim());
  return (negative ? -1 : 1) * Number(`${m[1]}.${m[2]}`);
}

function findStore(lines) {
  for (const line of lines.slice(0, 8)) {
    const flat = line.toLowerCase().replace(/[^a-z&' -]/g, ' ');
    const store = KNOWN_STORES.find((s) => flat.includes(s.toLowerCase()));
    if (store) return store;
  }
  return '';
}

function findDate(text) {
  let m = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (m) return iso(m[1], m[2], m[3]);
  m = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  if (m) {
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    // Canadian receipts mostly print DD/MM/YY; if the first number can't be a day-of-month swap it.
    const [a, b] = [Number(m[1]), Number(m[2])];
    return a > 12 ? iso(year, b, a) : b > 12 ? iso(year, a, b) : iso(year, b, a);
  }
  return '';
}

function iso(y, mo, d) {
  const date = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return Number.isNaN(Date.parse(date)) ? '' : date;
}

// Parse OCR text into { store, date, total, items: [{ text, price, weightKg, perKg, count }] }.
export function parseReceipt(text) {
  const lines = String(text).split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const items = [];
  let total = null;
  let pendingWeight = null;
  let pendingCount = null;

  for (const line of lines) {
    // "1.234 kg @ $8.80/kg" or "0.62 lb @ 2.99/lb" describes the next (or previous) priced line.
    const weight = line.match(/(\d+[.,]\d+)\s*(kg|lb)\s*@\s*\$?\s*(\d+[.,]\d{2})\s*\/\s*(kg|lb)/i);
    if (weight) {
      const qty = Number(weight[1].replace(',', '.'));
      const rate = Number(weight[3].replace(',', '.'));
      const toKg = weight[2].toLowerCase() === 'lb' ? 0.453592 : 1;
      const perKg = weight[4].toLowerCase() === 'lb' ? rate / 0.453592 : rate;
      const info = { weightKg: qty * toKg, perKg: Math.round(perKg * 100) / 100 };
      const last = items[items.length - 1];
      if (last && last.weightKg == null && Math.abs(last.price - qty * rate) < 0.05) Object.assign(last, info);
      else pendingWeight = info;
      continue;
    }
    const multi = line.match(/^(\d+)\s*@\s*\$?\s*(\d+[.,]\d{2})/);
    if (multi) {
      pendingCount = Number(multi[1]);
      const last = items[items.length - 1];
      if (last && last.count == null && Math.abs(last.price - pendingCount * Number(multi[2].replace(',', '.'))) < 0.05) {
        last.count = pendingCount;
        pendingCount = null;
      }
      continue;
    }

    const m = line.match(/^(.*?[A-Za-z].*?)\s+\$?(-?\d{1,4}[.,]\d{2}-?)\s*[A-Z*]{0,3}$/);
    if (!m) continue;
    const price = parseMoney(m[2]);
    if (price == null) continue;
    const label = m[1].replace(/^\d{6,}\s*/, '').trim(); // drop leading product codes
    if (/\btotal\b/i.test(label) && !/sub\s*-?total/i.test(label)) {
      total = price;
      continue;
    }
    if (NOT_ITEMS.test(label) || price <= 0) continue;
    const item = { text: label, price };
    if (pendingWeight) { Object.assign(item, pendingWeight); pendingWeight = null; }
    if (pendingCount) { item.count = pendingCount; pendingCount = null; }
    items.push(item);
  }
  return { store: findStore(lines), date: findDate(text), total, items };
}

function expand(text) {
  return normalizeName(text)
    .replace(/[^a-z0-9% ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((w) => (ABBREVIATIONS[w] ?? w).split(' '))
    .filter(Boolean)
    .map(normalizeName);
}

export function receiptKey(text) {
  return normalizeName(text).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Best price-list match for a receipt line, or null.
export function matchReceiptItem(text, catalog, learned = {}) {
  const remembered = learned[receiptKey(text)];
  if (remembered !== undefined) return remembered;
  const words = expand(text);
  let best = null;
  for (const entry of catalog) {
    for (const name of [entry.key, ...(entry.aliases || [])]) {
      const target = normalizeName(name).split(' ').map(normalizeName);
      const hits = target.filter((t) => words.some((w) => w === t || (w.length >= 3 && t.startsWith(w)) || (t.length >= 4 && w.startsWith(t))));
      if (hits.length !== target.length) continue;
      const score = target.join(' ').length;
      if (!best || score > best.score) best = { key: entry.key, score };
    }
  }
  return best?.key ?? null;
}

// Load Tesseract.js and read the text from an image (File, canvas, etc.).
export async function recognizeReceipt(image, onProgress = () => {}) {
  const Tesseract = (await import(TESSERACT_URL)).default;
  const worker = await Tesseract.createWorker('eng', 1, {
    logger: (m) => { if (m.status === 'recognizing text') onProgress(m.progress); },
  });
  try {
    const { data } = await worker.recognize(image);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

// Grayscale and enlarge a photo so small receipt print reads better.
export async function prepareImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(2, 2400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * Math.max(1, scale));
  canvas.height = Math.round(bitmap.height * Math.max(1, scale));
  const ctx = canvas.getContext('2d');
  ctx.filter = 'grayscale(1) contrast(1.4)';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

// Turn parsed receipt lines into editable rows: the matched price-list item
// and how much was bought. Weighed items take the weight from the receipt;
// packed items assume one pack per line unless the receipt says "N @".
export function buildReview(parsed, catalog, learned = {}) {
  const rows = parsed.items.map((item, idx) => {
    const key = matchReceiptItem(item.text, catalog, learned);
    return { idx, text: item.text, price: item.price, weightKg: item.weightKg, count: item.count, key, ...amountFor(item, catalog.find((e) => e.key === key)) };
  });
  const itemsTotal = round2(parsed.items.reduce((s, i) => s + i.price, 0));
  return { store: parsed.store, date: parsed.date || today(), total: parsed.total ?? itemsTotal, rows };
}

// What a line bought, given the item it matched. Used again when the match is changed in review.
export function amountFor(item, entry) {
  if (item.weightKg) return { qty: round3(item.weightKg), unit: 'kg' };
  if (!entry) return { qty: item.count || 1, unit: 'ea' };
  // Priced by weight but no weight printed: the person fills it in.
  if (entry.perWeight) return { qty: '', unit: 'kg' };
  return { qty: round3((item.count || 1) * entry.pack.qty), unit: entry.pack.unit };
}

// The price per pack (or per kg for weighed items) that a row implies.
export function rowStorePrice(row, entry) {
  const qty = Number(row.qty);
  if (!entry || !(qty > 0) || !(row.price > 0)) return null;
  if (entry.perWeight) {
    const kg = convertBase(toBase(qty, row.unit).qty, toBase(qty, row.unit).unit, 'g', entry.key) / 1000;
    if (!(kg > 0)) return null;
    return { price: round2(row.price / kg), qty: 1, unit: 'kg', perWeight: true };
  }
  const bought = toBase(qty, row.unit);
  const pack = toBase(entry.pack.qty, entry.pack.unit);
  const inPackUnit = convertBase(bought.qty, bought.unit, pack.unit, entry.key);
  if (!(inPackUnit > 0)) return null;
  return { price: round2(row.price / (inPackUnit / pack.qty)), qty: entry.pack.qty, unit: entry.pack.unit, perWeight: false };
}

// Save a reviewed receipt: store prices, one spending entry, inventory, and
// the name matches so the next receipt from the same store needs less review.
export function applyReceipt(state, review, catalog, { addToInventory, addSpend, newId }) {
  const store = review.store?.trim() || 'Receipt';
  const date = review.date || today();
  let prices = 0;
  let added = 0;
  for (const row of review.rows) {
    state.receiptAliases[receiptKey(row.text)] = row.key || null;
    if (!row.key) continue;
    const entry = catalog.find((e) => e.key === row.key);
    const price = rowStorePrice(row, entry);
    if (price) {
      state.storePrices = state.storePrices.filter((p) => !(p.key === row.key && p.store === store));
      state.storePrices.push({ id: newId('sp'), key: row.key, store, ...price, until: '', seen: date, source: 'receipt' });
      prices += 1;
    }
    if (row.addToInventory !== false && Number(row.qty) > 0) {
      addToInventory(state, { name: row.key, qty: Number(row.qty), unit: row.unit, location: CATEGORY_LOCATION[entry?.category] ?? 'pantry' }, catalog);
      added += 1;
    }
  }
  if (Number(review.total) > 0) addSpend(state, { date, store, amount: Number(review.total), note: 'from receipt' });
  return { prices, added };
}

const CATEGORY_LOCATION = { frozen: 'freezer', meat: 'fridge', dairy: 'fridge', fridge: 'fridge' };

function round2(n) {
  return Math.round(n * 100) / 100;
}

function round3(n) {
  return Math.round(n * 1000) / 1000;
}
