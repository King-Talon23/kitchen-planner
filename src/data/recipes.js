// Starter recipes. Ingredient names match entries in prices.js so the
// shopping list can price them. Ingredients marked optional (spices, salt)
// never block a suggestion and are not added to the shopping list.
// Edit, delete or add your own in the Recipes tab.

const i = (name, qty, unit, optional = false) => ({ name, qty, unit, optional });

export const DEFAULT_RECIPES = [
  {
    id: 'r-bolognese', name: 'Spaghetti bolognese', servings: 4, tags: ['dinner'],
    ingredients: [i('pasta', 500, 'g'), i('ground beef', 450, 'g'), i('pasta sauce', 650, 'ml'), i('onion', 1, 'ea'), i('italian seasoning', 1, 'tbsp', true)],
  },
  {
    id: 'r-chicken-stirfry', name: 'Chicken stir-fry with rice', servings: 4, tags: ['dinner'],
    ingredients: [i('chicken breast', 500, 'g'), i('frozen mixed vegetables', 750, 'g'), i('white rice', 300, 'g'), i('vegetable oil', 2, 'tbsp'), i('soy sauce', 3, 'tbsp', true)],
  },
  {
    id: 'r-sheetpan-thighs', name: 'Sheet-pan chicken thighs and potatoes', servings: 4, tags: ['dinner'],
    ingredients: [i('chicken thigh', 800, 'g'), i('potato', 800, 'g'), i('carrot', 400, 'g'), i('olive oil', 2, 'tbsp'), i('garlic powder', 1, 'tsp', true)],
  },
  {
    id: 'r-chili', name: 'Beef and bean chili', servings: 6, tags: ['dinner', 'batch'],
    ingredients: [i('ground beef', 450, 'g'), i('canned beans', 1080, 'ml'), i('canned tomatoes', 796, 'ml'), i('onion', 1, 'ea'), i('pepper', 1, 'ea'), i('chili powder', 2, 'tbsp', true)],
  },
  {
    id: 'r-lentil-soup', name: 'Lentil vegetable soup', servings: 6, tags: ['dinner', 'lunch', 'batch', 'vegetarian'],
    ingredients: [i('dried lentils', 300, 'g'), i('canned tomatoes', 796, 'ml'), i('carrot', 2, 'ea'), i('onion', 1, 'ea'), i('celery', 1, 'ea'), i('cumin', 1, 'tsp', true)],
  },
  {
    id: 'r-salmon-rice', name: 'Salmon with rice and broccoli', servings: 2, tags: ['dinner'],
    ingredients: [i('salmon', 400, 'g'), i('white rice', 200, 'g'), i('broccoli', 1, 'ea'), i('butter', 30, 'g'), i('lemon', 1, 'ea', true)],
  },
  {
    id: 'r-tofu-stirfry', name: 'Tofu and broccoli stir-fry', servings: 3, tags: ['dinner', 'vegetarian'],
    ingredients: [i('tofu', 350, 'g'), i('frozen broccoli', 500, 'g'), i('pepper', 1, 'ea'), i('white rice', 250, 'g'), i('vegetable oil', 2, 'tbsp'), i('soy sauce', 3, 'tbsp', true)],
  },
  {
    id: 'r-pork-sweetpotato', name: 'Pork loin with sweet potatoes and green beans', servings: 4, tags: ['dinner'],
    ingredients: [i('pork loin', 600, 'g'), i('sweet potato', 600, 'g'), i('frozen green beans', 375, 'g'), i('olive oil', 1, 'tbsp')],
  },
  {
    id: 'r-quesadillas', name: 'Bean and cheese quesadillas', servings: 3, tags: ['dinner', 'lunch', 'vegetarian'],
    ingredients: [i('pita', 300, 'g'), i('canned beans', 540, 'ml'), i('cheese', 200, 'g'), i('salsa', 150, 'ml')],
  },
  {
    id: 'r-tuna-pasta', name: 'Tuna pasta salad', servings: 4, tags: ['lunch'],
    ingredients: [i('pasta', 250, 'g'), i('canned tuna', 340, 'g'), i('mayonnaise', 125, 'ml'), i('celery', 1, 'ea'), i('frozen peas', 150, 'g')],
  },
  {
    id: 'r-omelette', name: 'Veggie omelette', servings: 2, tags: ['breakfast', 'vegetarian'],
    ingredients: [i('egg', 4, 'ea'), i('pepper', 1, 'ea'), i('mushroom', 113, 'g'), i('cheese', 60, 'g'), i('butter', 10, 'g')],
  },
  {
    id: 'r-pancakes', name: 'Pancakes', servings: 3, tags: ['breakfast', 'vegetarian'],
    ingredients: [i('flour', 250, 'g'), i('egg', 2, 'ea'), i('milk', 375, 'ml'), i('butter', 30, 'g'), i('sugar', 25, 'g'), i('baking powder', 1, 'tbsp', true)],
  },
  {
    id: 'r-grilled-cheese', name: 'Grilled cheese and tomato soup', servings: 2, tags: ['lunch', 'vegetarian'],
    ingredients: [i('bread', 300, 'g'), i('cheese', 150, 'g'), i('butter', 30, 'g'), i('canned soup', 568, 'ml')],
  },
  {
    id: 'r-fried-rice', name: 'Egg fried rice', servings: 3, tags: ['dinner', 'leftovers'],
    ingredients: [i('white rice', 300, 'g'), i('egg', 3, 'ea'), i('frozen peas', 200, 'g'), i('frozen corn', 150, 'g'), i('vegetable oil', 2, 'tbsp'), i('soy sauce', 3, 'tbsp', true)],
  },
];
