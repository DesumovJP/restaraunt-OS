/**
 * Seed script for restaurant data:
 * - Menu Categories
 * - Menu Items
 * - Ingredients
 * - Tables
 * - Suppliers
 */

// ============================================
// SEED DATA
// ============================================

const CATEGORIES = [
  { name: 'Appetizers', nameUk: 'Закуски', slug: 'appetizers', icon: '🥗', sortOrder: 1 },
  { name: 'Soups', nameUk: 'Супи', slug: 'soups', icon: '🍲', sortOrder: 2 },
  { name: 'Salads', nameUk: 'Салати', slug: 'salads', icon: '🥬', sortOrder: 3 },
  { name: 'Main Courses', nameUk: 'Основні страви', slug: 'main-courses', icon: '🍽️', sortOrder: 4 },
  { name: 'Grill', nameUk: 'Гриль', slug: 'grill', icon: '🥩', sortOrder: 5 },
  { name: 'Pasta', nameUk: 'Паста', slug: 'pasta', icon: '🍝', sortOrder: 6 },
  { name: 'Desserts', nameUk: 'Десерти', slug: 'desserts', icon: '🍰', sortOrder: 7 },
  { name: 'Drinks', nameUk: 'Напої', slug: 'drinks', icon: '🍹', sortOrder: 8 },
  { name: 'Wine', nameUk: 'Вино', slug: 'wine', icon: '🍷', sortOrder: 9 },
  { name: 'Semi-finished', nameUk: 'Напівфабрикати', slug: 'semi-finished', icon: '📦', sortOrder: 100 },
];

