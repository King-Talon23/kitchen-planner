// Default grocery prices, in CAD.
//
// Source: Statistics Canada, Table 18-10-0245-01 "Monthly average retail
// prices for selected products", geography Canada. The numbers live in
// statcan-latest.js, which a monthly GitHub Action refreshes from the
// newest release (scripts/update-prices.js). The prices written below are
// the August 2026 values, used only if an item goes missing from the table.
// https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810024501
// https://doi.org/10.25318/1810024501-eng
//
// These are national averages built from retailer scanner data, so your own
// store will differ. Override any price in the app's Prices tab.
//
// Each entry describes what you can buy:
//   pack      - the size a price applies to, in a unit from units.js
//   perWeight - true when the price is per kilogram and any weight can be
//               bought (meat, loose produce); otherwise whole packs are bought
//   statcan   - the exact product label in the StatCan table

import { STATCAN_PRICES } from './statcan-latest.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const [year, month] = STATCAN_PRICES.month.split('-').map(Number);

export const PRICE_SOURCE = {
  name: `Statistics Canada, Table 18-10-0245-01 (Canada, ${MONTHS[month - 1]} ${year})`,
  url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810024501',
  month: STATCAN_PRICES.month,
  updated: STATCAN_PRICES.updated,
};

const p = (key, statcan, fallback, qty, unit, opts = {}) => ({
  key, statcan, price: STATCAN_PRICES.prices[statcan] ?? fallback, pack: { qty, unit }, aliases: [], perWeight: false, category: 'other', ...opts,
});

