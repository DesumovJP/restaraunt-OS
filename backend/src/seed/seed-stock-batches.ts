/**
 * Seed script for stock batches - initial inventory for all ingredients
 */

// Ingredient document IDs mapping
const INGREDIENT_IDS: Record<string, { id: string; unit: string; shelfDays: number; category: string }> = {
  'tomatoes': { id: 'qxk156cv0ztpctjhr9kmma1c', unit: 'kg', shelfDays: 7, category: 'raw' },
  'onions': { id: 't1yle3y4rmnm4ckohp86h4ti', unit: 'kg', shelfDays: 30, category: 'raw' },
  'garlic': { id: 'kdkicogeeq6dhxqgxjz9gjcp', unit: 'kg', shelfDays: 30, category: 'raw' },
  'potatoes': { id: 'byls75ahu7f7giyhv2b55x8e', unit: 'kg', shelfDays: 30, category: 'raw' },
  'carrots': { id: 'pb2p2byfapukh87j2klz8vqk', unit: 'kg', shelfDays: 14, category: 'raw' },
  'beetroot': { id: 'q0dar1lyb3u2cc66tpicnsch', unit: 'kg', shelfDays: 21, category: 'raw' },
  'cabbage': { id: 'gc204ha09im17x9lrw987dsq', unit: 'kg', shelfDays: 14, category: 'raw' },
  'lettuce': { id: 'ejn1391vvusnogr1p3xoq7z3', unit: 'kg', shelfDays: 5, category: 'raw' },
  'cucumber': { id: 'dlr91cx87omseewzb7oi4pro', unit: 'kg', shelfDays: 7, category: 'raw' },
  'bell-pepper': { id: 'q8xkupobl1bos64cyr3oh2r0', unit: 'kg', shelfDays: 10, category: 'raw' },
  'beef-tenderloin': { id: 'v6eh9woscojesmcmfgf0lbsv', unit: 'kg', shelfDays: 5, category: 'raw' },
  'pork-loin': { id: 'ko3nrapz6j8qnt5lqohekrkx', unit: 'kg', shelfDays: 5, category: 'raw' },
  'chicken-breast': { id: 'vad6vfi54vz2figwvysh7zjm', unit: 'kg', shelfDays: 3, category: 'raw' },
  'duck-breast': { id: 'wj4aiso6v0m1zgz8ke59553o', unit: 'kg', shelfDays: 5, category: 'raw' },
  'ribeye-steak': { id: 'nl28p7qhi19ba1n5qtk8m18c', unit: 'kg', shelfDays: 7, category: 'raw' },
  'pork-ribs': { id: 'opgwy6zq1n07bpc3kcaimt2x', unit: 'kg', shelfDays: 5, category: 'raw' },
  'salmon-fillet': { id: 'dhhls9euk13yxuewik4wxivi', unit: 'kg', shelfDays: 3, category: 'raw' },
  'shrimp': { id: 'om5amoflabpvupjgi48npqc2', unit: 'kg', shelfDays: 90, category: 'frozen' },
  'mussels': { id: 'd00009cnhvokzwk7o8ypumnf', unit: 'kg', shelfDays: 90, category: 'frozen' },
  'butter': { id: 'oey5ic0b5vdctfphav9jgtdu', unit: 'kg', shelfDays: 30, category: 'dairy' },
  'cream': { id: 'ulh9jcy5h5urb4e2mu8on88s', unit: 'l', shelfDays: 10, category: 'dairy' },
  'parmesan': { id: 'drbwo9y6f6i7bb66xdiwn21w', unit: 'kg', shelfDays: 60, category: 'dairy' },
  'mozzarella': { id: 'skk9p2c8th7fmv1vs15grt4u', unit: 'kg', shelfDays: 14, category: 'dairy' },
  'feta': { id: 'jze7wrcu2yatixk1u0yhb0dr', unit: 'kg', shelfDays: 30, category: 'dairy' },
  'sour-cream': { id: 'z3rr6evv4qvyx6kv8u6tfzps', unit: 'kg', shelfDays: 14, category: 'dairy' },
  'eggs': { id: 'if3vj8q3ihejonec7logxvn3', unit: 'pcs', shelfDays: 30, category: 'dairy' },
  'pasta': { id: 'zlqpqjpjavk7r43jgrg3osyg', unit: 'kg', shelfDays: 365, category: 'dry-goods' },
  'rice': { id: 'qbrn5jw8kk05q9dlyu3d047h', unit: 'kg', shelfDays: 365, category: 'dry-goods' },
  'flour': { id: 'sbbuvccussu0k1rbhif95si2', unit: 'kg', shelfDays: 180, category: 'dry-goods' },
  'sugar': { id: 'x0bueg7tl6tzpnufwvg2sgph', unit: 'kg', shelfDays: 730, category: 'dry-goods' },
  'olive-oil': { id: 'grvipk5rlx9gupr7kbdfwciv', unit: 'l', shelfDays: 365, category: 'oils-fats' },
  'sunflower-oil': { id: 'aqjd5ec47cgmg2tdzjfem1ba', unit: 'l', shelfDays: 365, category: 'oils-fats' },
  'salt': { id: 'a99ccwplg8qwkmneqmfie1pb', unit: 'kg', shelfDays: 1825, category: 'seasonings' },
  'black-pepper': { id: 'ss6o7mxptez1pb1i201azl0q', unit: 'kg', shelfDays: 730, category: 'seasonings' },
  'basil': { id: 'h0srmc6sk67id6453e23p93y', unit: 'kg', shelfDays: 5, category: 'raw' },
  'rosemary': { id: 'jbzw77aqa1xjvbmx6p5bnwbk', unit: 'kg', shelfDays: 7, category: 'raw' },
  'coffee': { id: 'gnskcpnk40mdjyvg9wpstiii', unit: 'kg', shelfDays: 180, category: 'beverages' },
  'orange-juice': { id: 'oxcmgr37dy6cae3fxqel609a', unit: 'l', shelfDays: 7, category: 'beverages' },
  'mineral-water': { id: 'ak64jv1zrge05ls9zcnxa541', unit: 'l', shelfDays: 365, category: 'beverages' },
};

