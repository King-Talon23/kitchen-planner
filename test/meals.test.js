import test from 'node:test';
import assert from 'node:assert/strict';
import { classify, mealIdeas } from '../src/ideas.js';
import { parseMeasure, splitSteps, minutesFromSteps, mealToRecipe, searchByIngredient } from '../src/online.js';
import { defaultState, normalizeState } from '../src/store.js';
import { DEFAULT_RECIPES } from '../src/data/recipes.js';
import { addToInventory, addDays, today } from '../src/inventory.js';
import { DEFAULT_PRICES } from '../src/data/prices.js';
import { recipeCoverage } from '../src/suggest.js';

test('foods are sorted into roles, including ones the price list lacks', () => {
  assert.equal(classify('zucchini').role, 'veg');
  assert.equal(classify('ground turkey').kind, 'poultry');
  assert.equal(classify('pasta sauce').role, 'other');
  assert.equal(classify('frozen green beans').role, 'veg');
  assert.equal(classify('canned beans').kind, 'legume');
  assert.equal(classify('sweet potato').role, 'starch');
  assert.equal(classify('dry beans').role, 'other');
});

test('meal ideas use only what is on hand and put expiring food first', () => {
  const s = defaultState();
  const add = (name, qty, unit, days) => addToInventory(s, { name, qty, unit, expires: days ? addDays(today(), days) : '' }, DEFAULT_PRICES);
  add('zucchini', 2, 'ea', 1);
  add('chicken thigh', 600, 'g', 4);
  add('white rice', 2, 'kg');
  add('pepper', 2, 'ea');
  add('egg', 6, 'ea');
  const ideas = mealIdeas(s, DEFAULT_PRICES);
  assert.ok(ideas.length >= 2);
  assert.ok(ideas[0].usesExpiring.includes('zucchini'));
  assert.equal(new Set(ideas.map((i) => i.id)).size, ideas.length);
  for (const idea of ideas) {
    assert.ok(idea.steps.length >= 2 && idea.cookMin >= 0);
    assert.equal(recipeCoverage(idea, s.inventory, DEFAULT_PRICES).canMake, true, idea.name);
  }
  assert.ok(ideas.some((i) => /74°C/.test(i.steps.join(' '))), 'chicken steps give the safe temperature');
  assert.deepEqual(mealIdeas(defaultState(), DEFAULT_PRICES), []);
});

test('TheMealDB measures, steps and times are parsed', () => {
  assert.deepEqual(parseMeasure('1 1/2 cups'), { qty: 1.5, unit: 'cup' });
  assert.deepEqual(parseMeasure('400g'), { qty: 400, unit: 'g' });
  assert.deepEqual(parseMeasure('½ tsp'), { qty: 0.5, unit: 'tsp' });
  assert.equal(parseMeasure('to taste'), null);
  assert.deepEqual(splitSteps('STEP 1\r\nHeat oil.\r\nSTEP 2\r\nFry 5 mins.'), ['Heat oil.', 'Fry 5 mins.']);
  assert.equal(minutesFromSteps(['Bake 25-30 minutes.', 'Rest 1 hour.']), 90);
  const r = mealToRecipe({
    idMeal: '52772', strMeal: 'Teriyaki Chicken Casserole', strCategory: 'Chicken', strArea: 'Japanese',
    strInstructions: 'Preheat oven to 350° F. Combine soy sauce and sugar. Bake 35 minutes.',
    strIngredient1: 'chicken breasts', strMeasure1: '2', strIngredient2: 'soy sauce', strMeasure2: '3/4 cup', strIngredient3: 'Pepper', strMeasure3: 'pinch',
  });
  assert.equal(r.cookMin, 35);
  assert.equal(r.ingredients[0].optional, false);
  assert.equal(r.ingredients[1].optional, true);
  assert.equal(r.ingredients[2].name, 'black pepper');
  assert.equal(r.source.url, 'https://www.themealdb.com/meal/52772');
});

test('searchByIngredient calls the filter endpoint', async () => {
  let url;
  const fetchImpl = async (u) => { url = u; return { ok: true, json: async () => ({ meals: [{ idMeal: '1', strMeal: 'Zucchini fritters', strMealThumb: 'x' }] }) }; };
  const results = await searchByIngredient('Green Zucchini', { fetchImpl });
  assert.equal(url, 'https://www.themealdb.com/api/json/v1/1/filter.php?i=green_zucchini');
  assert.deepEqual(results, [{ id: '1', name: 'Zucchini fritters', thumb: 'x' }]);
  const none = await searchByIngredient('x', { fetchImpl: async () => ({ ok: true, json: async () => ({ meals: null }) }) });
  assert.deepEqual(none, []);
});

test('older saves get the new starter recipes once, without reviving deleted ones', () => {
  const old = defaultState();
  old.recipes = old.recipes.filter((r) => ['r-chili', 'r-omelette'].includes(r.id));
  delete old.starterIds;
  const loaded = normalizeState(JSON.parse(JSON.stringify(old)));
  assert.ok(!loaded.recipes.some((r) => r.id === 'r-bolognese'), 'deleted original stays deleted');
  assert.ok(loaded.recipes.some((r) => r.id === 'r-beef-stew'), 'new starter added');
  assert.equal(loaded.recipes.length, 2 + DEFAULT_RECIPES.length - 14);
  loaded.recipes = loaded.recipes.filter((r) => r.id !== 'r-beef-stew');
  const again = normalizeState(JSON.parse(JSON.stringify(loaded)));
  assert.ok(!again.recipes.some((r) => r.id === 'r-beef-stew'), 'a new starter you delete stays deleted');
});
