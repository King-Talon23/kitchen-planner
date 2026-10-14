import { test } from 'node:test';
import assert from 'node:assert/strict';

import { defaultState } from '../src/store.js';
import { addToInventory } from '../src/inventory.js';
import { addSpend, spentInWeek, weekStart, spendingSummary } from '../src/spending.js';
import { effectiveCatalog, buildShoppingList, priceFor } from '../src/shopping.js';
import { parseQuantity, matchCatalog, productFromOff, lookupBarcode, rememberBarcode } from '../src/barcode.js';
import { syncNow, resolveConflict, GIST_FILE, syncPayload } from '../src/sync.js';
import { restingEnergy, dailyTargets, recipeNutrition, valueRanking, profileComplete } from '../src/nutrition.js';
import { DEFAULT_PRICES } from '../src/data/prices.js';
import { DEFAULT_RECIPES } from '../src/data/recipes.js';

// ---------- spending ----------

test('weeks start on Monday', () => {
  assert.equal(weekStart('2026-10-14'), '2026-10-12'); // Wednesday -> Monday
  assert.equal(weekStart('2026-10-12'), '2026-10-12');
  assert.equal(weekStart('2026-10-18'), '2026-10-12'); // Sunday
});

test('spending is totalled per week and reduces the shopping budget', () => {
  const state = defaultState();
  addSpend(state, { date: '2026-10-13', amount: 40, store: 'No Frills' });
  addSpend(state, { date: '2026-10-15', amount: 25.5 });
  addSpend(state, { date: '2026-10-05', amount: 160 });
  assert.equal(spentInWeek(state, '2026-10-14'), 65.5);
  const summary = spendingSummary(state, { weeks: 2, on: '2026-10-14' });
  assert.deepEqual(summary.rows.map((r) => r.spent), [160, 65.5]);
  assert.equal(summary.weeksOver, 1);
  const list = buildShoppingList(state, effectiveCatalog(state), { on: '2026-10-14' });
  assert.equal(list.budget, 84.5);
  assert.equal(list.spent, 65.5);
  assert.throws(() => addSpend(state, { amount: -1 }));
});

// ---------- store prices ----------

test('a current store price replaces the StatCan average; expired ones do not', () => {
  const state = defaultState();
  state.storePrices = [
    { id: 'a', key: 'chicken thigh', store: 'Food Basics', price: 8.8, qty: 1, unit: 'kg', perWeight: true, until: '2026-10-16', seen: '2026-10-10' },
    { id: 'b', key: 'eggs', store: 'Old', price: 1, qty: 12, unit: 'ea', until: '2026-10-01', seen: '2026-09-25' },
  ];
  const cat = effectiveCatalog(state, '2026-10-14');
  const thigh = priceFor('chicken thigh', 800, 'g', cat);
  assert.equal(thigh.cost, 7.04);
  assert.equal(thigh.entry.store, 'Food Basics');
  assert.equal(priceFor('egg', 12, 'ea', cat).cost, 4.83); // expired sale ignored
});

test('the cheapest of several store prices wins, compared per unit', () => {
  const state = defaultState();
  state.storePrices = [
    { id: 'a', key: 'milk', store: 'A', price: 6.49, qty: 4, unit: 'l', until: '', seen: '2026-10-10' },
    { id: 'b', key: 'milk', store: 'B', price: 3.0, qty: 2, unit: 'l', until: '', seen: '2026-10-10' },
  ];
  const cat = effectiveCatalog(state, '2026-10-14');
  assert.equal(priceFor('milk', 2000, 'ml', cat).entry.store, 'B');
});

test('store prices go stale after 45 days without an end date', () => {
  const state = defaultState();
  state.storePrices = [{ id: 'a', key: 'butter', store: 'A', price: 3, qty: 454, unit: 'g', until: '', seen: '2026-08-01' }];
  assert.equal(priceFor('butter', 454, 'g', effectiveCatalog(state, '2026-10-14')).cost, 5.68);
});

test('shopping list items show which store has the price', () => {
  const state = defaultState();
  state.extras = [{ id: 'x', name: 'chicken thigh', qty: 1, unit: 'kg' }];
  state.storePrices = [{ id: 'a', key: 'chicken thigh', store: 'Food Basics', price: 8.8, qty: 1, unit: 'kg', perWeight: true, until: '', seen: '2026-10-10' }];
  const list = buildShoppingList(state, effectiveCatalog(state, '2026-10-14'), { on: '2026-10-14' });
  assert.equal(list.items[0].store, 'Food Basics');
});

