/**
 * Seed script for large restaurant simulation
 * Adds more tables, suppliers, sample orders, and kitchen activity
 */

// Additional tables for large restaurant (15-30)
const ADDITIONAL_TABLES = [
  { number: 11, capacity: 4, zone: 'main' },
  { number: 12, capacity: 4, zone: 'main' },
  { number: 13, capacity: 6, zone: 'main' },
  { number: 14, capacity: 6, zone: 'main' },
  { number: 15, capacity: 8, zone: 'vip' },
  { number: 16, capacity: 10, zone: 'vip' },
  { number: 17, capacity: 2, zone: 'terrace' },
  { number: 18, capacity: 2, zone: 'terrace' },
  { number: 19, capacity: 4, zone: 'terrace' },
  { number: 20, capacity: 4, zone: 'terrace' },
  { number: 21, capacity: 4, zone: 'bar' },
  { number: 22, capacity: 4, zone: 'bar' },
  { number: 23, capacity: 6, zone: 'private' },
  { number: 24, capacity: 8, zone: 'private' },
  { number: 25, capacity: 12, zone: 'private' },
];

// Additional suppliers
const ADDITIONAL_SUPPLIERS = [
  { name: 'Фермерське господарство "Зоря"', contactName: 'Микола Шевченко', phone: '+380933456789', email: 'zorya@farm.ua', slug: 'fermerske-hospodarstvo-zorya' },
  { name: 'Риба Опт', contactName: 'Андрій Бондаренко', phone: '+380504567890', email: 'fish@opt.ua', slug: 'ryba-opt' },
  { name: 'Молочна справа', contactName: 'Марія Литвиненко', phone: '+380675678901', email: 'dairy@moloko.ua', slug: 'molochna-sprava' },
  { name: 'М\'ясний двір', contactName: 'Петро Коваль', phone: '+380991234567', email: 'meat@dvir.ua', slug: 'myasnyi-dvir' },
  { name: 'Овочі та фрукти "Свіжість"', contactName: 'Оксана Мельник', phone: '+380662345678', email: 'fresh@vegetables.ua', slug: 'ovochi-svizhist' },
];

// Sample order templates for simulation
const ORDER_TEMPLATES = [
  {
    items: ['caesar-salad', 'carbonara', 'tiramisu', 'cappuccino'],
    tableZone: 'main',
  },
  {
    items: ['borscht', 'chicken-kyiv', 'cheesecake'],
    tableZone: 'main',
  },
  {
    items: ['tom-yum', 'ribeye-steak', 'house-red-wine'],
    tableZone: 'vip',
  },
  {
    items: ['greek-salad', 'salmon-fillet', 'chocolate-fondant', 'espresso'],
    tableZone: 'terrace',
  },
  {
    items: ['bruschetta', 'carpaccio', 'pork-medallions', 'house-white-wine'],
    tableZone: 'vip',
  },
  {
    items: ['mushroom-cream-soup', 'bolognese', 'lemonade'],
    tableZone: 'bar',
  },
  {
    items: ['cheese-plate', 'duck-breast', 'tiramisu', 'cappuccino', 'cappuccino'],
    tableZone: 'private',
  },
  {
    items: ['warm-salad-with-beef', 'seafood-pasta', 'fresh-orange-juice'],
    tableZone: 'main',
  },
];

