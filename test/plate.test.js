import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultState } from '../src/store.js';
import { effectiveCatalog, autoPlan } from '../src/shopping.js';
import { plateGroup, recipePlate, planPlate } from '../src/plate.js';
import { servingNutritionMap } from '../src/nutrition.js';

test('foods sort into Food Guide plate groups', () => {
  const cat = effectiveCatalog(defaultState());
  assert.equal(plateGroup('potatoes', cat), 'vegfruit');
  assert.equal(plateGroup('canned tomatoes', cat), 'vegfruit');
  assert.equal(plateGroup('orange juice', cat), 'other');
  assert.equal(plateGroup('dried lentils', cat), 'protein');
  assert.equal(plateGroup('cheese', cat), 'protein');
  assert.equal(plateGroup('milk', cat), 'other');
  assert.equal(plateGroup('bacon', cat), 'other');
  assert.equal(plateGroup('brown rice', cat), 'wholegrain');
  assert.equal(plateGroup('pasta', cat), 'refinedgrain');
});

test('dry grains count at cooked weight', () => {
  const cat = effectiveCatalog(defaultState());
  const r = { id: 'x', servings: 1, ingredients: [{ name: 'white rice', qty: 100, unit: 'g' }, { name: 'broccoli', qty: 281, unit: 'g' }] };
  const p = recipePlate(r, cat);
  assert.equal(p.grams.refinedgrain, Math.round(100 * 365 / 130)); // 281 g cooked
  assert.equal(p.share.vegfruit, 50);
});

test('plan plate flags few vegetables and refined grains', () => {
  const s = defaultState();
  const cat = effectiveCatalog(s);
  s.plan = [{ id: 'p1', recipeId: 'r-fried-rice', servings: 2 }];
  const p = planPlate(s, cat);
  assert.ok(p.share.vegfruit < 40);
  assert.ok(p.tips.includes('vegfruit') && p.tips.includes('wholegrain'));
  assert.equal(p.lowVeg[0].recipe.id, 'r-fried-rice');
});

test('auto-plan skips snacks and, with targets, plans more filling meals', () => {
  const plain = defaultState();
  const a = autoPlan(plain).plan;
  const withTargets = defaultState();
  Object.assign(withTargets.profile, { sex: 'male', age: 25, heightCm: 170, weightKg: 57, goalWeightKg: 66 });
  const b = autoPlan(withTargets).plan;
  const cat = effectiveCatalog(plain);
  const n = servingNutritionMap(plain.recipes, cat);
  const kcal = (plan) => plan.reduce((sum, p) => sum + n.get(p.recipeId).kcal * p.servings, 0) / plan.reduce((sum, p) => sum + p.servings, 0);
  for (const p of [...a, ...b]) assert.ok(!plain.recipes.find((r) => r.id === p.recipeId).tags?.includes('snack'));
  assert.ok(kcal(b) > kcal(a), `${kcal(b)} > ${kcal(a)}`);
});
