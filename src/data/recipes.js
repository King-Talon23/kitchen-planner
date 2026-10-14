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
  {
    id: 'r-beef-stew', name: 'Beef stew', servings: 6, tags: ['dinner', 'batch'],
    ingredients: [i('stewing beef', 800, 'g'), i('potato', 600, 'g'), i('carrot', 3, 'ea'), i('onion', 1, 'ea'), i('celery', 1, 'ea'), i('flour', 2, 'tbsp'), i('vegetable oil', 2, 'tbsp'), i('canned tomatoes', 796, 'ml')],
    prepMin: 20, cookMin: 120,
    steps: [
      'Pat the beef dry, toss it with the flour, salt and pepper.',
      'Heat the oil in a large heavy pot over medium-high heat and brown the beef in batches, about 3 minutes a side. Set it aside.',
      'Dice the onion and celery and soften them in the pot for 5 minutes.',
      'Return the beef, add the canned tomatoes and 750 ml of water, bring to a boil, then cover and simmer on low for 1 hour.',
      'Cut the potatoes and carrots into chunks, add them and simmer 45 to 60 minutes more, until the beef and potatoes are tender. Season to taste.',
    ],
  },
  {
    id: 'r-steak-potatoes', name: 'Sirloin steak with roast potatoes and salad', servings: 2, tags: ['dinner'],
    ingredients: [i('sirloin steak', 400, 'g'), i('potato', 500, 'g'), i('salad greens', 142, 'g'), i('olive oil', 2, 'tbsp'), i('butter', 15, 'g'), i('salad dressing', 3, 'tbsp', true)],
    prepMin: 10, cookMin: 40,
    steps: [
      'Heat the oven to 220°C (425°F). Cut the potatoes into wedges, toss with half the oil, salt and pepper, and roast 35 to 40 minutes, turning once.',
      'Take the steak out of the fridge 20 minutes before cooking and season it well.',
      'Heat the rest of the oil in a heavy pan over high heat. Cook the steak 3 to 5 minutes a side, adding the butter for the last minute, until it reaches 63°C inside for medium-rare or 71°C for medium.',
      'Rest the steak 5 minutes, then slice it against the grain. Serve with the potatoes and the greens tossed in dressing.',
    ],
  },
  {
    id: 'r-pulled-pork', name: 'Oven pulled pork sandwiches', servings: 8, tags: ['dinner', 'batch'],
    ingredients: [i('pork shoulder', 1500, 'g'), i('onion', 1, 'ea'), i('ketchup', 250, 'ml'), i('bread', 675, 'g'), i('sugar', 2, 'tbsp'), i('cabbage', 300, 'g', true)],
    prepMin: 15, cookMin: 210,
    steps: [
      'Heat the oven to 150°C (300°F). Season the pork with salt and pepper.',
      'Slice the onion into a covered roasting pan or Dutch oven, set the pork on top and add 250 ml of water.',
      'Cover and roast 3 to 3.5 hours, until the meat falls apart easily with a fork (well above the 71°C safe temperature).',
      'Shred the pork with two forks. Stir the ketchup and sugar into the pan juices, warm through and mix with the meat.',
      'Serve on bread, with shredded cabbage if you like.',
    ],
  },
  {
    id: 'r-roast-chicken', name: 'Roast chicken with vegetables', servings: 6, tags: ['dinner', 'batch'],
    ingredients: [i('whole chicken', 1800, 'g'), i('potato', 800, 'g'), i('carrot', 4, 'ea'), i('onion', 2, 'ea'), i('olive oil', 2, 'tbsp'), i('lemon', 1, 'ea', true)],
    prepMin: 15, cookMin: 90,
    steps: [
      'Heat the oven to 190°C (375°F). Cut the potatoes, carrots and onions into chunks, toss with the oil, salt and pepper, and spread them in a roasting pan.',
      'Pat the chicken dry, season it inside and out, put the halved lemon inside and set it on the vegetables.',
      'Roast about 1 hour 20 minutes to 1 hour 40 minutes, until the thickest part of the thigh reaches 82°C (Health Canada’s temperature for whole poultry).',
      'Rest 10 minutes before carving. Stir the vegetables in the pan juices and serve.',
    ],
  },
  {
    id: 'r-drumsticks-rice', name: 'Baked drumsticks with rice and corn', servings: 4, tags: ['dinner'],
    ingredients: [i('chicken drumstick', 8, 'ea'), i('white rice', 300, 'g'), i('frozen corn', 300, 'g'), i('vegetable oil', 1, 'tbsp'), i('ketchup', 3, 'tbsp', true), i('garlic powder', 1, 'tsp', true)],
    prepMin: 10, cookMin: 45,
    steps: [
      'Heat the oven to 200°C (400°F). Toss the drumsticks with the oil, garlic powder, salt and pepper and spread them on a lined tray.',
      'Bake 40 to 45 minutes, turning once and brushing with ketchup for the last 10 minutes if you like, until they reach 74°C inside.',
      'Meanwhile rinse the rice and simmer it covered with twice its volume of water for about 18 minutes, then let it stand 5 minutes.',
      'Boil or microwave the corn 3 to 4 minutes and serve.',
    ],
  },
  {
    id: 'r-chicken-wraps', name: 'Chicken Caesar wraps', servings: 4, tags: ['lunch', 'dinner'],
    ingredients: [i('chicken breast', 500, 'g'), i('pita', 4, 'ea'), i('romaine lettuce', 1, 'ea'), i('cheese', 80, 'g'), i('salad dressing', 125, 'ml'), i('vegetable oil', 1, 'tbsp')],
    prepMin: 10, cookMin: 15,
    steps: [
      'Season the chicken and cook it in the oil in a pan over medium heat, 6 to 7 minutes a side, until it reaches 74°C inside. Let it rest, then slice.',
      'Chop the lettuce and grate the cheese.',
      'Toss the lettuce with the dressing, pile it on the pitas or tortillas with the chicken and cheese, and roll up.',
    ],
  },
  {
    id: 'r-bacon-eggs', name: 'Bacon, eggs and toast', servings: 2, tags: ['breakfast'],
    ingredients: [i('bacon', 150, 'g'), i('egg', 4, 'ea'), i('bread', 4, 'ea'), i('butter', 15, 'g')],
    prepMin: 2, cookMin: 15,
    steps: [
      'Lay the bacon in a cold pan, turn the heat to medium and cook 8 to 10 minutes, turning, until crisp. Drain on paper towel.',
      'Pour off most of the fat and fry the eggs in the same pan until the whites are set and the yolks are firm or as you like them.',
      'Toast and butter the bread and serve.',
    ],
  },
  {
    id: 'r-hotdogs-beans', name: 'Hot dogs and baked beans', servings: 4, tags: ['lunch', 'dinner'],
    ingredients: [i('wiener', 400, 'g'), i('bread', 8, 'ea'), i('baked beans', 398, 'ml'), i('ketchup', 3, 'tbsp', true)],
    prepMin: 2, cookMin: 10,
    steps: [
      'Simmer the wieners in water, or fry them in a pan, 5 to 6 minutes until hot all through.',
      'Heat the beans in a small pot, stirring, until bubbling.',
      'Serve the wieners in bread or buns with the beans on the side.',
    ],
  },
  {
    id: 'r-shrimp-pasta', name: 'Garlic butter shrimp pasta', servings: 3, tags: ['dinner'],
    ingredients: [i('shrimp', 300, 'g'), i('pasta', 300, 'g'), i('butter', 45, 'g'), i('frozen spinach', 150, 'g'), i('lemon', 1, 'ea', true), i('garlic powder', 1, 'tsp', true)],
    prepMin: 10, cookMin: 15,
    steps: [
      'Thaw the shrimp in cold water if frozen, then pat dry. Cook the pasta to the time on the package and save a cup of the pasta water before draining.',
      'Melt the butter in a large pan over medium heat, add the shrimp and garlic powder and cook 2 to 3 minutes a side, until pink and opaque all through.',
      'Stir in the spinach until hot, then toss in the pasta with a splash of pasta water and the lemon juice. Season to taste.',
    ],
  },
  {
    id: 'r-salmon-cakes', name: 'Salmon cakes with salad', servings: 3, tags: ['lunch', 'dinner'],
    ingredients: [i('canned salmon', 426, 'g'), i('egg', 1, 'ea'), i('crackers', 60, 'g'), i('onion', 0.5, 'ea'), i('vegetable oil', 2, 'tbsp'), i('salad greens', 142, 'g', true), i('mayonnaise', 3, 'tbsp', true)],
    prepMin: 15, cookMin: 10,
    steps: [
      'Drain the salmon and mash it with a fork. Crush the crackers and finely dice the onion.',
      'Mix the salmon, crackers, onion and egg, and shape into 6 patties.',
      'Fry in the oil over medium heat 4 to 5 minutes a side until golden and hot in the centre (74°C, since they contain egg).',
      'Serve with greens and a little mayonnaise.',
    ],
  },
  {
    id: 'r-tuna-melt', name: 'Tuna melts', servings: 2, tags: ['lunch'],
    ingredients: [i('canned tuna', 170, 'g'), i('mayonnaise', 3, 'tbsp'), i('celery', 0.5, 'ea'), i('bread', 4, 'ea'), i('cheese', 80, 'g')],
    prepMin: 5, cookMin: 8,
    steps: [
      'Drain the tuna, dice the celery and mix both with the mayonnaise.',
      'Spread the tuna on the bread and top with sliced cheese.',
      'Broil on high 3 to 5 minutes, watching closely, until the cheese bubbles.',
    ],
  },
  {
    id: 'r-pb-banana-toast', name: 'Peanut butter banana toast', servings: 1, tags: ['breakfast', 'snack', 'vegetarian'],
    ingredients: [i('bread', 2, 'ea'), i('peanut butter', 2, 'tbsp'), i('banana', 1, 'ea')],
    prepMin: 3, cookMin: 2,
    steps: ['Toast the bread.', 'Spread with the peanut butter and top with the sliced banana.'],
  },
  {
    id: 'r-smoothie', name: 'Peanut butter banana smoothie', servings: 1, tags: ['breakfast', 'snack', 'vegetarian'],
    ingredients: [i('milk', 300, 'ml'), i('banana', 1, 'ea'), i('peanut butter', 2, 'tbsp'), i('yogurt', 125, 'g')],
    prepMin: 5, cookMin: 0,
    steps: ['Put everything in a blender and blend until smooth, about 30 seconds.', 'Add a few ice cubes or a frozen banana for a thicker shake.'],
  },
  {
    id: 'r-parfait', name: 'Yogurt and strawberry parfait', servings: 2, tags: ['breakfast', 'snack', 'vegetarian'],
    ingredients: [i('yogurt', 400, 'g'), i('frozen strawberries', 200, 'g'), i('almonds', 40, 'g'), i('cereal', 60, 'g', true)],
    prepMin: 5, cookMin: 0,
    steps: ['Thaw the strawberries in the fridge overnight or briefly in the microwave.', 'Layer yogurt, strawberries, chopped almonds and cereal in glasses or bowls.'],
  },
  {
    id: 'r-chickpea-curry', name: 'Chickpea curry with rice', servings: 4, tags: ['dinner', 'vegetarian'],
    ingredients: [i('canned beans', 1080, 'ml'), i('canned tomatoes', 796, 'ml'), i('onion', 1, 'ea'), i('cream', 125, 'ml'), i('white rice', 300, 'g'), i('vegetable oil', 2, 'tbsp'), i('curry powder', 2, 'tbsp', true), i('frozen spinach', 150, 'g', true)],
    prepMin: 10, cookMin: 30,
    steps: [
      'Rinse the rice and simmer it covered with twice its volume of water for about 18 minutes, then let it stand 5 minutes.',
      'Dice the onion and soften it in the oil in a large pan over medium heat, about 6 minutes. Stir in the curry powder for 1 minute.',
      'Drain and rinse the chickpeas. Add them with the tomatoes and simmer 15 minutes.',
      'Stir in the cream and spinach and heat through. Season and serve over the rice.',
    ],
  },
  {
    id: 'r-bean-bowls', name: 'Black bean rice bowls', servings: 3, tags: ['lunch', 'dinner', 'vegetarian'],
    ingredients: [i('canned beans', 540, 'ml'), i('white rice', 250, 'g'), i('salsa', 200, 'ml'), i('cheese', 90, 'g'), i('avocado', 1, 'ea', true), i('frozen corn', 150, 'g', true)],
    prepMin: 10, cookMin: 20,
    steps: [
      'Rinse the rice and simmer it covered with twice its volume of water for about 18 minutes, then let it stand 5 minutes.',
      'Drain and rinse the beans and warm them with the corn in a small pot.',
      'Fill bowls with rice, beans and corn, and top with salsa, grated cheese and sliced avocado.',
    ],
  },
  {
    id: 'r-loaded-potatoes', name: 'Loaded baked potatoes', servings: 4, tags: ['dinner', 'lunch'],
    ingredients: [i('potato', 4, 'ea'), i('broccoli', 1, 'ea'), i('cheese', 150, 'g'), i('bacon', 150, 'g', true), i('butter', 30, 'g'), i('yogurt', 125, 'g', true)],
    prepMin: 10, cookMin: 60,
    steps: [
      'Heat the oven to 200°C (400°F). Scrub and prick the potatoes and bake them directly on the rack 50 to 60 minutes, until a knife slides in easily.',
      'Meanwhile cook the bacon until crisp and chop it. Steam the broccoli florets 4 to 5 minutes.',
      'Split the potatoes, fluff with butter and top with broccoli, cheese, bacon and a spoon of yogurt.',
    ],
  },
  {
    id: 'r-shepherds-pie', name: "Shepherd's pie", servings: 6, tags: ['dinner', 'batch'],
    ingredients: [i('ground beef', 700, 'g'), i('potato', 1000, 'g'), i('frozen mixed vegetables', 400, 'g'), i('onion', 1, 'ea'), i('butter', 45, 'g'), i('milk', 125, 'ml'), i('ketchup', 2, 'tbsp', true)],
    prepMin: 20, cookMin: 50,
    steps: [
      'Peel and cube the potatoes, boil 15 to 20 minutes until soft, then mash with the butter, milk and salt.',
      'Heat the oven to 200°C (400°F). Dice the onion and brown it with the beef over medium-high heat, about 8 minutes, until no pink remains (71°C).',
      'Drain the fat, stir in the frozen vegetables, ketchup and 125 ml of water and simmer 5 minutes.',
      'Spread the meat in a baking dish, cover with the mashed potatoes and bake 25 minutes until golden on top.',
    ],
  },
  {
    id: 'r-beef-tacos', name: 'Beef tacos', servings: 4, tags: ['dinner'],
    ingredients: [i('ground beef', 450, 'g'), i('pita', 8, 'ea'), i('romaine lettuce', 0.5, 'ea'), i('tomato', 2, 'ea'), i('cheese', 120, 'g'), i('salsa', 125, 'ml'), i('chili powder', 1, 'tbsp', true)],
    prepMin: 10, cookMin: 15,
    steps: [
      'Brown the beef in a pan over medium-high heat, breaking it up, about 8 minutes, until no pink remains (71°C). Drain the fat.',
      'Stir in the chili powder and 60 ml of water and simmer 3 minutes.',
      'Shred the lettuce, dice the tomatoes and grate the cheese. Warm the tortillas in a dry pan.',
      'Fill the tortillas with beef and toppings, with salsa on top.',
    ],
  },
  {
    id: 'r-mac-cheese', name: 'Stovetop mac and cheese', servings: 4, tags: ['dinner', 'lunch', 'vegetarian'],
    ingredients: [i('pasta', 400, 'g'), i('cheese', 250, 'g'), i('milk', 500, 'ml'), i('butter', 30, 'g'), i('flour', 2, 'tbsp'), i('frozen peas', 150, 'g', true)],
    prepMin: 5, cookMin: 20,
    steps: [
      'Cook the pasta to the time on the package, adding the peas for the last 2 minutes, and drain.',
      'In the same pot melt the butter over medium heat, whisk in the flour for 1 minute, then slowly whisk in the milk.',
      'Simmer, stirring, 3 to 4 minutes until it thickens. Take off the heat and stir in the grated cheese until smooth.',
      'Stir in the pasta and peas and season to taste.',
    ],
  },
  {
    id: 'r-minestrone', name: 'Minestrone soup', servings: 6, tags: ['lunch', 'dinner', 'batch', 'vegetarian'],
    ingredients: [i('canned beans', 540, 'ml'), i('canned tomatoes', 796, 'ml'), i('pasta', 150, 'g'), i('carrot', 2, 'ea'), i('celery', 1, 'ea'), i('onion', 1, 'ea'), i('cabbage', 300, 'g'), i('olive oil', 2, 'tbsp'), i('italian seasoning', 1, 'tbsp', true)],
    prepMin: 15, cookMin: 35,
    steps: [
      'Dice the onion, carrots and celery, and shred the cabbage.',
      'Soften the onion, carrot and celery in the oil in a large pot over medium heat, about 8 minutes.',
      'Add the tomatoes, cabbage, seasoning and 1.5 litres of water. Simmer 15 minutes.',
      'Add the drained beans and the pasta and simmer until the pasta is tender, about 10 minutes. Season to taste.',
    ],
  },
  {
    id: 'r-pork-chops-apples', name: 'Pork chops with apples and cabbage', servings: 4, tags: ['dinner'],
    ingredients: [i('pork loin', 600, 'g'), i('apple', 2, 'ea'), i('cabbage', 500, 'g'), i('butter', 30, 'g'), i('vegetable oil', 1, 'tbsp')],
    prepMin: 10, cookMin: 25,
    steps: [
      'Season the pork chops. Heat the oil in a large pan over medium-high heat and cook them 4 to 5 minutes a side, until they reach 71°C inside. Set aside.',
      'Lower the heat, add the butter, the sliced apples and shredded cabbage, and cook 10 to 12 minutes, stirring, until soft.',
      'Return the chops to the pan to warm through and serve.',
    ],
  },
  {
    id: 'r-chicken-noodle-soup', name: 'Chicken noodle soup', servings: 6, tags: ['lunch', 'dinner', 'batch'],
    ingredients: [i('chicken thigh', 500, 'g'), i('pasta', 200, 'g'), i('carrot', 3, 'ea'), i('celery', 1, 'ea'), i('onion', 1, 'ea'), i('vegetable oil', 1, 'tbsp')],
    prepMin: 15, cookMin: 40,
    steps: [
      'Dice the onion, carrots and celery and soften them in the oil in a large pot, about 6 minutes.',
      'Add the chicken thighs and 2 litres of water with 2 teaspoons of salt. Simmer 20 to 25 minutes until the chicken reaches 74°C.',
      'Take out the chicken, shred it with two forks and return it to the pot.',
      'Add the pasta and simmer until tender, 8 to 10 minutes. Season to taste.',
    ],
  },
  {
    id: 'r-egg-salad', name: 'Egg salad sandwiches', servings: 2, tags: ['lunch', 'vegetarian'],
    ingredients: [i('egg', 4, 'ea'), i('mayonnaise', 3, 'tbsp'), i('celery', 0.5, 'ea'), i('bread', 4, 'ea'), i('salad greens', 40, 'g', true)],
    prepMin: 10, cookMin: 12,
    steps: [
      'Cover the eggs with cold water, bring to a boil, then turn off the heat, cover and leave 10 to 12 minutes until the yolks are fully set.',
      'Cool the eggs in cold water, peel and chop them. Dice the celery.',
      'Mix with the mayonnaise, season, and make sandwiches with the greens.',
    ],
  },
  {
    id: 'r-frittata', name: 'Potato and spinach frittata', servings: 4, tags: ['breakfast', 'dinner', 'vegetarian'],
    ingredients: [i('egg', 8, 'ea'), i('potato', 400, 'g'), i('frozen spinach', 150, 'g'), i('cheese', 100, 'g'), i('onion', 1, 'ea'), i('olive oil', 2, 'tbsp')],
    prepMin: 10, cookMin: 30,
    steps: [
      'Heat the oven to 190°C (375°F). Dice the potatoes and onion and cook them in the oil in an oven-safe pan over medium heat, covered, 10 to 12 minutes until tender.',
      'Squeeze the thawed spinach dry and stir it in.',
      'Beat the eggs with salt and the grated cheese, pour over the vegetables and cook 3 minutes until the edges set.',
      'Bake 12 to 15 minutes until the centre is set (74°C).',
    ],
  },
  {
    id: 'r-squash-soup', name: 'Butternut squash soup', servings: 4, tags: ['lunch', 'dinner', 'vegetarian'],
    ingredients: [i('squash', 1200, 'g'), i('onion', 1, 'ea'), i('carrot', 2, 'ea'), i('cream', 125, 'ml'), i('butter', 30, 'g'), i('bread', 4, 'ea', true)],
    prepMin: 15, cookMin: 35,
    steps: [
      'Peel the squash, scoop out the seeds and cut it into cubes. Dice the onion and carrots.',
      'Melt the butter in a large pot and soften the onion 5 minutes.',
      'Add the squash, carrots and 1 litre of water. Simmer 20 to 25 minutes until very soft.',
      'Blend until smooth, stir in the cream, season and serve with bread.',
    ],
  },
  {
    id: 'r-hummus-pita', name: 'Hummus veggie pitas', servings: 2, tags: ['lunch', 'vegetarian'],
    ingredients: [i('hummus', 150, 'g'), i('pita', 2, 'ea'), i('cucumber', 0.5, 'ea'), i('tomato', 1, 'ea'), i('carrot', 1, 'ea'), i('salad greens', 40, 'g', true)],
    prepMin: 10, cookMin: 0,
    steps: ['Slice the cucumber and tomato and grate the carrot.', 'Spread hummus inside the pitas and fill with the vegetables and greens.'],
  },
  {
    id: 'r-pita-pizza', name: 'Pita pizzas', servings: 2, tags: ['dinner', 'lunch', 'vegetarian'],
    ingredients: [i('pita', 4, 'ea'), i('pasta sauce', 125, 'ml'), i('cheese', 150, 'g'), i('pepper', 1, 'ea'), i('mushroom', 100, 'g')],
    prepMin: 10, cookMin: 12,
    steps: [
      'Heat the oven to 220°C (425°F).',
      'Spread the sauce on the pitas, top with sliced pepper, mushrooms and grated cheese.',
      'Bake on a tray 10 to 12 minutes until the cheese is bubbling and the edges are crisp.',
    ],
  },
  {
    id: 'r-frozen-pizza-salad', name: 'Frozen pizza with side salad', servings: 2, tags: ['dinner'],
    ingredients: [i('frozen pizza', 390, 'g'), i('salad greens', 142, 'g'), i('cucumber', 0.5, 'ea'), i('salad dressing', 3, 'tbsp')],
    prepMin: 5, cookMin: 18,
    steps: ['Bake the pizza at the temperature and time on the box, usually 200 to 220°C for 15 to 20 minutes.', 'Toss the greens and sliced cucumber with the dressing.'],
  },
  {
    id: 'r-lentil-dal', name: 'Red lentil dal with rice', servings: 4, tags: ['dinner', 'vegetarian', 'batch'],
    ingredients: [i('dried lentils', 250, 'g'), i('onion', 1, 'ea'), i('canned tomatoes', 398, 'ml'), i('white rice', 300, 'g'), i('vegetable oil', 2, 'tbsp'), i('curry powder', 1, 'tbsp', true)],
    prepMin: 10, cookMin: 30,
    steps: [
      'Rinse the rice and simmer it covered with twice its volume of water for about 18 minutes, then let it stand 5 minutes.',
      'Dice the onion and soften it in the oil in a pot over medium heat, about 6 minutes. Stir in the curry powder for 1 minute.',
      'Rinse the lentils. Add them with the tomatoes and 750 ml of water, and simmer, stirring now and then, until soft: about 15 to 20 minutes for red lentils, 20 to 25 for green or brown.',
      'Season and serve over the rice.',
    ],
  },
  {
    id: 'r-sweet-potato-tacos', name: 'Sweet potato and black bean tacos', servings: 3, tags: ['dinner', 'vegetarian'],
    ingredients: [i('sweet potato', 500, 'g'), i('canned beans', 540, 'ml'), i('pita', 6, 'ea'), i('salsa', 125, 'ml'), i('olive oil', 1, 'tbsp'), i('lime', 1, 'ea', true), i('chili powder', 1, 'tsp', true)],
    prepMin: 10, cookMin: 30,
    steps: [
      'Heat the oven to 220°C (425°F). Cube the sweet potato, toss with the oil, chili powder and salt, and roast 25 to 30 minutes until tender.',
      'Drain, rinse and warm the beans.',
      'Fill warm tortillas with sweet potato and beans, and top with salsa and a squeeze of lime.',
    ],
  },
];
