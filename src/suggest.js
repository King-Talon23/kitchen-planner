// Meal suggestions: rank recipes by how much of each one is already in the
// kitchen, favouring recipes that use food about to expire.

import { recipeNeeds, consume, expiringSoon, canonicalName, today } from './inventory.js';

export function recipeCoverage(recipe, inventory, catalog, servings = recipe.servings) {
  const stock = structuredClone(inventory);
  const missing = [];
  let covered = 0;
  let counted = 0;
  for (const ing of recipeNeeds(recipe, servings)) {
    if (ing.optional) continue;
    counted += 1;
    const short = consume(stock, ing.name, ing.base.qty, ing.base.unit, catalog);
    covered += 1 - short / ing.base.qty;
    if (short > 0) missing.push({ name: ing.name, qty: short, unit: ing.base.unit });
  }
  return { coverage: counted ? covered / counted : 1, missing, canMake: missing.length === 0 };
}

export function suggestMeals(state, catalog, { on = today(), days = 3 } = {}) {
  const expiring = new Set(expiringSoon(state, on, days).map((item) => canonicalName(item.name, catalog)));
  return state.recipes
    .map((recipe) => {
      const result = recipeCoverage(recipe, state.inventory, catalog);
      const usesExpiring = recipe.ingredients
        .filter((ing) => expiring.has(canonicalName(ing.name, catalog)))
        .map((ing) => ing.name);
      return { recipe, ...result, usesExpiring };
    })
    .sort(
      (a, b) => Number(b.canMake) - Number(a.canMake)
        || b.usesExpiring.length - a.usesExpiring.length
        || b.coverage - a.coverage
        || a.recipe.name.localeCompare(b.recipe.name),
    );
}
