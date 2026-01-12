/**
 * Setup public permissions for REST API access
 * This allows the frontend to fetch data without authentication
 */

// Content types that should be publicly readable
const PUBLIC_READABLE = [
  'api::menu-category.menu-category',
  'api::menu-item.menu-item',
  'api::ingredient.ingredient',
  'api::table.table',
  'api::order.order',
  'api::order-item.order-item',
  'api::kitchen-ticket.kitchen-ticket',
  'api::stock-batch.stock-batch',
  'api::supplier.supplier',
  'api::recipe.recipe',
  'api::yield-profile.yield-profile',
  'api::reservation.reservation',
  'api::scheduled-order.scheduled-order',
  'api::daily-task.daily-task',
  'api::worker-shift.worker-shift',
  'api::worker-performance.worker-performance',
];

// Plugin content types that should be publicly readable
const PUBLIC_PLUGIN_READABLE = [
  'plugin::users-permissions.user',
];

// Content types that should be publicly writable (create/update)
const PUBLIC_WRITABLE = [
  'api::order.order',
  'api::order-item.order-item',
  'api::kitchen-ticket.kitchen-ticket',
  'api::table.table',
  'api::stock-batch.stock-batch',
  'api::reservation.reservation',
  'api::scheduled-order.scheduled-order',
  'api::daily-task.daily-task',
  'api::worker-shift.worker-shift',
];

// Custom actions that should be publicly accessible
const PUBLIC_CUSTOM_ACTIONS = [
  // Table actions
  'api::table.table.close',
  // Kitchen ticket actions
  'api::kitchen-ticket.kitchen-ticket.start',
  'api::kitchen-ticket.kitchen-ticket.complete',
  'api::kitchen-ticket.kitchen-ticket.pause',
  'api::kitchen-ticket.kitchen-ticket.resume',
  'api::kitchen-ticket.kitchen-ticket.cancel',
  'api::kitchen-ticket.kitchen-ticket.fail',
  'api::kitchen-ticket.kitchen-ticket.serve',
];

export async function setupPublicPermissions(strapi: any) {
  console.log('🔐 Setting up public permissions...');

  try {
    // Get the public role
    const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' },
    });

    if (!publicRole) {
      console.log('  ⚠️  Public role not found');
      return;
    }

    // Build permissions array
    const permissions: { action: string; role: number }[] = [];

    // Add read permissions (find, findOne) for API content types
    for (const contentType of PUBLIC_READABLE) {
      permissions.push(
        { action: `${contentType}.find`, role: publicRole.id },
        { action: `${contentType}.findOne`, role: publicRole.id },
      );
    }

    // Add read permissions for plugin content types
    for (const contentType of PUBLIC_PLUGIN_READABLE) {
      permissions.push(
        { action: `${contentType}.find`, role: publicRole.id },
        { action: `${contentType}.findOne`, role: publicRole.id },
      );
    }

    // Add write permissions (create, update, delete)
    for (const contentType of PUBLIC_WRITABLE) {
      permissions.push(
        { action: `${contentType}.create`, role: publicRole.id },
        { action: `${contentType}.update`, role: publicRole.id },
        { action: `${contentType}.delete`, role: publicRole.id },
      );
    }

    // Add custom action permissions
    for (const action of PUBLIC_CUSTOM_ACTIONS) {
      permissions.push({ action, role: publicRole.id });
    }

    // Check existing permissions and add missing ones
    let added = 0;
    for (const perm of permissions) {
      const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
        where: { action: perm.action, role: perm.role },
      });

      if (!existing) {
        await strapi.db.query('plugin::users-permissions.permission').create({
          data: perm,
        });
        added++;
      }
    }

    if (added > 0) {
      console.log(`  ✅ Added ${added} public permissions`);
    } else {
      console.log('  ✅ Public permissions already configured');
    }
  } catch (error: any) {
    console.error('  ❌ Failed to setup permissions:', error.message);
  }
}

export default setupPublicPermissions;