// ---------- barcode ----------

test('package sizes are parsed from Open Food Facts quantity text', () => {
  assert.deepEqual(parseQuantity('1.89 L'), { qty: 1.89, unit: 'l' });
  assert.deepEqual(parseQuantity('500g'), { qty: 500, unit: 'g' });
  assert.deepEqual(parseQuantity('12 x 355 ml'), { qty: 4260, unit: 'ml' });
  assert.deepEqual(parseQuantity('75 cl'), { qty: 750, unit: 'ml' });
  assert.equal(parseQuantity('family size'), null);
});

test('product names map onto price items', () => {
  assert.equal(matchCatalog('Natrel 2% Milk', DEFAULT_PRICES), 'milk');
  assert.equal(matchCatalog('Barilla Spaghetti No. 5', DEFAULT_PRICES), 'pasta');
  assert.equal(matchCatalog('Kraft Smooth Peanut Butter', DEFAULT_PRICES), 'peanut butter');
  assert.equal(matchCatalog('Mystery snack', DEFAULT_PRICES), null);
});

test('Open Food Facts responses become inventory suggestions', () => {
  const json = { code: '0068700011009', status: 1, product: { product_name: 'Peanut Butter Smooth', brands: 'Kraft, Kraft Heinz', product_quantity: '1000', product_quantity_unit: 'g' } };
  const p = productFromOff('0068700011009', json, DEFAULT_PRICES);
  assert.deepEqual({ name: p.name, brand: p.brand, qty: p.qty, unit: p.unit, key: p.key }, { name: 'Peanut Butter Smooth', brand: 'Kraft', qty: 1000, unit: 'g', key: 'peanut butter' });
  assert.equal(productFromOff('1', { status: 0 }, DEFAULT_PRICES), null);
});

test('barcode lookups are remembered and reused without the network', async () => {
  const state = defaultState();
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return { ok: true, status: 200, json: async () => ({ status: 1, product: { product_name: 'Whole Milk', quantity: '4 L' } }) };
  };
  const first = await lookupBarcode('0 12345 67890 5', state, DEFAULT_PRICES, fetchImpl);
  assert.equal(first.code, '012345678905');
  rememberBarcode(state, first);
  const again = await lookupBarcode('012345678905', state, DEFAULT_PRICES, fetchImpl);
  assert.equal(again.cached, true);
  assert.equal(calls, 1);
  const missing = await lookupBarcode('999', state, DEFAULT_PRICES, async () => ({ ok: false, status: 404 }));
  assert.equal(missing, null);
});

// ---------- sync ----------

function fakeGitHub(initial = null) {
  const gists = new Map();
  if (initial) gists.set('g1', initial);
  const calls = [];
  const fetchImpl = async (url, opts = {}) => {
    const { pathname } = new URL(url);
    const method = opts.method || 'GET';
    calls.push(`${method} ${pathname}`);
    const reply = (body) => ({ ok: true, status: 200, json: async () => body });
    if (method === 'GET' && pathname === '/gists') {
      return reply([...gists.keys()].map((id) => ({ id, files: { [GIST_FILE]: {} } })));
    }
    if (method === 'POST' && pathname === '/gists') {
      gists.set('new', JSON.parse(opts.body).files[GIST_FILE].content);
      return reply({ id: 'new' });
    }
    const id = pathname.split('/')[2];
    if (method === 'GET') return reply({ id, files: { [GIST_FILE]: { content: gists.get(id), truncated: false } } });
    if (method === 'PATCH') {
      gists.set(id, JSON.parse(opts.body).files[GIST_FILE].content);
      return reply({ id });
    }
    throw new Error(`unexpected ${method} ${url}`);
  };
  return { fetchImpl, gists, calls };
}

const withData = (stamp, name = 'rice') => {
  const s = defaultState();
  addToInventory(s, { name, qty: 1, unit: 'kg' }, DEFAULT_PRICES);
  s.updatedAt = stamp;
  return s;
};

test('first sync creates a secret gist', async () => {
  const gh = fakeGitHub();
  const res = await syncNow(withData('t1'), { token: 'x', gistId: '', lastSynced: null }, gh.fetchImpl);
  assert.equal(res.action, 'created');
  assert.equal(res.config.gistId, 'new');
  assert.equal(res.config.lastSynced, 't1');
});

