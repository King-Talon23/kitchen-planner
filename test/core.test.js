import { test } from 'node:test';
import assert from 'node:assert/strict';

import { toBase, normalizeName, convertBase, normalizeUnit } from '../src/units.js';
import { addToInventory, logMeal, consume, lowStock, expiringSoon, canonicalName } from '../src/inventory.js';
import { suggestMeals, recipeCoverage } from '../src/suggest.js';
import { buildShoppingList, priceFor, effectiveCatalog, autoPlan } from '../src/shopping.js';
import { defaultState, load, save, exportState, importState, STORAGE_KEY } from '../src/store.js';
import { DEFAULT_PRICES } from '../src/data/prices.js';
import { DEFAULT_RECIPES } from '../src/data/recipes.js';

const catalog = DEFAULT_PRICES;
const recipe = (id) => DEFAULT_RECIPES.find((r) => r.id === id);

function memoryStorage() {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)), data };
}

test('units convert to base units', () => {
  assert.deepEqual(toBase(1.5, 'kg'), { qty: 1500, unit: 'g' });
  assert.deepEqual(toBase(2, 'L'), { qty: 2000, unit: 'ml' });
  assert.deepEqual(toBase(1, 'dozen'), { qty: 12, unit: 'ea' });
  assert.deepEqual(toBase(2, 'tbsp'), { qty: 30, unit: 'ml' });
  assert.equal(normalizeUnit('Litres'), 'l');
  assert.throws(() => normalizeUnit('bushel'));
});

test('names match across case and plurals', () => {
  assert.equal(normalizeName(' Tomatoes '), 'tomato');
  assert.equal(normalizeName('Eggs'), 'egg');
  assert.equal(normalizeName('berries'), 'berry');
  assert.equal(normalizeName('hummus'), 'hummus');
  assert.equal(canonicalName('Rice', catalog), 'white rice');
  assert.equal(canonicalName('Spaghetti', catalog), 'pasta');
});

test('count and weight convert for produce with an average weight', () => {
  assert.equal(convertBase(2, 'ea', 'g', 'onion'), 300);
  assert.equal(convertBase(300, 'g', 'ea', 'onions'), 2);
  assert.equal(convertBase(1, 'ea', 'g', 'saffron'), null);
});

test('adding the same item merges quantities', () => {
  const state = defaultState();
  addToInventory(state, { name: 'Milk', qty: 2, unit: 'l' }, catalog);
  addToInventory(state, { name: 'milk', qty: 1, unit: 'L' }, catalog);
  assert.equal(state.inventory.length, 1);
  assert.equal(state.inventory[0].qty, 3);
});

test('consuming uses the soonest-expiring stock first', () => {
  const state = defaultState();
  addToInventory(state, { name: 'egg', qty: 6, unit: 'ea', expires: '2026-11-20' }, catalog);
  addToInventory(state, { name: 'egg', qty: 6, unit: 'ea', expires: '2026-10-20' }, catalog);
  const missing = consume(state.inventory, 'eggs', 8, 'ea', catalog);
  assert.equal(missing, 0);
  assert.equal(state.inventory.length, 1);
  assert.equal(state.inventory[0].expires, '2026-11-20');
  assert.equal(state.inventory[0].qty, 4);
});

test('logging a meal deducts ingredients and records history', () => {
  const state = defaultState();
  addToInventory(state, { name: 'pasta', qty: 1, unit: 'kg' }, catalog);
  addToInventory(state, { name: 'ground beef', qty: 450, unit: 'g' }, catalog);
  addToInventory(state, { name: 'pasta sauce', qty: 650, unit: 'ml' }, catalog);
  addToInventory(state, { name: 'onion', qty: 3, unit: 'ea' }, catalog);
  const { shortfalls } = logMeal(state, recipe('r-bolognese'), { servings: 4, date: '2026-10-13' }, catalog);
  assert.deepEqual(shortfalls, []);
  const byName = Object.fromEntries(state.inventory.map((i) => [i.name, i.qty]));
  assert.equal(byName.pasta, 0.5); // 1 kg - 500 g
  assert.equal(byName.onion, 2);
  assert.equal(byName['ground beef'], undefined); // used up and removed
  assert.equal(state.history[0].recipeName, 'Spaghetti bolognese');
});

test('logging a half batch scales ingredients and reports shortfalls', () => {
  const state = defaultState();
  addToInventory(state, { name: 'pasta', qty: 100, unit: 'g' }, catalog);
  const { shortfalls } = logMeal(state, recipe('r-bolognese'), { servings: 2 }, catalog);
  const pasta = shortfalls.find((s) => s.name === 'pasta');
  assert.equal(pasta.qty, 150); // needs 250 g, had 100 g
  assert.ok(!shortfalls.some((s) => s.name === 'italian seasoning')); // optional
});

test('items with a restock level stay at zero and show as low stock', () => {
  const state = defaultState();
  addToInventory(state, { name: 'milk', qty: 1, unit: 'l', par: 2 }, catalog);
  consume(state.inventory, 'milk', 1000, 'ml', catalog);
  assert.equal(state.inventory.length, 1);
  assert.equal(lowStock(state).length, 1);
});