const MENU_ITEMS = [
  // Закуски
  { name: 'Bruschetta', nameUk: 'Брускета з томатами', category: 'appetizers', price: 145, weight: 180, outputType: 'cold', primaryStation: 'salad', servingCourse: 'appetizer' },
  { name: 'Carpaccio', nameUk: 'Карпачо з яловичини', category: 'appetizers', price: 285, weight: 150, outputType: 'cold', primaryStation: 'salad', servingCourse: 'appetizer' },
  { name: 'Cheese Plate', nameUk: 'Сирна тарілка', category: 'appetizers', price: 320, weight: 200, outputType: 'cold', primaryStation: 'salad', servingCourse: 'appetizer' },

  // Супи
  { name: 'Borscht', nameUk: 'Борщ український', category: 'soups', price: 125, weight: 350, outputType: 'kitchen', primaryStation: 'hot', servingCourse: 'soup' },
  { name: 'Mushroom Cream Soup', nameUk: 'Крем-суп грибний', category: 'soups', price: 135, weight: 300, outputType: 'kitchen', primaryStation: 'hot', servingCourse: 'soup' },
  { name: 'Tom Yum', nameUk: 'Том Ям з креветками', category: 'soups', price: 195, weight: 350, outputType: 'kitchen', primaryStation: 'hot', servingCourse: 'soup' },

  // Салати
  { name: 'Caesar Salad', nameUk: 'Салат Цезар', category: 'salads', price: 185, weight: 250, outputType: 'cold', primaryStation: 'salad', servingCourse: 'starter' },
  { name: 'Greek Salad', nameUk: 'Грецький салат', category: 'salads', price: 165, weight: 280, outputType: 'cold', primaryStation: 'salad', servingCourse: 'starter' },
  { name: 'Warm Salad with Beef', nameUk: 'Теплий салат з телятиною', category: 'salads', price: 245, weight: 300, outputType: 'kitchen', primaryStation: 'hot', servingCourse: 'starter' },

  // Основні страви
  { name: 'Chicken Kyiv', nameUk: 'Котлета по-київськи', category: 'main-courses', price: 265, weight: 280, outputType: 'kitchen', primaryStation: 'fry', servingCourse: 'main' },
  { name: 'Pork Medallions', nameUk: 'Медальйони зі свинини', category: 'main-courses', price: 295, weight: 320, outputType: 'kitchen', primaryStation: 'grill', servingCourse: 'main' },
  { name: 'Salmon Fillet', nameUk: 'Філе лосося', category: 'main-courses', price: 385, weight: 250, outputType: 'kitchen', primaryStation: 'grill', servingCourse: 'main' },
  { name: 'Duck Breast', nameUk: 'Качина грудка', category: 'main-courses', price: 425, weight: 300, outputType: 'kitchen', primaryStation: 'hot', servingCourse: 'main' },

  // Гриль
  { name: 'Ribeye Steak', nameUk: 'Стейк Рібай', category: 'grill', price: 545, weight: 350, outputType: 'kitchen', primaryStation: 'grill', servingCourse: 'main' },
  { name: 'Pork Ribs', nameUk: 'Свинячі ребра BBQ', category: 'grill', price: 345, weight: 450, outputType: 'kitchen', primaryStation: 'grill', servingCourse: 'main' },
  { name: 'Grilled Vegetables', nameUk: 'Овочі гриль', category: 'grill', price: 145, weight: 250, outputType: 'kitchen', primaryStation: 'grill', servingCourse: 'main' },

  // Паста
  { name: 'Carbonara', nameUk: 'Карбонара', category: 'pasta', price: 195, weight: 320, outputType: 'kitchen', primaryStation: 'hot', servingCourse: 'main' },
  { name: 'Bolognese', nameUk: 'Болоньєзе', category: 'pasta', price: 185, weight: 350, outputType: 'kitchen', primaryStation: 'hot', servingCourse: 'main' },
  { name: 'Seafood Pasta', nameUk: 'Паста з морепродуктами', category: 'pasta', price: 285, weight: 350, outputType: 'kitchen', primaryStation: 'hot', servingCourse: 'main' },

  // Десерти
  { name: 'Tiramisu', nameUk: 'Тірамісу', category: 'desserts', price: 145, weight: 150, outputType: 'pastry', primaryStation: 'dessert', servingCourse: 'dessert' },
  { name: 'Cheesecake', nameUk: 'Чізкейк', category: 'desserts', price: 135, weight: 160, outputType: 'pastry', primaryStation: 'dessert', servingCourse: 'dessert' },
  { name: 'Chocolate Fondant', nameUk: 'Шоколадний фондан', category: 'desserts', price: 165, weight: 180, outputType: 'pastry', primaryStation: 'dessert', servingCourse: 'dessert' },

  // Напої
  { name: 'Espresso', nameUk: 'Еспресо', category: 'drinks', price: 55, weight: 30, outputType: 'bar', primaryStation: 'bar', servingCourse: 'drink' },
  { name: 'Cappuccino', nameUk: 'Капучіно', category: 'drinks', price: 75, weight: 200, outputType: 'bar', primaryStation: 'bar', servingCourse: 'drink' },
  { name: 'Fresh Orange Juice', nameUk: 'Фреш апельсиновий', category: 'drinks', price: 95, weight: 300, outputType: 'bar', primaryStation: 'bar', servingCourse: 'drink' },
  { name: 'Lemonade', nameUk: 'Лимонад домашній', category: 'drinks', price: 85, weight: 400, outputType: 'bar', primaryStation: 'bar', servingCourse: 'drink' },

  // Вино
  { name: 'House Red Wine', nameUk: 'Вино червоне (келих)', category: 'wine', price: 125, weight: 150, outputType: 'bar', primaryStation: 'bar', servingCourse: 'drink' },
  { name: 'House White Wine', nameUk: 'Вино біле (келих)', category: 'wine', price: 125, weight: 150, outputType: 'bar', primaryStation: 'bar', servingCourse: 'drink' },
];