export const DEFAULT_PRICES = [
  // Meat and fish
  p('ground beef', 'Ground beef, per kilogram', 16.75, 1, 'kg', { perWeight: true, category: 'meat' }),
  p('stewing beef', 'Beef stewing cuts, per kilogram', 23.26, 1, 'kg', { perWeight: true, category: 'meat', aliases: ['beef stew meat'] }),
  p('sirloin steak', 'Beef top sirloin cuts, per kilogram', 27.81, 1, 'kg', { perWeight: true, category: 'meat', aliases: ['steak'] }),
  p('pork loin', 'Pork loin cuts, per kilogram', 9.21, 1, 'kg', { perWeight: true, category: 'meat', aliases: ['pork chop'] }),
  p('pork shoulder', 'Pork shoulder cuts, per kilogram', 9.22, 1, 'kg', { perWeight: true, category: 'meat' }),
  p('whole chicken', 'Whole chicken, per kilogram', 7.13, 1, 'kg', { perWeight: true, category: 'meat' }),
  p('chicken breast', 'Chicken breasts, per kilogram', 14.41, 1, 'kg', { perWeight: true, category: 'meat' }),
  p('chicken thigh', 'Chicken thigh, per kilogram', 13.42, 1, 'kg', { perWeight: true, category: 'meat' }),
  p('chicken drumstick', 'Chicken drumsticks, per kilogram', 7.50, 1, 'kg', { perWeight: true, category: 'meat' }),
  p('bacon', 'Bacon, 500 grams', 6.58, 500, 'g', { category: 'meat' }),
  p('wiener', 'Wieners, 400 grams', 4.43, 400, 'g', { category: 'meat', aliases: ['hot dog'] }),
  p('salmon', 'Salmon, per kilogram', 27.70, 1, 'kg', { perWeight: true, category: 'meat' }),
  p('shrimp', 'Shrimp, 300 grams', 7.40, 300, 'g', { category: 'meat' }),
  p('canned tuna', 'Canned tuna, 170 grams', 1.70, 170, 'g', { category: 'pantry', aliases: ['tuna'] }),
  p('canned salmon', 'Canned salmon, 213 grams', 5.59, 213, 'g', { category: 'pantry' }),
  p('tofu', 'Tofu, 350 grams', 2.92, 350, 'g', { category: 'fridge' }),

  // Dairy and eggs
  p('milk', 'Milk, 4 litres', 6.99, 4, 'l', { category: 'dairy' }),
  p('cream', 'Cream, 1 litre', 4.96, 1, 'l', { category: 'dairy' }),
  p('butter', 'Butter, 454 grams', 5.68, 454, 'g', { category: 'dairy' }),
  p('cheese', 'Block cheese, 500 grams', 7.05, 500, 'g', { category: 'dairy', aliases: ['block cheese', 'cheddar'] }),
  p('yogurt', 'Yogurt, 500 grams', 3.94, 500, 'g', { category: 'dairy', aliases: ['yoghurt'] }),
  p('egg', 'Eggs, 1 dozen', 4.83, 1, 'dozen', { category: 'dairy' }),

  // Produce
  p('apple', 'Apples, per kilogram', 6.47, 1, 'kg', { perWeight: true, category: 'produce' }),
  p('banana', 'Bananas, per kilogram', 1.89, 1, 'kg', { perWeight: true, category: 'produce' }),
  p('orange', 'Oranges, per kilogram', 4.53, 1, 'kg', { perWeight: true, category: 'produce' }),
  p('pear', 'Pears, per kilogram', 5.72, 1, 'kg', { perWeight: true, category: 'produce' }),
  p('grape', 'Grapes, per kilogram', 6.83, 1, 'kg', { perWeight: true, category: 'produce' }),
  p('lemon', 'Lemons, unit', 1.08, 1, 'ea', { category: 'produce' }),
  p('lime', 'Limes, unit', 0.84, 1, 'ea', { category: 'produce' }),
  p('avocado', 'Avocado, unit', 1.98, 1, 'ea', { category: 'produce' }),
  p('strawberry', 'Strawberries, 454 grams', 4.34, 454, 'g', { category: 'produce' }),
  p('potato', 'Potatoes, 4.54 kilograms', 4.87, 4.54, 'kg', { category: 'produce' }),
  p('sweet potato', 'Sweet potatoes, per kilogram', 4.95, 1, 'kg', { perWeight: true, category: 'produce' }),
  p('tomato', 'Tomatoes, per kilogram', 4.80, 1, 'kg', { perWeight: true, category: 'produce' }),
  p('cabbage', 'Cabbage, per kilogram', 2.63, 1, 'kg', { perWeight: true, category: 'produce' }),
  p('carrot', 'Carrots, 1.36 kilograms', 3.89, 1.36, 'kg', { category: 'produce' }),
  p('onion', 'Onions, 1.36 kilograms', 4.58, 1.36, 'kg', { category: 'produce' }),
  p('celery', 'Celery, unit', 2.68, 1, 'ea', { category: 'produce' }),
  p('cucumber', 'Cucumber, unit', 1.35, 1, 'ea', { category: 'produce' }),
  p('mushroom', 'Mushrooms, 227 grams', 2.44, 227, 'g', { category: 'produce' }),
  p('romaine lettuce', 'Romaine lettuce, unit', 3.17, 1, 'ea', { category: 'produce', aliases: ['lettuce'] }),
  p('broccoli', 'Broccoli, unit', 2.44, 1, 'ea', { category: 'produce' }),
  p('pepper', 'Peppers, per kilogram', 5.85, 1, 'kg', { perWeight: true, category: 'produce', aliases: ['bell pepper'] }),
  p('squash', 'Squash, per kilogram', 4.82, 1, 'kg', { perWeight: true, category: 'produce' }),
  p('salad greens', 'Salad greens, 142 grams', 4.56, 142, 'g', { category: 'produce', aliases: ['spinach'] }),

  // Frozen
  p('frozen mixed vegetables', 'Frozen mixed vegetables, 750 grams', 4.33, 750, 'g', { category: 'frozen' }),
  p('frozen broccoli', 'Frozen broccoli, 500 grams', 4.02, 500, 'g', { category: 'frozen' }),
  p('frozen green beans', 'Frozen green beans, 750 grams', 4.59, 750, 'g', { category: 'frozen', aliases: ['green bean'] }),
  p('frozen corn', 'Frozen corn, 750 grams', 3.77, 750, 'g', { category: 'frozen' }),
  p('frozen peas', 'Frozen peas, 750 grams', 3.77, 750, 'g', { category: 'frozen', aliases: ['pea'] }),
  p('frozen spinach', 'Frozen spinach, 300 grams', 2.25, 300, 'g', { category: 'frozen' }),
  p('frozen strawberries', 'Frozen strawberries, 600 grams', 5.33, 600, 'g', { category: 'frozen' }),
  p('frozen fries', 'Frozen french fried potatoes, 750 grams', 3.49, 750, 'g', { category: 'frozen' }),
  p('frozen pizza', 'Frozen pizza, 390 grams', 4.72, 390, 'g', { category: 'frozen' }),

  // Bakery and grains
  p('bread', 'White bread, 675 grams', 3.63, 675, 'g', { category: 'bakery', aliases: ['white bread'] }),
  p('pita', 'Flatbread and pita, 500 grams', 3.60, 500, 'g', { category: 'bakery', aliases: ['flatbread', 'tortilla'] }),
  p('pasta', 'Dry or fresh pasta, 500 grams', 3.37, 500, 'g', { category: 'pantry', aliases: ['spaghetti', 'penne', 'macaroni'] }),
  p('white rice', 'White rice, 2 kilograms', 9.73, 2, 'kg', { category: 'pantry', aliases: ['rice'] }),
  p('brown rice', 'Brown rice, 900 grams', 5.87, 900, 'g', { category: 'pantry' }),
  p('cereal', 'Cereal, 400 grams', 4.17, 400, 'g', { category: 'pantry' }),
  p('flour', 'Wheat flour, 2.5 kilograms', 5.38, 2.5, 'kg', { category: 'pantry', aliases: ['wheat flour', 'all-purpose flour'] }),
  p('sugar', 'White sugar, 2 kilograms', 2.78, 2, 'kg', { category: 'pantry', aliases: ['white sugar'] }),
  p('crackers', 'Crackers and crisp breads, 200 grams', 2.54, 200, 'g', { category: 'pantry' }),

  // Pantry
  p('vegetable oil', 'Vegetable oil, 3 litres', 9.82, 3, 'l', { category: 'pantry', aliases: ['oil'] }),
  p('canola oil', 'Canola oil, 3 litres', 10.92, 3, 'l', { category: 'pantry' }),
  p('olive oil', 'Olive oil, 1 litre', 12.29, 1, 'l', { category: 'pantry' }),
  p('peanut butter', 'Peanut butter, 1 kilogram', 5.95, 1, 'kg', { category: 'pantry' }),
  p('mayonnaise', 'Mayonnaise, 890 millilitres', 6.40, 890, 'ml', { category: 'pantry', aliases: ['mayo'] }),
  p('ketchup', 'Ketchup, 1 litre', 4.57, 1, 'l', { category: 'pantry' }),
  p('canned tomatoes', 'Canned tomatoes, 796 millilitres', 2.18, 796, 'ml', { category: 'pantry', aliases: ['diced tomatoes', 'crushed tomatoes'] }),
  p('canned beans', 'Canned beans and lentils, 540 millilitres', 1.70, 540, 'ml', { category: 'pantry', aliases: ['black beans', 'kidney beans', 'chickpeas'] }),
  p('baked beans', 'Canned baked beans, 398 millilitres', 1.64, 398, 'ml', { category: 'pantry' }),
  p('canned corn', 'Canned corn, 341 millilitres', 1.69, 341, 'ml', { category: 'pantry' }),
  p('canned soup', 'Canned soup, 284 millilitres', 1.33, 284, 'ml', { category: 'pantry', aliases: ['tomato soup'] }),
  p('dried lentils', 'Dried lentils, 900 grams', 3.63, 900, 'g', { category: 'pantry', aliases: ['lentils', 'lentil'] }),
  p('dry beans', 'Dry beans and legumes, 900 grams', 3.58, 900, 'g', { category: 'pantry' }),
  p('pasta sauce', 'Pasta sauce, 650 millilitres', 3.42, 650, 'ml', { category: 'pantry', aliases: ['tomato sauce'] }),
  p('salsa', 'Salsa, 418 millilitres', 5.04, 418, 'ml', { category: 'pantry' }),
  p('salad dressing', 'Salad dressing, 475 millilitres', 3.55, 475, 'ml', { category: 'pantry' }),
  p('hummus', 'Hummus, 227 grams', 3.83, 227, 'g', { category: 'fridge' }),
  p('coffee', 'Roasted or ground coffee, 340 grams', 9.46, 340, 'g', { category: 'pantry' }),
  p('tea', 'Tea (20 bags)', 4.40, 20, 'ea', { category: 'pantry', aliases: ['tea bag'] }),
  p('apple juice', 'Apple juice, 2 litres', 4.12, 2, 'l', { category: 'pantry' }),
  p('orange juice', 'Orange juice, 2 litres', 6.22, 2, 'l', { category: 'fridge' }),
  p('almonds', 'Almonds, 200 grams', 5.55, 200, 'g', { category: 'pantry' }),
  p('peanuts', 'Peanuts, 450 grams', 4.35, 450, 'g', { category: 'pantry' }),
];
