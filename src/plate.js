// A Canada's Food Guide plate check: Health Canada's healthy plate is half
// vegetables and fruits, a quarter whole grain foods and a quarter protein
// foods, and "you can use the plate as a guide even when the foods in your
// meal are mixed together"
// (https://www.canada.ca/en/health-canada/services/food-guide/eating-support/cooking/make-healthy-meals-plate.html).
//
// Foods are grouped following Health Canada's 2019 Canada's Food Guide Food
// Classification System
// (https://www.canada.ca/en/health-canada/services/publications/food-nutrition/2019-canada-food-guide-food-classification-system-foods-beverages-categories.html):
// - vegetables and fruits include potatoes, sweet potatoes, corn and tomato
//   sauce, but not juice (juice is a beverage);
// - protein foods include legumes, tofu, nuts and peanuts, eggs, poultry,
//   red meat, fish and shellfish, cheese and yogurt; milk is a beverage;
// - whole grain foods have whole grain as the first ingredient; most white
//   bread and pasta are refined (non-whole grain) foods;
// - processed meats (bacon, wieners), condiments and sauces, oils and fats,
//   and sugar are outside the plate groups.
// Items the classification doesn't name are placed by inference and marked
// below: peanut butter (peanuts), hummus (chickpeas), cereal, crackers, flour
// and pita (assumed refined, as most are), frozen fries and pizza (left out,
// as prepared or mixed foods).
//
// The plate is about how much room each food takes on your plate; this
// check uses the weight of each food in the recipe (dry grains and legumes
// counted at their cooked weight), so it's a rough guide, not a measurement.

import { gramsOf } from './nutrition.js';
import { canonicalName } from './inventory.js';
import { normalizeName } from './units.js';
import { COOKED_KCAL, NUTRIENTS } from './data/nutrients.js';

export const PLATE_SOURCE = 'https://www.canada.ca/en/health-canada/services/food-guide/eating-support/cooking/make-healthy-meals-plate.html';

const GROUPS = {
  vegfruit: ['apple', 'banana', 'orange', 'pear', 'grape', 'lemon', 'lime', 'avocado', 'strawberry', 'potato', 'sweet potato', 'tomato',
    'cabbage', 'carrot', 'onion', 'celery', 'cucumber', 'mushroom', 'romaine lettuce', 'broccoli', 'pepper', 'squash', 'salad greens',
    'frozen mixed vegetables', 'frozen broccoli', 'frozen green beans', 'frozen corn', 'frozen peas', 'frozen spinach', 'frozen strawberries',
    'canned tomatoes', 'canned corn', 'pasta sauce'],
  protein: ['ground beef', 'stewing beef', 'sirloin steak', 'pork loin', 'pork shoulder', 'whole chicken', 'chicken breast', 'chicken thigh',
    'chicken drumstick', 'salmon', 'shrimp', 'canned tuna', 'canned salmon', 'canned beans', 'baked beans', 'dried lentils', 'dry beans',
    'tofu', 'egg', 'cheese', 'yogurt', 'almonds', 'peanuts', 'peanut butter', 'hummus'],
  wholegrain: ['brown rice'],
  refinedgrain: ['white rice', 'pasta', 'bread', 'pita', 'cereal', 'crackers', 'flour'],
};
const GROUP_OF = new Map(Object.entries(GROUPS).flatMap(([g, keys]) => keys.map((k) => [normalizeName(k), g])));

export function plateGroup(name, catalog) {
  return GROUP_OF.get(normalizeName(canonicalName(name, catalog))) ?? 'other';
}

function eatenGrams(name, qty, unit, catalog) {
  const grams = gramsOf(name, qty, unit, catalog);
  if (grams == null) return null;
  const key = normalizeName(canonicalName(name, catalog));
  const cooked = COOKED_KCAL[key];
  const dry = NUTRIENTS[key]?.kcal;
  return cooked && dry ? grams * (dry / cooked) : grams;
}

// Grams per plate group for a list of [recipe, servings].
export function plateOf(items, catalog) {
  const grams = { vegfruit: 0, protein: 0, wholegrain: 0, refinedgrain: 0, other: 0 };
  const unknown = new Set();
  for (const [recipe, servings] of items) {
    const scale = Number(servings) / recipe.servings;
    for (const ing of recipe.ingredients) {
      if (ing.optional) continue;
      const g = eatenGrams(ing.name, ing.qty * scale, ing.unit, catalog);
      if (g == null) {
        unknown.add(ing.name);
        continue;
      }
      grams[plateGroup(ing.name, catalog)] += g;
    }
  }
  const onPlate = grams.vegfruit + grams.protein + grams.wholegrain + grams.refinedgrain;
  const share = (g) => (onPlate ? Math.round((g / onPlate) * 100) : 0);
  return {
    grams: Object.fromEntries(Object.entries(grams).map(([k, v]) => [k, Math.round(v)])),
    share: { vegfruit: share(grams.vegfruit), protein: share(grams.protein), grains: share(grams.wholegrain + grams.refinedgrain), wholegrain: share(grams.wholegrain) },
    unknown: [...unknown],
  };
}

export function recipePlate(recipe, catalog) {
  return plateOf([[recipe, recipe.servings]], catalog);
}

// The week's plan, plus tips where it's furthest from the plate.
export function planPlate(state, catalog) {
  const items = state.plan
    .map((p) => [state.recipes.find((r) => r.id === p.recipeId), p.servings])
    .filter(([r]) => r);
  const plate = plateOf(items, catalog);
  const tips = [];
  if (items.length) {
    if (plate.share.vegfruit < 40) tips.push('vegfruit');
    if (plate.share.grains > 0 && plate.share.wholegrain < plate.share.grains / 2) tips.push('wholegrain');
    if (plate.share.protein < 15) tips.push('protein');
  }
  // Planned recipes with the fewest vegetables and fruits.
  const lowVeg = [...new Map(items.map(([r]) => [r.id, r])).values()]
    .map((r) => ({ recipe: r, share: recipePlate(r, catalog).share.vegfruit }))
    .filter((x) => x.share < 40)
    .sort((a, b) => a.share - b.share)
    .slice(0, 3);
  return { ...plate, tips, lowVeg, meals: items.length };
}