test('expiring items are found within the warning window', () => {
  const state = defaultState();
  addToInventory(state, { name: 'yogurt', qty: 500, unit: 'g', expires: '2026-10-15' }, catalog);
  addToInventory(state, { name: 'cheese', qty: 500, unit: 'g', expires: '2026-12-01' }, catalog);
  assert.deepEqual(expiringSoon(state, '2026-10-13', 3).map((i) => i.name), ['yogurt']);
});

test('suggestions rank makeable meals first, then ones using expiring food', () => {
  const state = defaultState();
  for (const [name, qty, unit, expires] of [
    ['egg', 12, 'ea', ''], ['pepper', 2, 'ea', ''], ['mushroom', 227, 'g', '2026-10-14'],
    ['cheese', 500, 'g', ''], ['butter', 454, 'g', ''],
  ]) addToInventory(state, { name, qty, unit, expires }, catalog);
  const [top] = suggestMeals(state, catalog, { on: '2026-10-13' });
  assert.equal(top.recipe.id, 'r-omelette');
  assert.equal(top.canMake, true);
  assert.deepEqual(top.usesExpiring, ['mushroom']);
  const cov = recipeCoverage(recipe('r-pancakes'), state.inventory, catalog);
  assert.ok(cov.coverage > 0 && cov.coverage < 1);
});

test('prices round per-kg items to 100 g and packs up to whole packs', () => {
  const beef = priceFor('ground beef', 450, 'g', catalog);
  assert.equal(beef.cost, 8.38); // 0.5 kg x $16.75
  const pasta = priceFor('pasta', 600, 'g', catalog);
  assert.equal(pasta.cost, 6.74); // 2 packs x $3.37
  const eggs = priceFor('egg', 4, 'ea', catalog);
  assert.equal(eggs.cost, 4.83);
  assert.equal(priceFor('saffron', 1, 'g', catalog), null);
});

test('shopping list covers the plan minus what is on hand, and restocks', () => {
  const state = defaultState();
  addToInventory(state, { name: 'pasta', qty: 500, unit: 'g' }, catalog);
  addToInventory(state, { name: 'milk', qty: 1, unit: 'l', par: 4 }, catalog);
  state.plan = [{ id: 'p1', recipeId: 'r-bolognese', servings: 4 }];
  const list = buildShoppingList(state);
  const names = list.items.map((i) => i.name);
  assert.ok(!names.includes('pasta'));
  assert.ok(names.includes('ground beef'));
  assert.ok(names.includes('pasta sauce'));
  assert.equal(list.items.find((i) => i.name === 'milk').reason, 'restock');
  assert.ok(list.total <= 150);
});

test('shopping list never goes over budget; extras spill into "over"', () => {
  const state = defaultState();
  state.settings.budget = 20;
  state.extras = [{ name: 'olive oil', qty: 1, unit: 'l' }];
  state.plan = [{ id: 'p1', recipeId: 'r-salmon-rice', servings: 2 }];
  const list = buildShoppingList(state);
  assert.ok(list.total <= 20);
  assert.ok(list.over.length > 0);
  assert.equal(list.items[0].name, 'olive oil'); // manual items come first
});

test('user price overrides replace StatCan defaults', () => {
  const state = defaultState();
  state.priceOverrides = { egg: 3.5 };
  const cat = effectiveCatalog(state);
  assert.equal(priceFor('egg', 12, 'ea', cat).cost, 3.5);
});

test('auto-plan fills the week within budget', () => {
  const state = defaultState();
  const { plan } = autoPlan(state);
  const servings = plan.reduce((s, p) => s + p.servings, 0);
  assert.ok(servings >= 14);
  assert.equal(new Set(plan.map((p) => p.recipeId)).size, plan.length); // no repeats needed
  const list = buildShoppingList({ ...state, plan });
  assert.equal(list.over.length, 0);
  assert.ok(list.total <= 150);
});

test('auto-plan stops when the budget is too small', () => {
  const state = defaultState();
  state.settings.budget = 10;
  const { plan, reason } = autoPlan(state);
  assert.ok(plan.length < 3);
  assert.match(reason, /budget/);
});

test('save, load, export and import round-trip', () => {
  const storage = memoryStorage();
  const state = defaultState();
  addToInventory(state, { name: 'rice', qty: 2, unit: 'kg' }, catalog);
  save(state, storage);
  assert.equal(load(storage).inventory[0].name, 'rice');
  const copy = importState(exportState(state));
  assert.equal(copy.inventory[0].qty, 2);
  assert.throws(() => importState('{"inventory": 5}'));
});

test('an unreadable save is kept aside instead of being overwritten', () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, '{not json');
  const state = load(storage);
  assert.deepEqual(state.inventory, []);
  assert.ok([...storage.data.keys()].some((k) => k.includes('unreadable')));
});

test('restocking counts stock bought in a different unit', () => {
  const state = defaultState();
  addToInventory(state, { name: 'banana', qty: 1, unit: 'ea', par: 6 }, catalog);
  assert.equal(buildShoppingList(state).items[0].name, 'banana');
  addToInventory(state, { name: 'banana', qty: 700, unit: 'g' }, catalog); // ~5.8 bananas at 120 g
  assert.equal(buildShoppingList(state).items.length, 0);
  assert.equal(lowStock(state, catalog).length, 0);
});
