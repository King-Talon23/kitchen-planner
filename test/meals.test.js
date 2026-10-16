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
  assert.equal(r.cookMin, 35); // max of the 35 minutes mentioned and the oven floor
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

test('online recipes always get a time estimate', async () => {
  const { estimateTimes } = await import('../src/online.js');
  assert.deepEqual(estimateTimes(['Fry spoonfuls 3-4 minutes each side.'], 4), { prepMin: 13, cookMin: 15 });
  assert.deepEqual(estimateTimes(['Mix and serve.'], 2), { prepMin: 9, cookMin: 10 });
  assert.equal(estimateTimes(['Roast for 1 hour.'], 3).cookMin, 60);
});

test('planned meals get days and cooking blocks that export as iCalendar', async () => {
  const { scheduleWeek, cookingBlocks, toICS, scheduleJSON } = await import('../src/schedule.js');
  const s = defaultState();
  const chili = s.recipes.find((r) => r.id === 'r-chili');
  const omelette = s.recipes.find((r) => r.id === 'r-omelette');
  s.plan = [{ id: 'p1', recipeId: 'r-chili', servings: 6 }, { id: 'p2', recipeId: 'r-omelette', servings: 2 }, { id: 'p3', recipeId: 'r-chili', servings: 6, date: '2026-10-14', meal: 'dinner' }];
  scheduleWeek(s, { from: '2026-10-14' });
  assert.deepEqual([s.plan[0].date, s.plan[0].meal], ['2026-10-15', 'dinner'], 'the taken slot is skipped');
  assert.deepEqual([s.plan[1].date, s.plan[1].meal], ['2026-10-14', 'breakfast']);
  const blocks = cookingBlocks(s);
  const omeletteBlock = blocks.find((b) => b.id === 'p2');
  assert.equal(omeletteBlock.ready, '08:00');
  assert.equal(omeletteBlock.minutes, omelette.prepMin + omelette.cookMin);
  const chiliBlock = blocks.find((b) => b.id === 'p3');
  const startMin = 18 * 60 + 30 - (chili.prepMin + chili.cookMin);
  assert.equal(chiliBlock.start, `${String(Math.floor(startMin / 60)).padStart(2, '0')}:${String(startMin % 60).padStart(2, '0')}`);

  const ics = toICS(blocks, { now: new Date('2026-10-14T12:00:00Z') });
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:'));
  assert.ok(ics.includes('DTSTAMP:20261014T120000Z'));
  assert.ok(ics.includes('DTEND:20261014T183000'));
  assert.ok(ics.includes('SUMMARY:Cook: Beef and bean chili'));
  assert.equal(ics.split('BEGIN:VEVENT').length - 1, 3);
  for (const line of ics.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75, `line too long: ${line}`);
  assert.ok(!/[^\\][,;](?=[^:]*$)/.test(ics.split('\r\n').find((l) => l.startsWith('SUMMARY')) ?? ''));
  assert.equal(scheduleJSON(blocks)[0].title.startsWith('Cook: '), true);

  // A meal ready at 08:00 that takes longer than 8 hours starts the day before.
  s.recipes.push({ id: 'slow', name: 'Overnight', servings: 1, tags: ['breakfast'], ingredients: [], prepMin: 10, cookMin: 600, steps: ['a step', 'another step'] });
  s.plan = [{ id: 'p9', recipeId: 'slow', servings: 1, date: '2026-10-16', meal: 'breakfast' }];
  const [overnight] = cookingBlocks(s);
  assert.deepEqual([overnight.startDate, overnight.start], ['2026-10-15', '21:50']);
});