// Helper to generate order number
function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${dateStr}-${random}`;
}

// Load data from database
async function loadMenuItems(strapi: any): Promise<Map<string, any>> {
  const items = await strapi.db.query('api::menu-item.menu-item').findMany({
    select: ['documentId', 'slug', 'name', 'nameUk', 'price', 'outputType', 'primaryStation'],
  });

  const map = new Map();
  for (const item of items) {
    if (item.slug) {
      map.set(item.slug, item);
    }
  }
  return map;
}

async function loadTables(strapi: any): Promise<Map<number, any>> {
  const tables = await strapi.db.query('api::table.table').findMany({
    select: ['documentId', 'number', 'zone', 'status'],
  });

  const map = new Map<number, any>();
  for (const table of tables) {
    map.set(table.number, table);
  }
  return map;
}

async function loadWaiters(strapi: any): Promise<any[]> {
  const users = await strapi.db.query('plugin::users-permissions.user').findMany({
    where: {
      username: { $in: ['waiter1', 'waiter2'] }
    },
    select: ['documentId', 'username'],
  });
  return users;
}

async function loadChefs(strapi: any): Promise<any[]> {
  const users = await strapi.db.query('plugin::users-permissions.user').findMany({
    where: {
      username: { $in: ['chef', 'cook1', 'cook2'] }
    },
    select: ['documentId', 'username'],
  });
  return users;
}

export async function seedLargeRestaurant(strapi: any) {
  console.log('🏢 Seeding large restaurant data...');

  // 1. Add more tables
  console.log('\n🪑 Adding additional tables...');
  for (const table of ADDITIONAL_TABLES) {
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

  // 2. Add more suppliers
  console.log('\n📦 Adding additional suppliers...');
  for (const supplier of ADDITIONAL_SUPPLIERS) {
    try {
      const existing = await strapi.db.query('api::supplier.supplier').findOne({
        where: { slug: supplier.slug }
      });
      if (existing) {
        console.log(`  ⏭️  Supplier ${supplier.name} exists`);
        continue;
      }

      await strapi.documents('api::supplier.supplier').create({
        data: {
          name: supplier.name,
          contactName: supplier.contactName,
          phone: supplier.phone,
          email: supplier.email,
          slug: supplier.slug,
          isActive: true,
        }
      });
      console.log(`  ✅ ${supplier.name}`);
    } catch (error: any) {
      console.error(`  ❌ Failed: ${supplier.name}`, error.message);
    }
  }

  // 3. Create sample orders (active restaurant simulation)
  console.log('\n📝 Creating sample orders...');

  const menuItems = await loadMenuItems(strapi);
  const tables = await loadTables(strapi);
  const waiters = await loadWaiters(strapi);

  console.log(`  📋 Loaded ${menuItems.size} menu items, ${tables.size} tables, ${waiters.length} waiters`);

  if (menuItems.size === 0 || tables.size === 0) {
    console.log('  ⚠️  Missing menu items or tables. Skipping orders.');
    return;
  }

  // Check if orders already exist
  const existingOrders = await strapi.db.query('api::order.order').count();
  if (existingOrders > 0) {
    console.log(`  ⏭️  ${existingOrders} orders already exist, skipping order creation`);
  } else {
    // Create 5-8 sample orders
    const numOrders = Math.floor(Math.random() * 4) + 5;
    const usedTables = new Set<number>();

    for (let i = 0; i < numOrders; i++) {
      const template = ORDER_TEMPLATES[i % ORDER_TEMPLATES.length];

      // Find a free table in the zone
      let tableNumber: number | null = null;
      for (const [num, table] of tables) {
        if (table.zone === template.tableZone && !usedTables.has(num)) {
          tableNumber = num;
          usedTables.add(num);
          break;
        }
      }

      // Fallback to any free table
      if (!tableNumber) {
        for (const [num] of tables) {
          if (!usedTables.has(num)) {
            tableNumber = num;
            usedTables.add(num);
            break;
          }
        }
      }

      if (!tableNumber) continue;

      try {
        const table = tables.get(tableNumber);
        const waiter = waiters[i % waiters.length];
        const orderNumber = generateOrderNumber();

        // Calculate total
        let totalAmount = 0;
        const orderItems: any[] = [];

        for (const itemSlug of template.items) {
          const menuItem = menuItems.get(itemSlug);
          if (menuItem) {
            totalAmount += menuItem.price;
            orderItems.push({
              menuItem: menuItem.documentId,
              menuItemSlug: itemSlug,
              quantity: 1,
              price: menuItem.price,
            });
          }
        }

        // Create order
        // Valid statuses: new, confirmed, in_kitchen, ready, served, cancelled, paid
        const orderStatus = i < 2 ? 'in_kitchen' : (i < 4 ? 'confirmed' : 'new');
        const order = await strapi.documents('api::order.order').create({
          data: {
            orderNumber,
            table: table.documentId,
            waiter: waiter?.documentId,
            status: orderStatus,
            totalAmount,
            notes: '',
            guestCount: Math.floor(Math.random() * 4) + 1,
          }
        });

        // Create order items
        // Valid statuses: draft, queued, pending, in_progress, ready, served, returned, cancelled, voided
        for (let j = 0; j < orderItems.length; j++) {
          const itemData = orderItems[j];
          const itemStatus = i < 2 ? 'in_progress' : (i < 4 ? 'queued' : 'draft');
          await strapi.documents('api::order-item.order-item').create({
            data: {
              order: order.documentId,
              menuItem: itemData.menuItem,
              quantity: itemData.quantity,
              unitPrice: itemData.price,
              totalPrice: itemData.price * itemData.quantity,
              status: itemStatus,
              notes: '',
            }
          });
        }

        // Update table status
        await strapi.documents('api::table.table').update({
          documentId: table.documentId,
          data: {
            status: 'occupied',
          }
        });

        console.log(`  ✅ Order ${orderNumber} (Table ${tableNumber}, ${orderItems.length} items, ${totalAmount} UAH)`);
      } catch (error: any) {
        console.error(`  ❌ Failed to create order:`, error.message);
      }
    }
  }

  // 4. Create some kitchen tickets for in-progress orders
  console.log('\n🎫 Creating kitchen tickets...');

  const chefs = await loadChefs(strapi);
  const inProgressOrders = await strapi.db.query('api::order.order').findMany({
    where: { status: { $in: ['submitted', 'in_progress'] } },
    populate: ['table'],
    limit: 5,
  });

  const existingTickets = await strapi.db.query('api::kitchen-ticket.kitchen-ticket').count();
  if (existingTickets > 0) {
    console.log(`  ⏭️  ${existingTickets} tickets already exist, skipping`);
  } else {
    for (const order of inProgressOrders) {
      try {
        // Get order items
        const orderItems = await strapi.db.query('api::order-item.order-item').findMany({
          where: { order: { documentId: order.documentId } },
          populate: ['menuItem'],
        });

        for (const item of orderItems) {
          if (!item.menuItem) continue;

          const chef = chefs[Math.floor(Math.random() * chefs.length)];
          const ticketNumber = `TKT-${order.orderNumber.split('-').slice(1).join('-')}-${item.id}`;

          await strapi.documents('api::kitchen-ticket.kitchen-ticket').create({
            data: {
              ticketNumber,
              order: order.documentId,
              orderItem: item.documentId,
              station: item.menuItem.primaryStation || 'hot',
              status: Math.random() > 0.5 ? 'in_progress' : 'pending',
              priority: Math.floor(Math.random() * 3) + 1,
              assignedChef: chef?.documentId,
              tableNumber: order.table?.number,
              itemName: item.menuItem.nameUk || item.menuItem.name,
              quantity: item.quantity,
            }
          });
        }

        console.log(`  ✅ Tickets for order ${order.orderNumber}`);
      } catch (error: any) {
        console.error(`  ❌ Failed:`, error.message);
      }
    }
  }

  console.log('\n✨ Large restaurant seed completed!');
}

export default seedLargeRestaurant;