test('a second device with no data finds the gist and downloads it', async () => {
  const gh = fakeGitHub(syncPayload(withData('t1')));
  const res = await syncNow(defaultState(), { token: 'x', gistId: '', lastSynced: null }, gh.fetchImpl);
  assert.equal(res.action, 'pulled');
  assert.equal(res.state.inventory[0].name, 'rice');
  assert.equal(res.config.gistId, 'g1');
});

test('local-only changes upload; remote-only changes download', async () => {
  const gh = fakeGitHub(syncPayload(withData('t1')));
  const pushed = await syncNow(withData('t2', 'pasta'), { token: 'x', gistId: 'g1', lastSynced: 't1' }, gh.fetchImpl);
  assert.equal(pushed.action, 'pushed');
  assert.match(gh.gists.get('g1'), /pasta/);
  const pulled = await syncNow(withData('t1'), { token: 'x', gistId: 'g1', lastSynced: 't1' }, gh.fetchImpl);
  assert.equal(pulled.action, 'pulled');
  assert.equal(pulled.state.inventory[0].name, 'pasta');
  const same = await syncNow(withData('t2', 'pasta'), { token: 'x', gistId: 'g1', lastSynced: 't2' }, gh.fetchImpl);
  assert.equal(same.action, 'unchanged');
});

test('changes on both sides are a conflict until you choose', async () => {
  const gh = fakeGitHub(syncPayload(withData('t3', 'remote')));
  const local = withData('t2', 'local');
  const res = await syncNow(local, { token: 'x', gistId: 'g1', lastSynced: 't1' }, gh.fetchImpl);
  assert.equal(res.action, 'conflict');
  assert.match(gh.gists.get('g1'), /remote/); // nothing written yet
  const kept = await resolveConflict('local', local, res.remote, res.config, gh.fetchImpl);
  assert.equal(kept.action, 'pushed');
  assert.match(gh.gists.get('g1'), /"local"/);
});

test('sync never uploads the token or backup date', () => {
  const s = withData('t1');
  s.lastBackup = '2026-10-01';
  assert.ok(!syncPayload(s).includes('lastBackup'));
});

// ---------- nutrition ----------

test('Mifflin-St Jeor resting energy', () => {
  // 10 x 56.7 + 6.25 x 170.2 - 5 x 25 + 5 = 1510.75
  assert.equal(restingEnergy({ sex: 'male', age: 25, heightCm: 170.2, weightKg: 56.7 }), 1510.75);
  assert.equal(restingEnergy({ sex: 'female', age: 25, heightCm: 170.2, weightKg: 56.7 }), 1344.75);
});

test('weight-gain targets: 15% surplus, 1.6-2.2 g/kg protein, weeks to goal', () => {
  const t = dailyTargets({ sex: 'male', age: 25, heightCm: 170.2, weightKg: 56.7, goalWeightKg: 65.8, activity: 'light', goal: 'gain' });
  assert.equal(t.maintenance, Math.round(1510.75 * 1.55));
  assert.equal(t.kcal, Math.round(1510.75 * 1.55 * 1.15));
  assert.deepEqual(t.protein, [91, 125]);
  assert.deepEqual(t.weeklyGainKg, [0.14, 0.28]);
  assert.deepEqual(t.weeksToGoal, [33, 65]);
  assert.equal(dailyTargets({ sex: '', age: 25 }), null);
  assert.equal(profileComplete({ sex: 'female', age: 30, heightCm: 160, weightKg: 55 }), true);
});

test('recipe nutrition adds up ingredients and flags unknown ones', () => {
  const n = recipeNutrition(DEFAULT_RECIPES.find((r) => r.id === 'r-bolognese'), DEFAULT_PRICES);
  assert.ok(n.perServing.kcal > 300 && n.perServing.kcal < 1200, `kcal ${n.perServing.kcal}`);
  assert.ok(n.perServing.protein > 15, `protein ${n.perServing.protein}`);
  const odd = recipeNutrition({ servings: 1, ingredients: [{ name: 'dragonfruit jam', qty: 10, unit: 'g' }] }, DEFAULT_PRICES);
  assert.deepEqual(odd.unknown, ['dragonfruit jam']);
});

test('calories per dollar ranks cheap dense staples first', () => {
  const top = valueRanking(DEFAULT_PRICES, 'kcal', 5).map((r) => r.key);
  assert.ok(!top.includes('sugar'));
  assert.ok(top.some((k) => ['flour', 'vegetable oil', 'canola oil', 'white rice', 'peanut butter'].includes(k)), top.join(','));
});
