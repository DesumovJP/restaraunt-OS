/**
 * Seed script for stock batches - initial inventory for all ingredients
 * IDs are loaded dynamically from the database
 */

// These will be populated dynamically from the database
let INGREDIENT_DATA: Record<string, { id: string; unit: string; shelfDays: number; category: string }> = {};
let SUPPLIER_IDS: Record<string, string> = {};

// Helper function to load ingredient data from database
async function loadIngredientData(strapi: any): Promise<void> {
  const ingredients = await strapi.db.query('api::ingredient.ingredient').findMany({
    select: ['documentId', 'slug', 'unit', 'shelfLifeDays', 'mainCategory'],
  });

  INGREDIENT_DATA = {};
  for (const ing of ingredients) {
    if (ing.slug && ing.documentId) {
      INGREDIENT_DATA[ing.slug] = {
        id: ing.documentId,
        unit: ing.unit || 'kg',
        shelfDays: ing.shelfLifeDays || 7,
        category: ing.mainCategory || 'raw',
      };
    }
  }
  console.log(`  📋 Loaded ${Object.keys(INGREDIENT_DATA).length} ingredient records`);
}

// Helper function to load supplier IDs from database
async function loadSupplierIds(strapi: any): Promise<void> {
  const suppliers = await strapi.db.query('api::supplier.supplier').findMany({
    select: ['documentId', 'slug'],
  });

  SUPPLIER_IDS = {};
  for (const sup of suppliers) {
    if (sup.slug && sup.documentId) {
      SUPPLIER_IDS[sup.slug] = sup.documentId;
    }
  }
  console.log(`  📋 Loaded ${Object.keys(SUPPLIER_IDS).length} supplier IDs`);
}

// Stock configuration per ingredient type
interface StockConfig {
  quantity: number;
  unitCost: number;
  supplier: string;
}

const STOCK_CONFIG: Record<string, StockConfig> = {
  // Vegetables
  'tomatoes': { quantity: 15, unitCost: 45, supplier: 'silpo' },
  'onions': { quantity: 20, unitCost: 18, supplier: 'silpo' },
  'garlic': { quantity: 3, unitCost: 120, supplier: 'silpo' },
  'potatoes': { quantity: 30, unitCost: 15, supplier: 'silpo' },
  'carrots': { quantity: 15, unitCost: 20, supplier: 'silpo' },
  'beetroot': { quantity: 10, unitCost: 18, supplier: 'silpo' },
  'cabbage': { quantity: 10, unitCost: 12, supplier: 'silpo' },
  'lettuce': { quantity: 5, unitCost: 85, supplier: 'silpo' },
  'cucumber': { quantity: 10, unitCost: 35, supplier: 'silpo' },
  'bell-pepper': { quantity: 8, unitCost: 65, supplier: 'silpo' },

  // Meats
  'beef-tenderloin': { quantity: 10, unitCost: 450, supplier: 'metro' },
  'pork-loin': { quantity: 12, unitCost: 180, supplier: 'metro' },
  'chicken-breast': { quantity: 15, unitCost: 120, supplier: 'metro' },
  'duck-breast': { quantity: 8, unitCost: 380, supplier: 'metro' },
  'ribeye-steak': { quantity: 15, unitCost: 580, supplier: 'metro' },
  'pork-ribs': { quantity: 12, unitCost: 145, supplier: 'metro' },

  // Seafood
  'salmon-fillet': { quantity: 8, unitCost: 650, supplier: 'metro' },
  'shrimp': { quantity: 5, unitCost: 480, supplier: 'metro' },
  'mussels': { quantity: 5, unitCost: 220, supplier: 'metro' },

  // Dairy
  'butter': { quantity: 10, unitCost: 180, supplier: 'metro' },
  'cream-33-': { quantity: 15, unitCost: 85, supplier: 'metro' },
  'parmesan': { quantity: 5, unitCost: 650, supplier: 'metro' },
  'mozzarella': { quantity: 5, unitCost: 280, supplier: 'metro' },
  'feta-cheese': { quantity: 5, unitCost: 220, supplier: 'metro' },
  'sour-cream': { quantity: 10, unitCost: 65, supplier: 'metro' },
  'eggs': { quantity: 300, unitCost: 4.5, supplier: 'silpo' },

  // Dry goods
  'pasta-spaghetti': { quantity: 20, unitCost: 45, supplier: 'metro' },
  'rice': { quantity: 15, unitCost: 38, supplier: 'metro' },
  'flour': { quantity: 25, unitCost: 22, supplier: 'metro' },
  'sugar': { quantity: 20, unitCost: 28, supplier: 'metro' },

  // Oils
  'olive-oil': { quantity: 10, unitCost: 185, supplier: 'metro' },
  'sunflower-oil': { quantity: 15, unitCost: 55, supplier: 'metro' },

  // Seasonings
  'salt': { quantity: 10, unitCost: 12, supplier: 'metro' },
  'black-pepper': { quantity: 2, unitCost: 280, supplier: 'metro' },

  // Fresh herbs
  'basil-fresh': { quantity: 1, unitCost: 350, supplier: 'silpo' },
  'rosemary-fresh': { quantity: 0.5, unitCost: 420, supplier: 'silpo' },

  // Beverages
  'coffee-beans': { quantity: 5, unitCost: 480, supplier: 'metro' },
  'orange-juice': { quantity: 20, unitCost: 45, supplier: 'silpo' },
  'mineral-water': { quantity: 50, unitCost: 12, supplier: 'metro' },
};

