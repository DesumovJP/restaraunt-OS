/**
 * Seed Recipes for Menu Items
 * Creates recipes with realistic ingredients for all cooking menu items
 */

const STRAPI_URL = 'http://localhost:1337';

async function graphql(query, variables) {
  const response = await fetch(`${STRAPI_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const result = await response.json();
  if (result.errors) {
    console.error('GraphQL Error:', result.errors[0].message);
    return null;
  }
  return result.data;
}

async function rest(method, endpoint, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(`${STRAPI_URL}/api${endpoint}`, options);
  return await response.json();
}

// ========== RECIPE DEFINITIONS ==========
// Map menu item slugs to their recipe ingredients
const recipeDefinitions = {
  // ===== HOT DISHES =====
  'grilled-salmon': {
    prepTime: 10, cookTime: 15, portions: 1,
    ingredients: [
      { slug: 'salmon-fillet', qty: 0.2, unit: 'kg' },
      { slug: 'olive-oil-ev', qty: 0.02, unit: 'l' },
      { slug: 'lemon', qty: 0.5, unit: 'pcs' },
      { slug: 'rosemary-fresh', qty: 0.01, unit: 'kg' },
      { slug: 'sea-salt', qty: 0.005, unit: 'kg' },
      { slug: 'black-pepper', qty: 0.002, unit: 'kg' },
    ],
    steps: [
      { step: 1, desc: 'Натерти лосось сіллю та перцем', time: 2 },
      { step: 2, desc: 'Розігріти гриль до 200°C', time: 3 },
      { step: 3, desc: 'Змастити рибу оливковою олією', time: 1 },
      { step: 4, desc: 'Смажити на грилі по 5-6 хв з кожного боку', time: 12 },
      { step: 5, desc: 'Подати з лимоном та розмарином', time: 2 },
    ],
  },
  'ribeye-steak': {
    prepTime: 5, cookTime: 15, portions: 1,
    ingredients: [
      { slug: 'beef-ribeye', qty: 0.3, unit: 'kg' },
      { slug: 'butter', qty: 0.03, unit: 'kg' },
      { slug: 'rosemary-fresh', qty: 0.01, unit: 'kg' },
      { slug: 'thyme-fresh', qty: 0.01, unit: 'kg' },
      { slug: 'garlic', qty: 0.01, unit: 'kg' },
      { slug: 'sea-salt', qty: 0.005, unit: 'kg' },
      { slug: 'black-pepper', qty: 0.002, unit: 'kg' },
    ],
    steps: [
      { step: 1, desc: 'Дістати м\'ясо з холодильника за 30 хв до готування', time: 1 },
      { step: 2, desc: 'Натерти стейк сіллю та перцем', time: 2 },
      { step: 3, desc: 'Розігріти сковороду до максимуму', time: 3 },
      { step: 4, desc: 'Обсмажити по 3-4 хв з кожного боку', time: 8 },
      { step: 5, desc: 'Додати масло, часник та трави, поливати 2 хв', time: 3 },
      { step: 6, desc: 'Дати відпочити 5 хв перед подачею', time: 5 },
    ],
  },
  'pork-ribs': {
    prepTime: 15, cookTime: 90, portions: 2,
    ingredients: [
      { slug: 'pork-ribs', qty: 0.6, unit: 'kg' },
      { slug: 'onion', qty: 0.1, unit: 'kg' },
      { slug: 'garlic', qty: 0.02, unit: 'kg' },
      { slug: 'tomato', qty: 0.15, unit: 'kg' },
      { slug: 'paprika', qty: 0.01, unit: 'kg' },
      { slug: 'sea-salt', qty: 0.01, unit: 'kg' },
      { slug: 'black-pepper', qty: 0.003, unit: 'kg' },
      { slug: 'sunflower-oil', qty: 0.03, unit: 'l' },
    ],
    steps: [
      { step: 1, desc: 'Натерти ребра спеціями', time: 5 },
      { step: 2, desc: 'Обсмажити ребра до золотистої скоринки', time: 10 },
      { step: 3, desc: 'Додати цибулю та часник', time: 5 },
      { step: 4, desc: 'Залити соусом та тушкувати 1.5 години', time: 90 },
    ],
  },
  'duck-breast': {
    prepTime: 10, cookTime: 20, portions: 1,
    ingredients: [
      { slug: 'duck-breast', qty: 0.25, unit: 'kg' },
      { slug: 'butter', qty: 0.02, unit: 'kg' },
      { slug: 'thyme-fresh', qty: 0.005, unit: 'kg' },
      { slug: 'sea-salt', qty: 0.005, unit: 'kg' },
      { slug: 'black-pepper', qty: 0.002, unit: 'kg' },
    ],
    steps: [
      { step: 1, desc: 'Надрізати шкіру качки ромбиками', time: 3 },
      { step: 2, desc: 'Натерти сіллю та перцем', time: 2 },
      { step: 3, desc: 'Покласти на холодну сковороду шкірою донизу', time: 1 },
      { step: 4, desc: 'Смажити на середньому вогні 12 хв', time: 12 },
      { step: 5, desc: 'Перевернути та смажити ще 5 хв', time: 5 },
      { step: 6, desc: 'Дати відпочити 5 хв', time: 5 },
    ],
  },
  'chicken-kyiv': {
    prepTime: 20, cookTime: 15, portions: 1,
    ingredients: [
      { slug: 'chicken-fillet', qty: 0.2, unit: 'kg' },
      { slug: 'butter', qty: 0.05, unit: 'kg' },
      { slug: 'eggs', qty: 2, unit: 'pcs' },
      { slug: 'wheat-flour', qty: 0.03, unit: 'kg' },
      { slug: 'parsley', qty: 0.01, unit: 'kg' },
      { slug: 'garlic', qty: 0.01, unit: 'kg' },
      { slug: 'sunflower-oil', qty: 0.1, unit: 'l' },
      { slug: 'sea-salt', qty: 0.005, unit: 'kg' },
    ],
    steps: [
      { step: 1, desc: 'Відбити філе до 0.5 см', time: 3 },
      { step: 2, desc: 'Змішати масло з часником та зеленню', time: 3 },
      { step: 3, desc: 'Загорнути масло в м\'ясо', time: 5 },
      { step: 4, desc: 'Обваляти в борошні, яйці та сухарях', time: 5 },
      { step: 5, desc: 'Смажити у фритюрі 8-10 хв', time: 10 },
    ],
  },
  'pasta-carbonara': {
    prepTime: 10, cookTime: 15, portions: 1,
    ingredients: [
      { slug: 'spaghetti', qty: 0.1, unit: 'kg' },
      { slug: 'eggs', qty: 2, unit: 'pcs' },
      { slug: 'parmesan', qty: 0.05, unit: 'kg' },
      { slug: 'pork-neck', qty: 0.08, unit: 'kg' },
      { slug: 'cream-33', qty: 0.05, unit: 'l' },
      { slug: 'black-pepper', qty: 0.003, unit: 'kg' },
      { slug: 'sea-salt', qty: 0.005, unit: 'kg' },
    ],
    steps: [
      { step: 1, desc: 'Зварити пасту аль денте', time: 10 },
      { step: 2, desc: 'Обсмажити бекон/гуанчале', time: 5 },
      { step: 3, desc: 'Змішати яйця з пармезаном та вершками', time: 2 },
      { step: 4, desc: 'З\'єднати пасту з беконом', time: 1 },
      { step: 5, desc: 'Додати яєчну суміш, швидко перемішати', time: 2 },
    ],
  },

  // ===== SALADS =====
  'caesar-salad': {
    prepTime: 10, cookTime: 5, portions: 1,
    ingredients: [
      { slug: 'iceberg-lettuce', qty: 0.1, unit: 'kg' },
      { slug: 'chicken-fillet', qty: 0.15, unit: 'kg' },
      { slug: 'parmesan', qty: 0.03, unit: 'kg' },
      { slug: 'eggs', qty: 1, unit: 'pcs' },
      { slug: 'olive-oil-ev', qty: 0.03, unit: 'l' },
      { slug: 'garlic', qty: 0.005, unit: 'kg' },
      { slug: 'lemon', qty: 0.25, unit: 'pcs' },
    ],
    steps: [
      { step: 1, desc: 'Обсмажити курку до готовності', time: 8 },
      { step: 2, desc: 'Порвати салат руками', time: 2 },
      { step: 3, desc: 'Приготувати соус Цезар', time: 3 },
      { step: 4, desc: 'Змішати всі інгредієнти', time: 2 },
      { step: 5, desc: 'Посипати пармезаном та крутонами', time: 1 },
    ],
  },
  'greek-salad': {
    prepTime: 10, cookTime: 0, portions: 1,
    ingredients: [
      { slug: 'tomato', qty: 0.15, unit: 'kg' },
      { slug: 'cucumber', qty: 0.1, unit: 'kg' },
      { slug: 'bell-pepper', qty: 0.08, unit: 'kg' },
      { slug: 'feta', qty: 0.08, unit: 'kg' },
      { slug: 'onion', qty: 0.03, unit: 'kg' },
      { slug: 'olive-oil-ev', qty: 0.03, unit: 'l' },
      { slug: 'sea-salt', qty: 0.003, unit: 'kg' },
    ],
    steps: [
      { step: 1, desc: 'Нарізати овочі великими кубиками', time: 5 },
      { step: 2, desc: 'Додати цибулю кільцями', time: 2 },
      { step: 3, desc: 'Покласти фету зверху', time: 1 },
      { step: 4, desc: 'Заправити олією та сіллю', time: 2 },
    ],
  },
  'caprese': {
    prepTime: 8, cookTime: 0, portions: 1,
    ingredients: [
      { slug: 'tomato', qty: 0.2, unit: 'kg' },
      { slug: 'mozzarella', qty: 0.15, unit: 'kg' },
      { slug: 'basil-fresh', qty: 0.01, unit: 'kg' },
      { slug: 'olive-oil-ev', qty: 0.02, unit: 'l' },
      { slug: 'sea-salt', qty: 0.002, unit: 'kg' },
      { slug: 'black-pepper', qty: 0.001, unit: 'kg' },
    ],
    steps: [
      { step: 1, desc: 'Нарізати помідори та моцарелу кружальцями', time: 4 },
      { step: 2, desc: 'Викласти почергово на тарілку', time: 2 },
      { step: 3, desc: 'Додати листя базиліка', time: 1 },
      { step: 4, desc: 'Збризнути олією, посолити', time: 1 },
    ],
  },

  // ===== SOUPS =====
  'borsch': {
    prepTime: 30, cookTime: 60, portions: 4,
    ingredients: [
      { slug: 'beef-brisket', qty: 0.4, unit: 'kg' },
      { slug: 'potato', qty: 0.3, unit: 'kg' },
      { slug: 'carrot', qty: 0.1, unit: 'kg' },
      { slug: 'onion', qty: 0.1, unit: 'kg' },
      { slug: 'tomato', qty: 0.1, unit: 'kg' },
      { slug: 'bell-pepper', qty: 0.05, unit: 'kg' },
      { slug: 'garlic', qty: 0.02, unit: 'kg' },
      { slug: 'sunflower-oil', qty: 0.03, unit: 'l' },
      { slug: 'sour-cream', qty: 0.1, unit: 'l' },
    ],
    steps: [
      { step: 1, desc: 'Зварити бульйон з яловичини', time: 40 },
      { step: 2, desc: 'Обсмажити цибулю та моркву', time: 10 },
      { step: 3, desc: 'Додати буряк та тушкувати', time: 15 },
      { step: 4, desc: 'Додати картоплю в бульйон', time: 15 },
      { step: 5, desc: 'Об\'єднати все, додати капусту', time: 10 },
      { step: 6, desc: 'Подати зі сметаною', time: 2 },
    ],
  },
  'mushroom-soup': {
    prepTime: 15, cookTime: 25, portions: 2,
    ingredients: [
      { slug: 'champignon', qty: 0.3, unit: 'kg' },
      { slug: 'cream-33', qty: 0.2, unit: 'l' },
      { slug: 'onion', qty: 0.1, unit: 'kg' },
      { slug: 'butter', qty: 0.03, unit: 'kg' },
      { slug: 'garlic', qty: 0.01, unit: 'kg' },
      { slug: 'thyme-fresh', qty: 0.005, unit: 'kg' },
      { slug: 'sea-salt', qty: 0.005, unit: 'kg' },
    ],
    steps: [
      { step: 1, desc: 'Обсмажити цибулю на маслі', time: 5 },
      { step: 2, desc: 'Додати гриби та смажити 10 хв', time: 10 },
      { step: 3, desc: 'Додати воду та варити 15 хв', time: 15 },
      { step: 4, desc: 'Збити блендером до однорідності', time: 3 },
      { step: 5, desc: 'Додати вершки, прогріти', time: 5 },
    ],
  },
  'chicken-broth': {
    prepTime: 10, cookTime: 40, portions: 2,
    ingredients: [
      { slug: 'chicken-fillet', qty: 0.2, unit: 'kg' },
      { slug: 'carrot', qty: 0.05, unit: 'kg' },
      { slug: 'onion', qty: 0.05, unit: 'kg' },
      { slug: 'parsley', qty: 0.01, unit: 'kg' },
      { slug: 'dill', qty: 0.01, unit: 'kg' },
      { slug: 'sea-salt', qty: 0.005, unit: 'kg' },
      { slug: 'eggs', qty: 1, unit: 'pcs' },
    ],
    steps: [
      { step: 1, desc: 'Зварити курку з овочами', time: 35 },
      { step: 2, desc: 'Процідити бульйон', time: 3 },
      { step: 3, desc: 'Додати локшину та зварити', time: 7 },
      { step: 4, desc: 'Посипати зеленню при подачі', time: 1 },
    ],
  },

  // ===== COLD APPETIZERS =====
  'bruschetta': {
    prepTime: 10, cookTime: 5, portions: 2,
    ingredients: [
      { slug: 'tomato', qty: 0.15, unit: 'kg' },
      { slug: 'basil-fresh', qty: 0.01, unit: 'kg' },
      { slug: 'garlic', qty: 0.01, unit: 'kg' },
      { slug: 'olive-oil-ev', qty: 0.03, unit: 'l' },
      { slug: 'sea-salt', qty: 0.002, unit: 'kg' },
    ],
    steps: [
      { step: 1, desc: 'Підсмажити хліб на грилі', time: 3 },
      { step: 2, desc: 'Нарізати помідори дрібно', time: 3 },
      { step: 3, desc: 'Змішати з часником та базиліком', time: 2 },
      { step: 4, desc: 'Викласти на хліб', time: 2 },
    ],
  },
  'carpaccio': {
    prepTime: 15, cookTime: 0, portions: 1,
    ingredients: [
      { slug: 'beef-tenderloin', qty: 0.1, unit: 'kg' },
      { slug: 'arugula', qty: 0.03, unit: 'kg' },
      { slug: 'parmesan', qty: 0.03, unit: 'kg' },
      { slug: 'olive-oil-ev', qty: 0.02, unit: 'l' },
      { slug: 'lemon', qty: 0.25, unit: 'pcs' },
      { slug: 'sea-salt', qty: 0.002, unit: 'kg' },
      { slug: 'black-pepper', qty: 0.001, unit: 'kg' },
    ],
    steps: [
      { step: 1, desc: 'Заморозити м\'ясо на 30 хв', time: 1 },
      { step: 2, desc: 'Нарізати максимально тонко', time: 10 },
      { step: 3, desc: 'Викласти на тарілку', time: 2 },
      { step: 4, desc: 'Додати рукколу та пармезан', time: 2 },
      { step: 5, desc: 'Збризнути олією та лимоном', time: 1 },
    ],
  },
  'cheese-plate': {
    prepTime: 10, cookTime: 0, portions: 2,
    ingredients: [
      { slug: 'parmesan', qty: 0.05, unit: 'kg' },
      { slug: 'brie', qty: 0.05, unit: 'kg' },
      { slug: 'gorgonzola', qty: 0.05, unit: 'kg' },
      { slug: 'mozzarella', qty: 0.05, unit: 'kg' },
    ],
    steps: [
      { step: 1, desc: 'Нарізати сири різними формами', time: 5 },
      { step: 2, desc: 'Красиво викласти на дошку', time: 3 },
      { step: 3, desc: 'Додати мед та горіхи', time: 2 },
    ],
  },

  // ===== DESSERTS =====
  'tiramisu': {
    prepTime: 30, cookTime: 0, portions: 4,
    ingredients: [
      { slug: 'eggs', qty: 4, unit: 'pcs' },
      { slug: 'coffee-arabica', qty: 0.02, unit: 'kg' },
      { slug: 'cream-33', qty: 0.2, unit: 'l' },
    ],
    steps: [
      { step: 1, desc: 'Заварити міцний еспресо', time: 3 },
      { step: 2, desc: 'Збити жовтки з цукром', time: 5 },
      { step: 3, desc: 'Додати маскарпоне', time: 3 },
      { step: 4, desc: 'Вмочити савоярді в каву', time: 5 },
      { step: 5, desc: 'Скласти шарами', time: 10 },
      { step: 6, desc: 'Охолодити 4 години', time: 2 },
    ],
  },
  'napoleon': {
    prepTime: 60, cookTime: 30, portions: 8,
    ingredients: [
      { slug: 'wheat-flour', qty: 0.3, unit: 'kg' },
      { slug: 'butter', qty: 0.3, unit: 'kg' },
      { slug: 'eggs', qty: 4, unit: 'pcs' },
      { slug: 'milk', qty: 0.5, unit: 'l' },
      { slug: 'cream-33', qty: 0.2, unit: 'l' },
    ],
    steps: [
      { step: 1, desc: 'Приготувати листкове тісто', time: 30 },
      { step: 2, desc: 'Випекти коржі', time: 25 },
      { step: 3, desc: 'Приготувати заварний крем', time: 15 },
      { step: 4, desc: 'Зібрати торт шарами', time: 10 },
      { step: 5, desc: 'Охолодити 2 години', time: 2 },
    ],
  },
  'cheesecake': {
    prepTime: 30, cookTime: 60, portions: 8,
    ingredients: [
      { slug: 'cream-33', qty: 0.3, unit: 'l' },
      { slug: 'eggs', qty: 3, unit: 'pcs' },
      { slug: 'butter', qty: 0.1, unit: 'kg' },
    ],
    steps: [
      { step: 1, desc: 'Подрібнити печиво для основи', time: 5 },
      { step: 2, desc: 'Змішати з маслом та втрамбувати', time: 5 },
      { step: 3, desc: 'Збити крем-сир з яйцями та вершками', time: 10 },
      { step: 4, desc: 'Випікати при 160°C 50 хв', time: 50 },
      { step: 5, desc: 'Охолодити в духовці', time: 60 },
    ],
  },

  // ===== SIDE DISHES =====
  'french-fries': {
    prepTime: 10, cookTime: 10, portions: 2,
    ingredients: [
      { slug: 'potato', qty: 0.3, unit: 'kg' },
      { slug: 'sunflower-oil', qty: 0.3, unit: 'l' },
      { slug: 'sea-salt', qty: 0.005, unit: 'kg' },
    ],
    steps: [
      { step: 1, desc: 'Нарізати картоплю соломкою', time: 5 },
      { step: 2, desc: 'Розігріти олію до 180°C', time: 5 },
      { step: 3, desc: 'Смажити до золотистого кольору', time: 8 },
      { step: 4, desc: 'Посолити та подати', time: 2 },
    ],
  },
  'mashed-potatoes': {
    prepTime: 10, cookTime: 25, portions: 2,
    ingredients: [
      { slug: 'potato', qty: 0.4, unit: 'kg' },
      { slug: 'butter', qty: 0.05, unit: 'kg' },
      { slug: 'milk', qty: 0.1, unit: 'l' },
      { slug: 'sea-salt', qty: 0.005, unit: 'kg' },
    ],
    steps: [
      { step: 1, desc: 'Почистити та нарізати картоплю', time: 8 },
      { step: 2, desc: 'Зварити до м\'якості', time: 20 },
      { step: 3, desc: 'Розім\'яти з маслом та молоком', time: 5 },
    ],
  },
  'grilled-vegetables': {
    prepTime: 10, cookTime: 15, portions: 2,
    ingredients: [
      { slug: 'zucchini', qty: 0.15, unit: 'kg' },
      { slug: 'bell-pepper', qty: 0.15, unit: 'kg' },
      { slug: 'eggplant', qty: 0.15, unit: 'kg' },
      { slug: 'olive-oil-ev', qty: 0.03, unit: 'l' },
      { slug: 'rosemary-fresh', qty: 0.005, unit: 'kg' },
      { slug: 'sea-salt', qty: 0.003, unit: 'kg' },
    ],
    steps: [
      { step: 1, desc: 'Нарізати овочі скибочками', time: 5 },
      { step: 2, desc: 'Змастити олією та спеціями', time: 3 },
      { step: 3, desc: 'Смажити на грилі по 5 хв з боку', time: 12 },
    ],
  },
  'rice': {
    prepTime: 5, cookTime: 20, portions: 2,
    ingredients: [
      { slug: 'rice-basmati', qty: 0.15, unit: 'kg' },
      { slug: 'butter', qty: 0.02, unit: 'kg' },
      { slug: 'sea-salt', qty: 0.003, unit: 'kg' },
    ],
    steps: [
      { step: 1, desc: 'Промити рис', time: 2 },
      { step: 2, desc: 'Залити водою 1:2 та варити 15 хв', time: 17 },
      { step: 3, desc: 'Додати масло та перемішати', time: 2 },
    ],
  },

  // ===== DRINKS (simple, no cooking) =====
  'espresso': {
    prepTime: 1, cookTime: 1, portions: 1,
    ingredients: [
      { slug: 'coffee-arabica', qty: 0.018, unit: 'kg' },
    ],
    steps: [
      { step: 1, desc: 'Змолоти каву', time: 0.5 },
      { step: 2, desc: 'Приготувати еспресо 25 сек', time: 0.5 },
    ],
  },
  'cappuccino': {
    prepTime: 1, cookTime: 2, portions: 1,
    ingredients: [
      { slug: 'coffee-arabica', qty: 0.018, unit: 'kg' },
      { slug: 'milk', qty: 0.15, unit: 'l' },
    ],
    steps: [
      { step: 1, desc: 'Приготувати еспресо', time: 0.5 },
      { step: 2, desc: 'Спінити молоко', time: 1 },
      { step: 3, desc: 'З\'єднати та прикрасити', time: 0.5 },
    ],
  },
  'lemonade': {
    prepTime: 5, cookTime: 0, portions: 1,
    ingredients: [
      { slug: 'lemon', qty: 1, unit: 'pcs' },
      { slug: 'still-water', qty: 0.3, unit: 'l' },
    ],
    steps: [
      { step: 1, desc: 'Вичавити лимон', time: 2 },
      { step: 2, desc: 'Змішати з водою та цукром', time: 2 },
      { step: 3, desc: 'Додати лід', time: 1 },
    ],
  },
  'orange-juice': {
    prepTime: 3, cookTime: 0, portions: 1,
    ingredients: [
      { slug: 'orange-juice-fresh', qty: 0.25, unit: 'l' },
    ],
    steps: [
      { step: 1, desc: 'Вичавити апельсини', time: 3 },
    ],
  },
  'aperol-spritz': {
    prepTime: 2, cookTime: 0, portions: 1,
    ingredients: [
      { slug: 'aperol', qty: 0.06, unit: 'l' },
      { slug: 'prosecco-doc', qty: 0.09, unit: 'l' },
      { slug: 'sparkling-water', qty: 0.03, unit: 'l' },
    ],
    steps: [
      { step: 1, desc: 'Наповнити келих льодом', time: 0.5 },
      { step: 2, desc: 'Додати Апероль та Просекко', time: 1 },
      { step: 3, desc: 'Долити содову та прикрасити', time: 0.5 },
    ],
  },
};

// Add lemon as missing ingredient
const additionalIngredients = [
  { name: 'Lemon', nameUk: 'Лимон', slug: 'lemon', unit: 'pcs', mainCategory: 'raw', subCategory: 'fruits', costPerUnit: 15, currentStock: 50 },
];

// ========== MAIN FUNCTIONS ==========

async function seedMissingIngredients() {
  console.log('🍋 Checking for missing ingredients...');

  const data = await graphql(`{ ingredients(pagination: { limit: 200 }) { slug } }`);
  const existingSlugs = new Set(data?.ingredients.map(i => i.slug) || []);

  for (const ing of additionalIngredients) {
    if (existingSlugs.has(ing.slug)) {
      console.log(`  ⏭ ${ing.nameUk} exists`);
      continue;
    }

    const result = await graphql(`
      mutation CreateIngredient($data: IngredientInput!) {
        createIngredient(data: $data) { documentId }
      }
    `, { data: { ...ing, isActive: true } });

    if (result?.createIngredient) {
      console.log(`  ✓ Created ${ing.nameUk}`);
      // Publish it
      await rest('PUT', `/ingredients/${result.createIngredient.documentId}`, {
        data: { publishedAt: new Date().toISOString() }
      });
    }
  }
}

async function seedRecipes() {
  console.log('\n📋 Seeding Recipes...\n');

  // Get all menu items
  const menuData = await graphql(`{
    menuItems(pagination: { limit: 200 }) {
      documentId
      name
      nameUk
      slug
      recipe { documentId }
    }
  }`);

  if (!menuData) {
    console.error('Failed to fetch menu items');
    return;
  }

  // Get all ingredients
  const ingData = await graphql(`{
    ingredients(pagination: { limit: 200 }) {
      documentId
      slug
    }
  }`);

  const ingredientMap = {};
  ingData?.ingredients.forEach(i => ingredientMap[i.slug] = i.documentId);

  let created = 0, skipped = 0, noRecipe = 0;

  for (const menuItem of menuData.menuItems) {
    // Skip if already has recipe
    if (menuItem.recipe?.documentId) {
      console.log(`  ⏭ ${menuItem.nameUk || menuItem.name} - already has recipe`);
      skipped++;
      continue;
    }

    // Check if we have a recipe definition
    const recipeDef = recipeDefinitions[menuItem.slug];
    if (!recipeDef) {
      console.log(`  ⚠ ${menuItem.nameUk || menuItem.name} - no recipe definition`);
      noRecipe++;
      continue;
    }

    // Build ingredients array
    const ingredients = [];
    let missingIngredient = false;

    for (const ing of recipeDef.ingredients) {
      const ingredientId = ingredientMap[ing.slug];
      if (!ingredientId) {
        console.log(`    Missing ingredient: ${ing.slug}`);
        missingIngredient = true;
        continue;
      }
      ingredients.push({
        ingredient: ingredientId,
        quantity: ing.qty,
        unit: ing.unit,
      });
    }

    if (missingIngredient && ingredients.length === 0) {
      console.log(`  ✗ ${menuItem.nameUk || menuItem.name} - missing all ingredients`);
      continue;
    }

    // Build steps array (round time to integers)
    const steps = recipeDef.steps.map(s => ({
      stepNumber: s.step,
      description: s.desc,
      estimatedTimeMinutes: Math.round(s.time),
    }));

    // Create recipe
    const recipeSlug = `recipe-${menuItem.slug}`;
    const recipeName = menuItem.name;
    const recipeNameUk = menuItem.nameUk;

    const result = await graphql(`
      mutation CreateRecipe($data: RecipeInput!) {
        createRecipe(data: $data) { documentId }
      }
    `, {
      data: {
        name: recipeName,
        nameUk: recipeNameUk,
        slug: recipeSlug,
        prepTimeMinutes: recipeDef.prepTime,
        cookTimeMinutes: recipeDef.cookTime,
        portionYield: recipeDef.portions,
        isActive: true,
        ingredients,
        steps,
      },
    });

    if (result?.createRecipe) {
      const recipeId = result.createRecipe.documentId;
      console.log(`  ✓ ${menuItem.nameUk || menuItem.name}`);

      // Publish recipe
      await rest('PUT', `/recipes/${recipeId}`, {
        data: { publishedAt: new Date().toISOString() }
      });

      // Link recipe to menu item
      await graphql(`
        mutation UpdateMenuItem($documentId: ID!, $data: MenuItemInput!) {
          updateMenuItem(documentId: $documentId, data: $data) { documentId }
        }
      `, {
        documentId: menuItem.documentId,
        data: { recipe: recipeId },
      });

      created++;
    } else {
      console.log(`  ✗ ${menuItem.nameUk || menuItem.name} - failed to create`);
    }
  }

  console.log(`\n  Created: ${created}, Skipped: ${skipped}, No definition: ${noRecipe}`);
}

async function verifyRecipes() {
  console.log('\n🔍 Verifying recipes...\n');

  const data = await graphql(`{
    menuItems(pagination: { limit: 200 }) {
      nameUk
      name
      recipe { documentId name }
    }
    recipes(pagination: { limit: 100 }) {
      documentId
      nameUk
      name
      ingredients { ingredient { nameUk } quantity }
    }
  }`);

  if (!data) return;

  const withRecipe = data.menuItems.filter(m => m.recipe?.documentId);
  const withoutRecipe = data.menuItems.filter(m => !m.recipe?.documentId);

  console.log(`  Menu items with recipes: ${withRecipe.length}`);
  console.log(`  Menu items without recipes: ${withoutRecipe.length}`);
  console.log(`  Total recipes: ${data.recipes.length}`);

  if (withoutRecipe.length > 0 && withoutRecipe.length <= 20) {
    console.log('\n  Items without recipes:');
    withoutRecipe.forEach(m => console.log(`    - ${m.nameUk || m.name}`));
  }
}

// ========== MAIN ==========
async function main() {
  console.log('🍽️ Recipe Seed Script\n');
  console.log('=' .repeat(50) + '\n');

  await seedMissingIngredients();
  await seedRecipes();
  await verifyRecipes();

  console.log('\n' + '=' .repeat(50));
  console.log('✅ Recipe seed completed!');
}

main().catch(console.error);