const TABLES = [
  { number: 1, capacity: 2, zone: 'terrace' },
  { number: 2, capacity: 2, zone: 'terrace' },
  { number: 3, capacity: 4, zone: 'main' },
  { number: 4, capacity: 4, zone: 'main' },
  { number: 5, capacity: 4, zone: 'main' },
  { number: 6, capacity: 6, zone: 'main' },
  { number: 7, capacity: 6, zone: 'main' },
  { number: 8, capacity: 8, zone: 'vip' },
  { number: 9, capacity: 4, zone: 'bar' },
  { number: 10, capacity: 4, zone: 'bar' },
];

const SUPPLIERS = [
  { name: 'Metro Cash & Carry', contactName: 'Іван Петренко', phone: '+380501234567', email: 'ivan@metro.ua' },
  { name: 'Сільпо Постачання', contactName: 'Олена Коваленко', phone: '+380672345678', email: 'olena@silpo.ua' },
  { name: 'Фермерське господарство "Зоря"', contactName: 'Микола Шевченко', phone: '+380933456789', email: 'zorya@farm.ua' },
  { name: 'Риба Опт', contactName: 'Андрій Бондаренко', phone: '+380504567890', email: 'fish@opt.ua' },
  { name: 'Молочна справа', contactName: 'Марія Литвиненко', phone: '+380675678901', email: 'dairy@moloko.ua' },
];