// Supplier IDs
const SUPPLIER_IDS = {
  'metro': 'wgt1kvujdem8w8l5h0mdbdqw',
  'silpo': 'nyc9q34zkz890zidzx6i9hj8',
};

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
  'cream': { quantity: 15, unitCost: 85, supplier: 'metro' },
  'parmesan': { quantity: 5, unitCost: 650, supplier: 'metro' },
  'mozzarella': { quantity: 5, unitCost: 280, supplier: 'metro' },
  'feta': { quantity: 5, unitCost: 220, supplier: 'metro' },
  'sour-cream': { quantity: 10, unitCost: 65, supplier: 'metro' },
  'eggs': { quantity: 300, unitCost: 4.5, supplier: 'silpo' },

  // Dry goods
  'pasta': { quantity: 20, unitCost: 45, supplier: 'metro' },
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
  'basil': { quantity: 1, unitCost: 350, supplier: 'silpo' },
  'rosemary': { quantity: 0.5, unitCost: 420, supplier: 'silpo' },

  // Beverages
  'coffee': { quantity: 5, unitCost: 480, supplier: 'metro' },
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

  let batchIndex = 1;

  for (const [ingredientKey, config] of Object.entries(STOCK_CONFIG)) {
    const ingredientData = INGREDIENT_IDS[ingredientKey];
    if (!ingredientData) {
      console.log(`  ⚠️  Unknown ingredient: ${ingredientKey}`);
      continue;
    }

    try {
      // Check if stock batch exists for this ingredient
      const existing = await strapi.db.query('api::stock-batch.stock-batch').findOne({
        where: {
          ingredient: { documentId: ingredientData.id },
          status: 'available',
        }
      });

      if (existing) {
        console.log(`  ⏭️  Stock batch for ${ingredientKey} exists`);
        continue;
      }

      const supplierId = SUPPLIER_IDS[config.supplier as keyof typeof SUPPLIER_IDS];
      const batchNumber = generateBatchNumber(ingredientKey, batchIndex);
      const receivedAt = getReceivedDate(Math.floor(Math.random() * 3) + 1); // 1-3 days ago
      const expiryDate = getExpiryDate(ingredientData.shelfDays);
      const totalCost = config.quantity * config.unitCost;

      await strapi.documents('api::stock-batch.stock-batch').create({
        data: {
          batchNumber,
          ingredient: ingredientData.id,
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
          supplier: supplierId,
          invoiceNumber: `INV-${new Date().getFullYear()}-${String(batchIndex).padStart(4, '0')}`,
          processes: [],
        }
      });

      // Update ingredient's currentStock
      await strapi.documents('api::ingredient.ingredient').update({
        documentId: ingredientData.id,
        data: {
          currentStock: config.quantity,
          costPerUnit: config.unitCost,
        }
      });

      console.log(`  ✅ ${ingredientKey}: ${config.quantity} ${ingredientData.unit} @ ${config.unitCost} UAH`);
      batchIndex++;
    } catch (error: any) {
      console.error(`  ❌ Failed: ${ingredientKey}`, error.message);
    }
  }

  console.log('\n✨ Stock batches seed completed!');
}

export default seedStockBatches;
