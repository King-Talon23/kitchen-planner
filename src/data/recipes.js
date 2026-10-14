// Starter recipes. Ingredient names match entries in prices.js so the
// shopping list can price them. Ingredients marked optional (spices, salt)
// never block a suggestion and are not added to the shopping list.
// Edit, delete or add your own in the Recipes tab.
//
// prepMin and cookMin are estimates for one home cook. Doneness for meat,
// fish and eggs uses Health Canada's safe internal cooking temperatures:
// https://www.canada.ca/en/health-canada/services/general-food-safety-tips/safe-internal-cooking-temperatures.html
// Brown or green lentils take 20 to 25 minutes to simmer (Milk Street):
// https://www.177milkstreet.com/2019/04/how-to-cook-lentils

const i = (name, qty, unit, optional = false) => ({ name, qty, unit, optional });

export const DEFAULT_RECIPES = [
  {
    id: 'r-bolognese', name: 'Spaghetti bolognese', servings: 4, tags: ['dinner'],
    ingredients: [i('pasta', 500, 'g'), i('ground beef', 450, 'g'), i('pasta sauce', 650, 'ml'), i('onion', 1, 'ea'), i('italian seasoning', 1, 'tbsp', true)],
    prepMin: 10, cookMin: 30,
    steps: [
      'Bring a large pot of salted water to a boil for the pasta.',
      'Dice the onion. Brown the ground beef and onion in a large pan over medium-high heat, breaking up the meat, about 8 minutes, until no pink remains (71°C inside).',
      'Drain off extra fat, stir in the pasta sauce and Italian seasoning, and simmer on low for 15 minutes.',
      'Meanwhile cook the pasta to the time on the package, usually 8 to 12 minutes, then drain.',
      'Serve the sauce over the pasta.',
    ],
  },
  {
    id: 'r-chicken-stirfry', name: 'Chicken stir-fry with rice', servings: 4, tags: ['dinner'],
    ingredients: [i('chicken breast', 500, 'g'), i('frozen mixed vegetables', 750, 'g'), i('white rice', 300, 'g'), i('vegetable oil', 2, 'tbsp'), i('soy sauce', 3, 'tbsp', true)],
    prepMin: 10, cookMin: 25,
    steps: [
      'Rinse the rice, then simmer it covered with twice its volume of water for about 18 minutes, and let it stand 5 minutes off the heat.',
      'Cut the chicken into bite-sized pieces.',
      'Heat the oil in a large pan or wok over high heat. Stir-fry the chicken 6 to 8 minutes until cooked through (74°C inside).',
      'Add the frozen vegetables and stir-fry 5 to 6 minutes until hot.',
      'Stir in the soy sauce and serve over the rice.',
    ],
  },
  {
    id: 'r-sheetpan-thighs', name: 'Sheet-pan chicken thighs and potatoes', servings: 4, tags: ['dinner'],
    ingredients: [i('chicken thigh', 800, 'g'), i('potato', 800, 'g'), i('carrot', 400, 'g'), i('olive oil', 2, 'tbsp'), i('garlic powder', 1, 'tsp', true)],
    prepMin: 15, cookMin: 40,
    steps: [
      'Heat the oven to 220°C (425°F).',
      'Cut the potatoes and carrots into 2–3 cm chunks.',
      'Toss the vegetables and chicken thighs with the oil, garlic powder, salt and pepper, and spread them in one layer on a large sheet pan.',
      'Roast 35 to 45 minutes, turning the vegetables once, until the potatoes are tender and the chicken reaches 74°C inside.',
    ],
  },
  {
    id: 'r-chili', name: 'Beef and bean chili', servings: 6, tags: ['dinner', 'batch'],
    ingredients: [i('ground beef', 450, 'g'), i('canned beans', 1080, 'ml'), i('canned tomatoes', 796, 'ml'), i('onion', 1, 'ea'), i('pepper', 1, 'ea'), i('chili powder', 2, 'tbsp', true)],
    prepMin: 10, cookMin: 45,
    steps: [
      'Dice the onion and pepper.',
      'Brown the ground beef with the onion in a large pot over medium-high heat, about 8 minutes, until no pink remains (71°C inside). Drain extra fat.',
      'Add the pepper and chili powder and cook 2 minutes.',
      'Drain and rinse the beans. Add them with the canned tomatoes.',
      'Simmer, partly covered, for 30 minutes, stirring now and then. Season to taste.',
    ],
  },
  {
    id: 'r-lentil-soup', name: 'Lentil vegetable soup', servings: 6, tags: ['dinner', 'lunch', 'batch', 'vegetarian'],
    ingredients: [i('dried lentils', 300, 'g'), i('canned tomatoes', 796, 'ml'), i('carrot', 2, 'ea'), i('onion', 1, 'ea'), i('celery', 1, 'ea'), i('cumin', 1, 'tsp', true)],
    prepMin: 15, cookMin: 35,
    steps: [
      'Dice the onion, carrots and celery.',
      'Soften them in a little oil in a large pot over medium heat, about 6 minutes. Stir in the cumin.',
      'Rinse the lentils. Add them with the canned tomatoes and 1.5 litres of water.',
      'Bring to a boil, then simmer partly covered 20 to 25 minutes until the lentils are tender. Season to taste.',
    ],
  },
  {
    id: 'r-salmon-rice', name: 'Salmon with rice and broccoli', servings: 2, tags: ['dinner'],
    ingredients: [i('salmon', 400, 'g'), i('white rice', 200, 'g'), i('broccoli', 1, 'ea'), i('butter', 30, 'g'), i('lemon', 1, 'ea', true)],
    prepMin: 10, cookMin: 25,
    steps: [
      'Rinse the rice, then simmer it covered with twice its volume of water for about 18 minutes, and let it stand 5 minutes off the heat.',
      'Heat the oven to 200°C (400°F). Put the salmon on a lined tray with a little butter, salt and pepper.',
      'Bake 12 to 15 minutes, until it flakes easily (70°C inside).',
      'Cut the broccoli into florets and steam or boil 4 to 5 minutes until bright green and tender.',
      'Serve with butter on the broccoli and lemon wedges.',
    ],
  },
  {
    id: 'r-tofu-stirfry', name: 'Tofu and broccoli stir-fry', servings: 3, tags: ['dinner', 'vegetarian'],
    ingredients: [i('tofu', 350, 'g'), i('frozen broccoli', 500, 'g'), i('pepper', 1, 'ea'), i('white rice', 250, 'g'), i('vegetable oil', 2, 'tbsp'), i('soy sauce', 3, 'tbsp', true)],
    prepMin: 10, cookMin: 25,
    steps: [
      'Rinse the rice, then simmer it covered with twice its volume of water for about 18 minutes, and let it stand 5 minutes off the heat.',
      'Drain the tofu, pat it dry and cut it into cubes. Slice the pepper.',
      'Heat the oil in a large pan over medium-high heat. Fry the tofu 8 to 10 minutes, turning, until golden.',
      'Add the broccoli and pepper and stir-fry 5 to 6 minutes until hot.',
      'Stir in the soy sauce and serve over the rice.',
    ],
  },
  {
    id: 'r-pork-sweetpotato', name: 'Pork loin with sweet potatoes and green beans', servings: 4, tags: ['dinner'],
    ingredients: [i('pork loin', 600, 'g'), i('sweet potato', 600, 'g'), i('frozen green beans', 375, 'g'), i('olive oil', 1, 'tbsp')],
    prepMin: 10, cookMin: 40,
    steps: [
      'Heat the oven to 200°C (400°F).',
      'Cut the sweet potatoes into chunks, toss with half the oil, salt and pepper, and roast for 10 minutes.',
      'Rub the pork loin with the rest of the oil, salt and pepper, add it to the pan and roast 25 to 30 minutes more, until it reaches 71°C inside.',
      'Rest the pork 5 minutes before slicing. Meanwhile boil or microwave the green beans 4 to 5 minutes.',
    ],
  },
  {
    id: 'r-quesadillas', name: 'Bean and cheese quesadillas', servings: 3, tags: ['dinner', 'lunch', 'vegetarian'],
    ingredients: [i('pita', 300, 'g'), i('canned beans', 540, 'ml'), i('cheese', 200, 'g'), i('salsa', 150, 'ml')],
    prepMin: 10, cookMin: 15,
    steps: [
      'Drain and rinse the beans and mash them roughly with a fork.',
      'Spread beans on half of each pita, top with cheese and fold or cover with another half.',
      'Cook in a dry pan over medium heat 3 to 4 minutes a side, until crisp and the cheese melts.',
      'Cut into wedges and serve with salsa.',
    ],
  },
  {
    id: 'r-tuna-pasta', name: 'Tuna pasta salad', servings: 4, tags: ['lunch'],
    ingredients: [i('pasta', 250, 'g'), i('canned tuna', 340, 'g'), i('mayonnaise', 125, 'ml'), i('celery', 1, 'ea'), i('frozen peas', 150, 'g')],
    prepMin: 10, cookMin: 15,
    steps: [
      'Cook the pasta to the time on the package, adding the frozen peas for the last 2 minutes.',
      'Drain and rinse under cold water until cool.',
      'Dice the celery and drain the tuna.',
      'Mix everything with the mayonnaise, season to taste and chill until serving.',
    ],
  },
  {
    id: 'r-omelette', name: 'Veggie omelette', servings: 2, tags: ['breakfast', 'vegetarian'],
    ingredients: [i('egg', 4, 'ea'), i('pepper', 1, 'ea'), i('mushroom', 113, 'g'), i('cheese', 60, 'g'), i('butter', 10, 'g')],
    prepMin: 5, cookMin: 10,
    steps: [
      'Dice the pepper and slice the mushrooms. Beat the eggs with a pinch of salt.',
      'Melt the butter in a non-stick pan over medium heat and cook the vegetables 3 to 4 minutes.',
      'Pour in the eggs and cook, lifting the edges, until set with no runny egg left (74°C).',
      'Sprinkle on the cheese, fold in half and serve.',
    ],
  },
  {
    id: 'r-pancakes', name: 'Pancakes', servings: 3, tags: ['breakfast', 'vegetarian'],
    ingredients: [i('flour', 250, 'g'), i('egg', 2, 'ea'), i('milk', 375, 'ml'), i('butter', 30, 'g'), i('sugar', 25, 'g'), i('baking powder', 1, 'tbsp', true)],
    prepMin: 10, cookMin: 15,
    steps: [
      'Whisk the flour, sugar, baking powder and a pinch of salt in a bowl.',
      'Melt the butter. Whisk the milk, eggs and melted butter, then stir into the flour until just combined (a few lumps are fine).',
      'Heat a lightly greased pan over medium heat. Pour about 1/4 cup of batter per pancake.',
      'Cook until bubbles form and the edges look dry, about 2 minutes, then flip and cook 1 to 2 minutes more.',
    ],
  },
  {
    id: 'r-grilled-cheese', name: 'Grilled cheese and tomato soup', servings: 2, tags: ['lunch', 'vegetarian'],
    ingredients: [i('bread', 300, 'g'), i('cheese', 150, 'g'), i('butter', 30, 'g'), i('canned soup', 568, 'ml')],
    prepMin: 5, cookMin: 10,
    steps: [
      'Heat the soup in a pot over medium heat, stirring, until it simmers.',
      'Butter one side of each bread slice. Put cheese between two slices, buttered sides out.',
      'Cook in a pan over medium-low heat 3 to 4 minutes a side, until golden and the cheese melts.',
    ],
  },
  {
    id: 'r-fried-rice', name: 'Egg fried rice', servings: 3, tags: ['dinner', 'leftovers'],
    ingredients: [i('white rice', 300, 'g'), i('egg', 3, 'ea'), i('frozen peas', 200, 'g'), i('frozen corn', 150, 'g'), i('vegetable oil', 2, 'tbsp'), i('soy sauce', 3, 'tbsp', true)],
    prepMin: 10, cookMin: 15,
    steps: [
      'Best with cold cooked rice. If cooking it fresh, simmer it covered with twice its volume of water for about 18 minutes, then spread it out to cool.',
      'Beat the eggs. Heat half the oil in a large pan over medium-high heat, scramble the eggs until set and set them aside.',
      'Heat the rest of the oil, add the peas and corn and stir-fry 3 minutes.',
      'Add the rice and stir-fry 4 to 5 minutes until hot right through.',
      'Stir in the eggs and soy sauce and serve.',
    ],
  },
];
