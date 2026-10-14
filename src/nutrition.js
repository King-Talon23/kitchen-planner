// Nutrition targets and what the planned meals provide.
//
// Energy: Mifflin-St Jeor resting energy, which a systematic review found
// most likely of the common equations to land within 10% of measured RMR
// (Frankenfield et al., J Am Diet Assoc 2005;105(5):775-89,
// https://doi.org/10.1016/j.jada.2005.02.005), times a physical activity
// level (PAL) from the FAO/WHO/UNU lifestyle bands
// (https://www.fao.org/3/y5686e/y5686e07.htm, table 5.3).
//
// Weight gain: a 10-20% energy surplus, 1.6-2.2 g protein per kg per day
// and 0.5-1.5 g fat per kg, aiming for 0.25-0.5% of body weight gained per
// week (Iraki et al., Sports 2019;7(7):154, https://doi.org/10.3390/sports7070154).
// Protein gains for muscle level off around 1.6 g/kg/day (Morton et al.,
// Br J Sports Med 2018;52:376-84, https://doi.org/10.1136/bjsports-2017-097608).
// These recommendations assume you are also doing resistance training.

import { NUTRIENTS } from './data/nutrients.js';
import { toBase, normalizeName, AVG_WEIGHT_G } from './units.js';
import { canonicalName } from './inventory.js';
import { priceFor } from './shopping.js';

export const LB_PER_KG = 2.20462;
export const CM_PER_IN = 2.54;

// Midpoints of the FAO/WHO/UNU PAL bands.
export const ACTIVITY = {
  light: { pal: 1.55, label: 'Sedentary or light (desk job, little exercise)' },
  moderate: { pal: 1.85, label: 'Active (on your feet a lot, or regular workouts)' },
  vigorous: { pal: 2.2, label: 'Vigorous (physical job or hard daily training)' },
};

export const GOALS = {
  gain: { label: 'Gain weight', surplus: [0.10, 0.20], protein: [1.6, 2.2], fat: [0.5, 1.5] },
  maintain: { label: 'Maintain weight', surplus: [0, 0], protein: [1.6, 2.2], fat: [0.5, 1.5] },
};

export function profileComplete(p) {
  return ['sex', 'age', 'heightCm', 'weightKg'].every((k) => p?.[k] !== '' && p?.[k] != null && (k === 'sex' || Number(p[k]) > 0));
}

export function restingEnergy({ sex, age, heightCm, weightKg }) {
  const base = 10 * Number(weightKg) + 6.25 * Number(heightCm) - 5 * Number(age);
  return sex === 'female' ? base - 161 : base + 5;
}

export function dailyTargets(profile) {
  if (!profileComplete(profile)) return null;
  const weight = Number(profile.weightKg);
  const goal = GOALS[profile.goal] ?? GOALS.gain;
  const pal = (ACTIVITY[profile.activity] ?? ACTIVITY.light).pal;
  const rmr = restingEnergy(profile);
  const maintenance = rmr * pal;
  const mid = (goal.surplus[0] + goal.surplus[1]) / 2;
  const kcal = maintenance * (1 + mid);
  const protein = [goal.protein[0] * weight, goal.protein[1] * weight];
  const fat = [goal.fat[0] * weight, goal.fat[1] * weight];
  // Carbohydrate fills the rest, using the protein and fat midpoints.
  const carbs = Math.max(0, (kcal - 4 * avg(protein) - 9 * avg(fat)) / 4);
  const result = {
    rmr: Math.round(rmr),
    maintenance: Math.round(maintenance),
    kcal: Math.round(kcal),
    kcalRange: goal.surplus.map((s) => Math.round(maintenance * (1 + s))),
    protein: protein.map(Math.round),
    fat: fat.map(Math.round),
    carbs: Math.round(carbs),
  };
  if (profile.goal === 'gain' && Number(profile.goalWeightKg) > weight) {
    const toGain = Number(profile.goalWeightKg) - weight;
    const perWeek = [0.0025 * weight, 0.005 * weight];
    result.weeklyGainKg = perWeek.map((n) => Math.round(n * 100) / 100);
    result.weeksToGoal = [Math.ceil(toGain / perWeek[1]), Math.ceil(toGain / perWeek[0])];
  }
  return result;
}

function nutrientsFor(name, catalog) {
  return NUTRIENTS[canonicalName(name, catalog)] ?? NUTRIENTS[normalizeName(name)] ?? null;
}