const INGREDIENTS = [
  // Овочі
  { name: 'Tomatoes', nameUk: 'Помідори', unit: 'kg', mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 7 },
  { name: 'Onions', nameUk: 'Цибуля', unit: 'kg', mainCategory: 'raw', storageCondition: 'ambient', shelfLifeDays: 30 },
  { name: 'Garlic', nameUk: 'Часник', unit: 'kg', mainCategory: 'raw', storageCondition: 'ambient', shelfLifeDays: 30 },
  { name: 'Potatoes', nameUk: 'Картопля', unit: 'kg', mainCategory: 'raw', storageCondition: 'dry-cool', shelfLifeDays: 30 },
  { name: 'Carrots', nameUk: 'Морква', unit: 'kg', mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 14 },
  { name: 'Beetroot', nameUk: 'Буряк', unit: 'kg', mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 21 },
  { name: 'Cabbage', nameUk: 'Капуста', unit: 'kg', mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 14 },
  { name: 'Lettuce', nameUk: 'Салат', unit: 'kg', mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 5 },
  { name: 'Cucumber', nameUk: 'Огірки', unit: 'kg', mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 7 },
  { name: 'Bell Pepper', nameUk: 'Перець болгарський', unit: 'kg', mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 10 },

  // М'ясо
  { name: 'Beef Tenderloin', nameUk: 'Яловича вирізка', unit: 'kg', mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 5 },
  { name: 'Pork Loin', nameUk: 'Свиняча корейка', unit: 'kg', mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 5 },
  { name: 'Chicken Breast', nameUk: 'Куряче філе', unit: 'kg', mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 3 },
  { name: 'Duck Breast', nameUk: 'Качина грудка', unit: 'kg', mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 5 },
  { name: 'Ribeye Steak', nameUk: 'Стейк Рібай', unit: 'kg', mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 7 },
  { name: 'Pork Ribs', nameUk: 'Свинячі ребра', unit: 'kg', mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 5 },

  // Риба та морепродукти
  { name: 'Salmon Fillet', nameUk: 'Філе лосося', unit: 'kg', mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 3 },
  { name: 'Shrimp', nameUk: 'Креветки', unit: 'kg', mainCategory: 'frozen', storageCondition: 'frozen', shelfLifeDays: 90 },
  { name: 'Mussels', nameUk: 'Мідії', unit: 'kg', mainCategory: 'frozen', storageCondition: 'frozen', shelfLifeDays: 90 },

  // Молочні продукти
  { name: 'Butter', nameUk: 'Вершкове масло', unit: 'kg', mainCategory: 'dairy', storageCondition: 'refrigerated', shelfLifeDays: 30 },
  { name: 'Cream 33%', nameUk: 'Вершки 33%', unit: 'l', mainCategory: 'dairy', storageCondition: 'refrigerated', shelfLifeDays: 10 },
  { name: 'Parmesan', nameUk: 'Пармезан', unit: 'kg', mainCategory: 'dairy', storageCondition: 'refrigerated', shelfLifeDays: 60 },
  { name: 'Mozzarella', nameUk: 'Моцарелла', unit: 'kg', mainCategory: 'dairy', storageCondition: 'refrigerated', shelfLifeDays: 14 },
  { name: 'Feta Cheese', nameUk: 'Сир фета', unit: 'kg', mainCategory: 'dairy', storageCondition: 'refrigerated', shelfLifeDays: 30 },
  { name: 'Sour Cream', nameUk: 'Сметана', unit: 'kg', mainCategory: 'dairy', storageCondition: 'refrigerated', shelfLifeDays: 14 },
  { name: 'Eggs', nameUk: 'Яйця', unit: 'pcs', mainCategory: 'dairy', storageCondition: 'refrigerated', shelfLifeDays: 30 },

  // Сухі продукти
  { name: 'Pasta Spaghetti', nameUk: 'Паста спагетті', unit: 'kg', mainCategory: 'dry-goods', storageCondition: 'ambient', shelfLifeDays: 365 },
  { name: 'Rice', nameUk: 'Рис', unit: 'kg', mainCategory: 'dry-goods', storageCondition: 'ambient', shelfLifeDays: 365 },
  { name: 'Flour', nameUk: 'Борошно', unit: 'kg', mainCategory: 'dry-goods', storageCondition: 'dry-cool', shelfLifeDays: 180 },
  { name: 'Sugar', nameUk: 'Цукор', unit: 'kg', mainCategory: 'dry-goods', storageCondition: 'ambient', shelfLifeDays: 730 },

  // Олії та жири
  { name: 'Olive Oil', nameUk: 'Оливкова олія', unit: 'l', mainCategory: 'oils-fats', storageCondition: 'ambient', shelfLifeDays: 365 },
  { name: 'Sunflower Oil', nameUk: 'Соняшникова олія', unit: 'l', mainCategory: 'oils-fats', storageCondition: 'ambient', shelfLifeDays: 365 },

  // Приправи
  { name: 'Salt', nameUk: 'Сіль', unit: 'kg', mainCategory: 'seasonings', storageCondition: 'ambient', shelfLifeDays: 1825 },
  { name: 'Black Pepper', nameUk: 'Чорний перець', unit: 'kg', mainCategory: 'seasonings', storageCondition: 'ambient', shelfLifeDays: 730 },
  { name: 'Basil Fresh', nameUk: 'Базилік свіжий', unit: 'kg', mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 5 },
  { name: 'Rosemary Fresh', nameUk: 'Розмарин свіжий', unit: 'kg', mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 7 },

  // Напої
  { name: 'Coffee Beans', nameUk: 'Кава в зернах', unit: 'kg', mainCategory: 'beverages', storageCondition: 'ambient', shelfLifeDays: 180 },
  { name: 'Orange Juice', nameUk: 'Апельсиновий сік', unit: 'l', mainCategory: 'beverages', storageCondition: 'refrigerated', shelfLifeDays: 7 },
  { name: 'Mineral Water', nameUk: 'Мінеральна вода', unit: 'l', mainCategory: 'beverages', storageCondition: 'ambient', shelfLifeDays: 365 },
];

// ============================================
// SEED FUNCTION
// ============================================

