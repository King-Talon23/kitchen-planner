import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReceipt, parseMoney, matchReceiptItem, buildReview, applyReceipt, rowStorePrice, amountFor } from '../src/receipt.js';
import { DEFAULT_PRICES } from '../src/data/prices.js';
import { defaultState } from '../src/store.js';
import { addToInventory, newId } from '../src/inventory.js';
import { addSpend } from '../src/spending.js';

// Shaped like real OCR output: product codes, an HST flag, a weighed line, a multi-buy.
const RECEIPT = `FOOD BASICS #123
1234 Main St, Hamilton ON
14/10/26 18:42
06038318 GRND BF MED 12.47
1.150 kg @ $10.84/kg
BANANAS 1.65
0.750 kg @ $2.20/kg
2 @ 3.49
MLK 2% 4L 6.98
CHKN THGH BNLS 11.20
WHT BRD 3.29
CHIPS 4.49 H
SUBTOTAL 40.08
HST 13% 0.58
TOTAL 40.66
VISA 40.66
CHANGE 0.00`;

test('parseMoney handles signs and commas', () => {
  assert.equal(parseMoney('$4.99'), 4.99);
  assert.equal(parseMoney('4,99'), 4.99);
  assert.equal(parseMoney('1.00-'), -1);
  assert.equal(parseMoney('abc'), null);
});

test('parseReceipt finds store, date, total and item lines', () => {
  const r = parseReceipt(RECEIPT);
  assert.equal(r.store, 'Food Basics');
  assert.equal(r.date, '2026-10-14');
  assert.equal(r.total, 40.66);
  assert.deepEqual(r.items.map((i) => i.text), ['GRND BF MED', 'BANANAS', 'MLK 2% 4L', 'CHKN THGH BNLS', 'WHT BRD', 'CHIPS']);
  const beef = r.items[0];
  assert.equal(beef.weightKg, 1.15);
  assert.equal(beef.perKg, 10.84);
  assert.equal(r.items[1].weightKg, 0.75);
  assert.equal(r.items[2].count, 2);
});

test('pound weights are converted to kilograms', () => {
  const r = parseReceipt('APPLES 2.99\n2.00 lb @ $1.50/lb');
  assert.ok(Math.abs(r.items[0].weightKg - 0.907) < 0.001);
  assert.ok(Math.abs(r.items[0].perKg - 3.31) < 0.01);
});

test('matchReceiptItem expands abbreviations and uses learned matches', () => {
  assert.equal(matchReceiptItem('GRND BF MED', DEFAULT_PRICES), 'ground beef');
  assert.equal(matchReceiptItem('BANANAS', DEFAULT_PRICES), 'banana');
  assert.equal(matchReceiptItem('CHKN THGH BNLS', DEFAULT_PRICES), 'chicken thigh');
  assert.equal(matchReceiptItem('ZZZ GADGET', DEFAULT_PRICES), null);
  assert.equal(matchReceiptItem('CHIPS', DEFAULT_PRICES, { chips: null }), null);
  assert.equal(matchReceiptItem('WHT BRD', DEFAULT_PRICES, { 'wht brd': 'bread' }), 'bread');
});

test('weighed items with no weight on the receipt ask for one', () => {
  const beef = DEFAULT_PRICES.find((e) => e.key === 'ground beef');
  assert.deepEqual(amountFor({ text: 'GRND BF', price: 9 }, beef), { qty: '', unit: 'kg' });
  assert.equal(rowStorePrice({ price: 9, qty: '', unit: 'kg' }, beef), null);
  assert.deepEqual(rowStorePrice({ price: 9, qty: 600, unit: 'g' }, beef), { price: 15, qty: 1, unit: 'kg', perWeight: true });
});

test('a reviewed receipt saves store prices, spending, inventory and matches', () => {
  const state = defaultState();
  const review = buildReview(parseReceipt(RECEIPT), DEFAULT_PRICES, state.receiptAliases);
  const milk = review.rows.find((r) => r.text.startsWith('MLK'));
  assert.equal(milk.key, 'milk');
  const milkEntry = DEFAULT_PRICES.find((e) => e.key === 'milk');
  assert.equal(milk.qty, 2 * milkEntry.pack.qty);

  const result = applyReceipt(state, review, DEFAULT_PRICES, { addToInventory, addSpend, newId });
  assert.ok(result.prices >= 4);
  const beefPrice = state.storePrices.find((p) => p.key === 'ground beef');
  assert.equal(beefPrice.store, 'Food Basics');
  assert.equal(beefPrice.price, 10.84);
  assert.equal(beefPrice.perWeight, true);
  const milkPrice = state.storePrices.find((p) => p.key === 'milk');
  assert.equal(milkPrice.price, 3.49);
  assert.equal(state.spending.length, 1);
  assert.equal(state.spending[0].amount, 40.66);
  assert.equal(state.spending[0].date, '2026-10-14');
  assert.ok(state.inventory.some((i) => i.name === 'ground beef' && i.unit === 'kg' && i.location === 'fridge'));
  assert.equal(state.receiptAliases['grnd bf med'], 'ground beef');
  assert.equal(state.receiptAliases.chip, null);

  // A second receipt from the same store replaces that store's price instead of piling up.
  applyReceipt(state, review, DEFAULT_PRICES, { addToInventory, addSpend, newId });
  assert.equal(state.storePrices.filter((p) => p.key === 'milk').length, 1);
});
