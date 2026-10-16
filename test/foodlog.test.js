import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, normalizeState } from '../src/store.js';
import { effectiveCatalog } from '../src/shopping.js';
import { logMeal } from '../src/inventory.js';
import { logEaten, recipeServing, foodServing, eatenOn, recentDays, leftovers, logWeight, weightTrend, trendAdvice } from '../src/foodlog.js';

test('older saves get empty food and weight logs', () => {
  const s = normalizeState({ inventory: [], recipes: [], plan: [], extras: [], history: [], customPrices: [], storePrices: [], spending: [] });
  assert.deepEqual(s.eaten, []);
  assert.deepEqual(s.weights, []);
});

test('logging food adds up per day and averages only logged days', () => {
  const s = defaultState();
  const cat = effectiveCatalog(s);
  const milk = foodServing('milk', 250, 'ml', cat);
  assert.ok(milk.kcal > 100 && milk.kcal < 170, `250 ml milk ${milk.kcal} kcal`);
  logEaten(s, { date: '2026-10-10', name: 'milk', per: milk });
  logEaten(s, { date: '2026-10-10', name: 'bar', servings: 2, per: { kcal: 200, protein: 20, fat: 5, carbs: 20 }, kind: 'label' });
  logEaten(s, { date: '2026-10-12', name: 'bar', per: { kcal: 200, protein: 20, fat: 5, carbs: 20 } });
  const day = eatenOn(s, '2026-10-10');
  assert.equal(day.entries.length, 2);
  assert.equal(day.totals.protein, Math.round(milk.protein + 40));
  const week = recentDays(s, { until: '2026-10-12' });
  assert.equal(week.rows.length, 7);
  assert.equal(week.daysLogged, 2);
  assert.equal(week.average.kcal, Math.round((day.totals.kcal + 200) / 2));
  assert.throws(() => logEaten(s, { name: 'x', servings: 0, per: {} }));
});

test('recipe servings and leftovers within Health Canada 2 to 3 days', () => {
  const s = defaultState();
  const cat = effectiveCatalog(s);
  const recipe = s.recipes.find((r) => r.id === 'r-chili');
  const { entry } = logMeal(s, recipe, { servings: 4, date: '2026-10-10' }, cat);
  const { per } = recipeServing(recipe, cat);
  assert.ok(per.kcal > 0 && per.protein > 0);
  entry.per = per;
  logEaten(s, { date: '2026-10-10', name: recipe.name, per, mealId: entry.id, kind: 'recipe' });
  assert.equal(leftovers(s, '2026-10-10')[0].left, 3);
  assert.equal(leftovers(s, '2026-10-12')[0].lastDay, '2026-10-12');
  assert.equal(leftovers(s, '2026-10-13').length, 0);
  logEaten(s, { date: '2026-10-11', name: recipe.name, servings: 3, per, mealId: entry.id });
  assert.equal(leftovers(s, '2026-10-11').length, 0);
});

test('weigh-ins update the profile and give a weekly trend', () => {
  const s = defaultState();
  logWeight(s, { date: '2026-10-01', kg: 56.7 });
  assert.equal(weightTrend(s, { on: '2026-10-01' }), null);
  logWeight(s, { date: '2026-10-08', kg: 57.0 });
  logWeight(s, { date: '2026-10-15', kg: 57.3 });
  logWeight(s, { date: '2026-10-15', kg: 57.3 }); // same day replaces
  assert.equal(s.weights.length, 3);
  assert.equal(s.profile.weightKg, 57.3);
  const trend = weightTrend(s, { on: '2026-10-15' });
  assert.equal(trend.kgPerWeek, 0.3);
  assert.equal(trendAdvice(trend, { weeklyGainKg: [0.14, 0.28] }), 'fast');
  assert.equal(trendAdvice(trend, { weeklyGainKg: [0.14, 0.3] }), 'on track');
  assert.equal(trendAdvice({ kgPerWeek: 0.05 }, { weeklyGainKg: [0.14, 0.28] }), 'slow');
});