function generateBatchNumber(ingredientKey: string, batchIndex: number): string {
  const prefix = ingredientKey.substring(0, 3).toUpperCase();
  const date = new Date();
  const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
  return `${prefix}-${dateStr}-${String(batchIndex).padStart(3, '0')}`;
}

function getExpiryDate(shelfDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + shelfDays);
  return date.toISOString().split('T')[0];
}

function getReceivedDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

export async function seedStockBatches(strapi: any) {
  console.log('📦 Seeding stock batches...');

  // Load IDs dynamically from database
  await loadIngredientData(strapi);
  await loadSupplierIds(strapi);

  if (Object.keys(INGREDIENT_DATA).length === 0) {
    console.log('  ⚠️  No ingredients found in database. Run restaurant seed first.');
    return;
  }

  // Get first available supplier if specific one not found
  const defaultSupplierId = Object.values(SUPPLIER_IDS)[0];

  let batchIndex = 1;

  for (const [ingredientSlug, config] of Object.entries(STOCK_CONFIG)) {
    const ingredientData = INGREDIENT_DATA[ingredientSlug];
    if (!ingredientData) {
      console.log(`  ⚠️  Ingredient not found in DB: ${ingredientSlug}`);
      continue;
    }

    try {
      // Check if stock batch exists for this ingredient using documentId
      const existing = await strapi.db.query('api::stock-batch.stock-batch').findOne({
        where: {
          ingredient: { documentId: ingredientData.id },
          status: 'available',
        }
      });

      if (existing) {
        console.log(`  ⏭️  Stock batch for ${ingredientSlug} exists`);
        continue;
      }

      // Find supplier by slug pattern (metro, silpo, etc.)
      const supplierSlug = config.supplier;
      let supplierId = defaultSupplierId;
      for (const [slug, docId] of Object.entries(SUPPLIER_IDS)) {
        if (slug.toLowerCase().includes(supplierSlug.toLowerCase())) {
          supplierId = docId;
          break;
        }
      }

      const batchNumber = generateBatchNumber(ingredientSlug, batchIndex);
      const receivedAt = getReceivedDate(Math.floor(Math.random() * 3) + 1); // 1-3 days ago
      const expiryDate = getExpiryDate(ingredientData.shelfDays);
      const totalCost = config.quantity * config.unitCost;

      await strapi.documents('api::stock-batch.stock-batch').create({
        data: {
          batchNumber,
          ingredient: ingredientData.id, // This is documentId
          grossIn: config.quantity,
          netAvailable: config.quantity,
          usedAmount: 0,
          wastedAmount: 0,
          unitCost: config.unitCost,
          totalCost,
          receivedAt,
          expiryDate,
          status: 'available',
          isLocked: false,
          supplier: supplierId, // documentId
          invoiceNumber: `INV-${new Date().getFullYear()}-${String(batchIndex).padStart(4, '0')}`,
          processes: [],
        }
      });

      // Update ingredient's currentStock using documentId
      await strapi.documents('api::ingredient.ingredient').update({
        documentId: ingredientData.id,
        data: {
          currentStock: config.quantity,
          costPerUnit: config.unitCost,
        }
      });

      console.log(`  ✅ ${ingredientSlug}: ${config.quantity} ${ingredientData.unit} @ ${config.unitCost} UAH`);
      batchIndex++;
    } catch (error: any) {
      console.error(`  ❌ Failed: ${ingredientSlug}`, error.message);
    }
  }

  console.log('\n✨ Stock batches seed completed!');
}

export default seedStockBatches;