// Grams (or ml, for foods listed per 100 ml) of an ingredient amount.
// Liquids listed per 100 g, like oil, are treated as 1 g per ml: close
// enough for planning, not for weighing.
function amountIn100s(name, base, data) {
  if (base.unit === 'ea') {
    const each = data.unitGrams ?? AVG_WEIGHT_G[normalizeName(name)];
    return each ? (base.qty * each) / 100 : null;
  }
  return base.qty / 100;
}

// Grams of an ingredient amount, or null when a count ("2 ea") has no known
// weight. Used for the plate check.
export function gramsOf(name, qty, unit, catalog) {
  const key = canonicalName(name, catalog);
  const base = toBase(qty, unit);
  const data = NUTRIENTS[key] ?? NUTRIENTS[normalizeName(name)] ?? {};
  const hundreds = amountIn100s(key, base, data);
  return hundreds == null ? null : hundreds * 100;
}

// Energy (kcal) of one serving, and protein, for each recipe; cached per call.
export function servingNutritionMap(recipes, catalog) {
  return new Map(recipes.map((r) => [r.id, recipeNutrition(r, catalog).perServing]));
}

export function ingredientNutrition(name, qty, unit, catalog) {
  const data = nutrientsFor(name, catalog);
  if (!data) return null;
  const hundreds = amountIn100s(canonicalName(name, catalog), toBase(qty, unit), data);
  if (hundreds == null) return null;
  return { kcal: data.kcal * hundreds, protein: data.protein * hundreds, fat: data.fat * hundreds, carbs: data.carbs * hundreds };
}

export function recipeNutrition(recipe, catalog) {
  const total = { kcal: 0, protein: 0, fat: 0, carbs: 0 };
  const unknown = [];
  for (const ing of recipe.ingredients) {
    if (ing.optional) continue;
    const n = ingredientNutrition(ing.name, ing.qty, ing.unit, catalog);
    if (!n) {
      unknown.push(ing.name);
      continue;
    }
    for (const k of Object.keys(total)) total[k] += n[k];
  }
  const per = (v) => Math.round(v / recipe.servings);
  return {
    perServing: { kcal: per(total.kcal), protein: per(total.protein), fat: per(total.fat), carbs: per(total.carbs) },
    total: Object.fromEntries(Object.entries(total).map(([k, v]) => [k, Math.round(v)])),
    unknown,
  };
}

// What the week's planned meals give one person per day, on average.
export function planNutrition(state, catalog) {
  const people = Number(state.settings?.people ?? 1);
  const total = { kcal: 0, protein: 0, fat: 0, carbs: 0 };
  for (const p of state.plan || []) {
    const recipe = state.recipes.find((r) => r.id === p.recipeId);
    if (!recipe) continue;
    const n = recipeNutrition(recipe, catalog);
    const scale = Number(p.servings) / recipe.servings;
    for (const k of Object.keys(total)) total[k] += n.total[k] * scale;
  }
  return Object.fromEntries(Object.entries(total).map(([k, v]) => [k, Math.round(v / 7 / people)]));
}

// Plain sugar tops any calories-per-dollar list but isn't a useful food to
// build meals around, so it's left out.
const EXCLUDE_FROM_VALUE = new Set(['sugar']);

// Foods ranked by how many calories (or grams of protein) a dollar buys,
// using the current prices. Useful for closing a calorie gap cheaply.
export function valueRanking(catalog, by = 'kcal', limit = 10) {
  const rows = [];
  for (const entry of catalog) {
    if (EXCLUDE_FROM_VALUE.has(entry.key)) continue;
    const data = NUTRIENTS[normalizeName(entry.key)];
    if (!data) continue;
    const pack = toBase(entry.pack.qty, entry.pack.unit);
    const priced = priceFor(entry.key, entry.perWeight ? 1000 : pack.qty, pack.unit, catalog);
    if (!priced || !priced.cost) continue;
    const n = ingredientNutrition(entry.key, priced.buyQty, priced.buyUnit, catalog);
    if (!n) continue;
    rows.push({
      key: entry.key, cost: priced.cost, buy: priced.buy,
      kcalPerDollar: Math.round(n.kcal / priced.cost), proteinPerDollar: Math.round((n.protein / priced.cost) * 10) / 10,
      kcalPer100: data.kcal, proteinPer100: data.protein, per: data.per,
    });
  }
  const field = by === 'protein' ? 'proteinPerDollar' : 'kcalPerDollar';
  return rows.sort((a, b) => b[field] - a[field]).slice(0, limit);
}

function avg([a, b]) {
  return (a + b) / 2;
}
