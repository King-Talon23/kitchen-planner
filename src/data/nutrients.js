// Energy and macronutrients per 100 g (or per 100 ml where per is '100ml'),
// as purchased: raw meat, fish and produce; dry pasta, rice, lentils and flour.
//
// Source: USDA FoodData Central, SR Legacy (fdc = the food's FDC id, viewable at
// https://fdc.nal.usda.gov/food-details/<fdc>/nutrients). Liquids were converted
// from per-100 g using FDC's own cup weights. unitGrams is FDC's portion weight
// for one item (a large egg, a medium celery stalk, a bunch of broccoli).
// Foods measured in ml but listed per 100 g (sauces, canned goods) are counted
// at 1 g per ml, which is close enough for meal planning.
// Not included: coffee and tea (no dry-product entry in SR Legacy).

export const NUTRIENT_SOURCE = 'USDA FoodData Central (SR Legacy), per 100 g as purchased.';

export const NUTRIENTS = {
  'almond': { kcal: 579, protein: 21.2, fat: 49.9, carbs: 21.6, per: '100g', fdc: 170567 },
  'apple': { kcal: 52, protein: 0.26, fat: 0.17, carbs: 13.8, per: '100g', fdc: 171688 },
  'apple juice': { kcal: 48, protein: 0.1, fat: 0.14, carbs: 11.85, per: '100ml', fdc: 173933 },
  'avocado': { kcal: 160, protein: 2, fat: 14.7, carbs: 8.53, per: '100g', unitGrams: 201, fdc: 171705 },
  'bacon': { kcal: 393, protein: 13.7, fat: 37.1, carbs: 0, per: '100g', fdc: 168277 },
  'baked bean': { kcal: 94, protein: 4.75, fat: 0.37, carbs: 21.1, per: '100g', fdc: 175182 },
  'banana': { kcal: 89, protein: 1.09, fat: 0.33, carbs: 22.8, per: '100g', fdc: 173944 },
  'bread': { kcal: 266, protein: 8.85, fat: 3.33, carbs: 49.4, per: '100g', fdc: 174924 },
  'broccoli': { kcal: 34, protein: 2.82, fat: 0.37, carbs: 6.64, per: '100g', unitGrams: 608, fdc: 170379 },
  'brown rice': { kcal: 367, protein: 7.54, fat: 3.2, carbs: 76.2, per: '100g', fdc: 169703 },
  'butter': { kcal: 717, protein: 0.85, fat: 81.1, carbs: 0.06, per: '100g', fdc: 173410 },
  'cabbage': { kcal: 25, protein: 1.28, fat: 0.1, carbs: 5.8, per: '100g', fdc: 169975 },
  'canned bean': { kcal: 124, protein: 7.98, fat: 1.05, carbs: 21.5, per: '100g', fdc: 174285 },
  'canned corn': { kcal: 67, protein: 2.29, fat: 1.22, carbs: 14.3, per: '100g', fdc: 169214 },
  'canned salmon': { kcal: 129, protein: 19.7, fat: 4.97, carbs: 0, per: '100g', fdc: 173690 },
  'canned soup': { kcal: 66, protein: 1.46, fat: 0.44, carbs: 15.2, per: '100g', fdc: 172882 },
  'canned tomato': { kcal: 16, protein: 0.79, fat: 0.25, carbs: 3.47, per: '100g', fdc: 170051 },
  'canned tuna': { kcal: 86, protein: 19.4, fat: 0.96, carbs: 0, per: '100g', fdc: 173709 },
  'canola oil': { kcal: 814, protein: 0, fat: 92.14, carbs: 0, per: '100ml', fdc: 172336 },
  'carrot': { kcal: 41, protein: 0.93, fat: 0.24, carbs: 9.58, per: '100g', fdc: 170393 },
  'celery': { kcal: 14, protein: 0.69, fat: 0.17, carbs: 2.97, per: '100g', unitGrams: 40, fdc: 169988 },
  'cereal': { kcal: 384, protein: 5.9, fat: 0.91, carbs: 88, per: '100g', fdc: 174648 },
  'cheese': { kcal: 403, protein: 22.9, fat: 33.3, carbs: 3.37, per: '100g', fdc: 173414 },
  'chicken breast': { kcal: 120, protein: 22.5, fat: 2.62, carbs: 0, per: '100g', fdc: 171077 },
  'chicken drumstick': { kcal: 161, protein: 18.1, fat: 9.2, carbs: 0.11, per: '100g', fdc: 172373 },
  'chicken thigh': { kcal: 221, protein: 16.5, fat: 16.6, carbs: 0.25, per: '100g', fdc: 172385 },
  'cracker': { kcal: 418, protein: 9.46, fat: 8.64, carbs: 74, per: '100g', fdc: 172746 },
  'cream': { kcal: 342, protein: 2.86, fat: 36.32, carbs: 2.86, per: '100ml', fdc: 170859 },
  'cucumber': { kcal: 15, protein: 0.65, fat: 0.11, carbs: 3.63, per: '100g', unitGrams: 301, fdc: 168409 },
  'dried lentil': { kcal: 352, protein: 24.6, fat: 1.06, carbs: 63.4, per: '100g', fdc: 172420 },
  'dry bean': { kcal: 333, protein: 23.6, fat: 0.83, carbs: 60, per: '100g', fdc: 175193 },
  'egg': { kcal: 143, protein: 12.6, fat: 9.51, carbs: 0.72, per: '100g', unitGrams: 50, fdc: 171287 },
  'flour': { kcal: 364, protein: 10.3, fat: 0.98, carbs: 76.3, per: '100g', fdc: 168894 },
  'frozen broccoli': { kcal: 26, protein: 2.81, fat: 0.29, carbs: 4.78, per: '100g', fdc: 169968 },
  'frozen corn': { kcal: 88, protein: 3.02, fat: 0.78, carbs: 20.7, per: '100g', fdc: 168398 },
  'frozen fry': { kcal: 147, protein: 2.24, fat: 4.66, carbs: 24.8, per: '100g', fdc: 168442 },
  'frozen green bean': { kcal: 33, protein: 1.79, fat: 0.21, carbs: 7.54, per: '100g', fdc: 169962 },
  'frozen mixed vegetable': { kcal: 72, protein: 3.33, fat: 0.52, carbs: 13.5, per: '100g', fdc: 170471 },
  'frozen pea': { kcal: 77, protein: 5.22, fat: 0.4, carbs: 13.6, per: '100g', fdc: 170016 },
  'frozen pizza': { kcal: 268, protein: 10.4, fat: 12.3, carbs: 29, per: '100g', fdc: 170317 },
  'frozen spinach': { kcal: 29, protein: 3.63, fat: 0.57, carbs: 4.21, per: '100g', fdc: 169287 },
  'frozen strawberry': { kcal: 35, protein: 0.43, fat: 0.11, carbs: 9.13, per: '100g', fdc: 168173 },
  'grape': { kcal: 69, protein: 0.72, fat: 0.16, carbs: 18.1, per: '100g', fdc: 174683 },
  'ground beef': { kcal: 254, protein: 17.2, fat: 20, carbs: 0, per: '100g', fdc: 174036 },
  'hummus': { kcal: 237, protein: 7.78, fat: 17.8, carbs: 15, per: '100g', fdc: 174289 },
  'ketchup': { kcal: 101, protein: 1.04, fat: 0.1, carbs: 27.4, per: '100g', fdc: 168556 },
  'lemon': { kcal: 29, protein: 1.1, fat: 0.3, carbs: 9.32, per: '100g', unitGrams: 84, fdc: 167746 },
  'lime': { kcal: 30, protein: 0.7, fat: 0.2, carbs: 10.5, per: '100g', unitGrams: 67, fdc: 168155 },
  'mayonnaise': { kcal: 680, protein: 0.96, fat: 74.8, carbs: 0.57, per: '100g', fdc: 171009 },
  'milk': { kcal: 52, protein: 3.43, fat: 2.06, carbs: 4.99, per: '100ml', fdc: 172205 },
  'mushroom': { kcal: 22, protein: 3.09, fat: 0.34, carbs: 3.26, per: '100g', fdc: 169251 },
  'olive oil': { kcal: 807, protein: 0, fat: 91.3, carbs: 0, per: '100ml', fdc: 171413 },
  'onion': { kcal: 40, protein: 1.1, fat: 0.1, carbs: 9.34, per: '100g', fdc: 170000 },
  'orange': { kcal: 47, protein: 0.94, fat: 0.12, carbs: 11.8, per: '100g', fdc: 169097 },
  'orange juice': { kcal: 52, protein: 0.72, fat: 0.13, carbs: 12.1, per: '100ml', fdc: 169100 },
  'pasta': { kcal: 371, protein: 13, fat: 1.51, carbs: 74.7, per: '100g', fdc: 169736 },
  'pasta sauce': { kcal: 50, protein: 1.39, fat: 1.61, carbs: 7.43, per: '100g', fdc: 171192 },
  'peanut butter': { kcal: 598, protein: 22.2, fat: 51.4, carbs: 22.3, per: '100g', fdc: 172470 },
  'peanut': { kcal: 567, protein: 25.8, fat: 49.2, carbs: 16.1, per: '100g', fdc: 172430 },
  'pear': { kcal: 57, protein: 0.36, fat: 0.14, carbs: 15.2, per: '100g', fdc: 169118 },
  'pepper': { kcal: 26, protein: 0.99, fat: 0.3, carbs: 6.03, per: '100g', fdc: 170108 },
  'pita': { kcal: 275, protein: 9.1, fat: 1.2, carbs: 55.7, per: '100g', fdc: 174915 },
  'pork loin': { kcal: 198, protein: 19.7, fat: 12.6, carbs: 0, per: '100g', fdc: 167818 },
  'pork shoulder': { kcal: 236, protein: 17.2, fat: 18, carbs: 0, per: '100g', fdc: 167843 },
  'potato': { kcal: 77, protein: 2.05, fat: 0.09, carbs: 17.5, per: '100g', fdc: 170026 },
  'romaine lettuce': { kcal: 17, protein: 1.23, fat: 0.3, carbs: 3.29, per: '100g', unitGrams: 626, fdc: 169247 },
  'salad dressing': { kcal: 240, protein: 0.41, fat: 21.1, carbs: 12.1, per: '100g', fdc: 171019 },
  'salad green': { kcal: 15, protein: 1.36, fat: 0.15, carbs: 2.87, per: '100g', fdc: 169249 },
  'salmon': { kcal: 208, protein: 20.4, fat: 13.4, carbs: 0, per: '100g', fdc: 175167 },
  'salsa': { kcal: 29, protein: 1.52, fat: 0.17, carbs: 6.64, per: '100g', fdc: 174524 },
  'shrimp': { kcal: 85, protein: 20.1, fat: 0.51, carbs: 0, per: '100g', fdc: 175179 },
  'sirloin steak': { kcal: 201, protein: 20.3, fat: 12.7, carbs: 0, per: '100g', fdc: 168726 },
  'squash': { kcal: 34, protein: 0.95, fat: 0.13, carbs: 8.59, per: '100g', fdc: 170489 },
  'stewing beef': { kcal: 128, protein: 21.8, fat: 4.48, carbs: 0.16, per: '100g', fdc: 171206 },
  'strawberry': { kcal: 32, protein: 0.67, fat: 0.3, carbs: 7.68, per: '100g', fdc: 167762 },
  'sugar': { kcal: 387, protein: 0, fat: 0, carbs: 100, per: '100g', fdc: 169655 },
  'sweet potato': { kcal: 86, protein: 1.57, fat: 0.05, carbs: 20.1, per: '100g', fdc: 168482 },
  'tofu': { kcal: 144, protein: 17.3, fat: 8.72, carbs: 2.78, per: '100g', fdc: 172475 },
  'tomato': { kcal: 18, protein: 0.88, fat: 0.2, carbs: 3.89, per: '100g', fdc: 170457 },
  'vegetable oil': { kcal: 814, protein: 0, fat: 92.14, carbs: 0, per: '100ml', fdc: 171411 },
  'white rice': { kcal: 365, protein: 7.13, fat: 0.66, carbs: 80, per: '100g', fdc: 169756 },
  'whole chicken': { kcal: 215, protein: 18.6, fat: 15.1, carbs: 0, per: '100g', fdc: 171447 },
  'wiener': { kcal: 290, protein: 10.3, fat: 25.8, carbs: 4.17, per: '100g', fdc: 172968 },
  'yogurt': { kcal: 63, protein: 5.25, fat: 1.55, carbs: 7.04, per: '100g', fdc: 170886 },
};

// Dry grains and legumes swell when cooked. For the plate check their weight
// is turned into cooked weight with the ratio of dry to cooked energy per
// 100 g (the calories don't change, the water does). Cooked values, USDA
// FoodData Central SR Legacy: white rice, long-grain, enriched, cooked 130
// kcal (FDC 168878); brown rice, long-grain, cooked 123 (NDB 20037); pasta,
// cooked, enriched, without added salt 158 (FDC 169737); lentils, mature
// seeds, cooked, boiled, without salt 116; kidney beans, all types, cooked,
// boiled, without salt 127 (NDB 16028).
export const COOKED_KCAL = { 'white rice': 130, 'brown rice': 123, 'pasta': 158, 'dried lentil': 116, 'dry bean': 127 };