export async function seedRestaurantData(strapi: any) {
  console.log('🍽️  Seeding restaurant data...');

  const categoryMap: Record<string, string> = {};

  // 1. Create Suppliers
  console.log('\n📦 Creating suppliers...');
  for (const supplier of SUPPLIERS) {
    try {
      const existing = await strapi.db.query('api::supplier.supplier').findOne({
        where: { name: supplier.name }
      });
      if (existing) {
        console.log(`  ⏭️  Supplier ${supplier.name} exists`);
        continue;
      }

      await strapi.documents('api::supplier.supplier').create({
        data: {
          ...supplier,
          slug: supplier.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          isActive: true,
        }
      });
      console.log(`  ✅ ${supplier.name}`);
    } catch (error: any) {
      console.error(`  ❌ Failed: ${supplier.name}`, error.message);
    }
  }

  // 2. Create Ingredients
  console.log('\n🥕 Creating ingredients...');
  for (const ingredient of INGREDIENTS) {
    try {
      const existing = await strapi.db.query('api::ingredient.ingredient').findOne({
        where: { name: ingredient.name }
      });
      if (existing) {
        console.log(`  ⏭️  Ingredient ${ingredient.nameUk} exists`);
        continue;
      }

      await strapi.documents('api::ingredient.ingredient').create({
        data: {
          ...ingredient,
          slug: ingredient.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          currentStock: 0,
          minStock: 5,
          isActive: true,
        }
      });
      console.log(`  ✅ ${ingredient.nameUk}`);
    } catch (error: any) {
      console.error(`  ❌ Failed: ${ingredient.nameUk}`, error.message);
    }
  }

  // 3. Create Tables
  console.log('\n🪑 Creating tables...');
  for (const table of TABLES) {
    try {
      const existing = await strapi.db.query('api::table.table').findOne({
        where: { number: table.number }
      });
      if (existing) {
        console.log(`  ⏭️  Table ${table.number} exists`);
        continue;
      }

      await strapi.documents('api::table.table').create({
        data: {
          ...table,
          status: 'free',
          isActive: true,
        }
      });
      console.log(`  ✅ Table ${table.number} (${table.zone})`);
    } catch (error: any) {
      console.error(`  ❌ Failed: Table ${table.number}`, error.message);
    }
  }

  // 4. Create Categories (with publish for draftAndPublish)
  console.log('\n📂 Creating menu categories...');
  for (const category of CATEGORIES) {
    try {
      const existing = await strapi.db.query('api::menu-category.menu-category').findOne({
        where: { slug: category.slug }
      });
      if (existing) {
        console.log(`  ⏭️  Category ${category.nameUk} exists`);
        categoryMap[category.slug] = existing.documentId;
        continue;
      }

      const created = await strapi.documents('api::menu-category.menu-category').create({
        data: {
          ...category,
          isActive: true,
        },
        status: 'published',
      });
      categoryMap[category.slug] = created.documentId;
      console.log(`  ✅ ${category.nameUk}`);
    } catch (error: any) {
      console.error(`  ❌ Failed: ${category.nameUk}`, error.message);
    }
  }

  // 5. Create Menu Items (with publish)
  console.log('\n🍽️  Creating menu items...');
  for (const item of MENU_ITEMS) {
    try {
      const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existing = await strapi.db.query('api::menu-item.menu-item').findOne({
        where: { slug }
      });
      if (existing) {
        console.log(`  ⏭️  Menu item ${item.nameUk} exists`);
        continue;
      }

      const categoryId = categoryMap[item.category];
      if (!categoryId) {
        console.log(`  ⚠️  Category not found for ${item.nameUk}`);
        continue;
      }

      await strapi.documents('api::menu-item.menu-item').create({
        data: {
          name: item.name,
          nameUk: item.nameUk,
          slug,
          price: item.price,
          weight: item.weight,
          outputType: item.outputType,
          primaryStation: item.primaryStation,
          servingCourse: item.servingCourse,
          available: true,
          preparationTime: 15,
          category: categoryId,
        },
        status: 'published',
      });
      console.log(`  ✅ ${item.nameUk} - ${item.price} грн`);
    } catch (error: any) {
      console.error(`  ❌ Failed: ${item.nameUk}`, error.message);
    }
  }

  console.log('\n✨ Restaurant data seed completed!');
}

export default seedRestaurantData;
