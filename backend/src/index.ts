import type { Core } from '@strapi/strapi';
import { seedUsersAndTasks, testUsers, sampleTasks } from './seed/seed-users-and-tasks';
import { seedTasksOnly } from './seed/seed-tasks-only';
import { seedRestaurantData } from './seed/seed-restaurant-data';
import { setupPublicPermissions } from './seed/setup-permissions';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    // Extend GraphQL plugin to allow public access to reservations and scheduled orders
    const extensionService = strapi.plugin('graphql')?.service('extension');

    if (extensionService) {
      extensionService.use({
        resolversConfig: {
          // Reservation queries - public access
          'Query.reservations': {
            auth: false,
          },
          'Query.reservation': {
            auth: false,
          },
          'Mutation.createReservation': {
            auth: false,
          },
          'Mutation.updateReservation': {
            auth: false,
          },
          'Mutation.deleteReservation': {
            auth: false,
          },
          // Scheduled Order queries - public access
          'Query.scheduledOrders': {
            auth: false,
          },
          'Query.scheduledOrder': {
            auth: false,
          },
          'Mutation.createScheduledOrder': {
            auth: false,
          },
          'Mutation.updateScheduledOrder': {
            auth: false,
          },
          'Mutation.deleteScheduledOrder': {
            auth: false,
          },
        },
      });
    }
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Check if we should run seed (only in development and if no users exist)
    if (process.env.NODE_ENV === 'development' || process.env.RUN_SEED === 'true') {
      try {
        // Force reseed if FORCE_SEED is set (will delete and recreate test users)
        if (process.env.FORCE_SEED === 'true') {
          console.log('\n🗑️  Force seed enabled, removing old test users...\n');
          for (const userData of testUsers) {
            const existing = await strapi.db.query('plugin::users-permissions.user').findOne({
              where: { email: userData.email }
            });
            if (existing) {
              await strapi.db.query('plugin::users-permissions.user').delete({
                where: { id: existing.id }
              });
              console.log(`  Deleted: ${userData.email}`);
            }
          }
          // Also delete test tasks
          const testTasks = await strapi.db.query('api::daily-task.daily-task').findMany({});
          for (const task of testTasks) {
            await strapi.db.query('api::daily-task.daily-task').delete({
              where: { id: task.id }
            });
          }
          console.log(`  Deleted ${testTasks.length} tasks\n`);
        }

        // Check if admin user already exists
        const existingAdmin = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { email: 'admin@restaurant.com' }
        });

        if (!existingAdmin) {
          console.log('\n🌱 No test users found, running seed...\n');
          await seedUsersAndTasks(strapi);
        } else {
          console.log('✅ Test users already exist, skipping user seed');
          console.log('   To recreate users, set FORCE_SEED=true');

          // Check if we should seed tasks only
          if (process.env.SEED_TASKS === 'true') {
            console.log('\n📋 SEED_TASKS=true detected, seeding tasks...');
            await seedTasksOnly(strapi);
          }
        }

        // Always check and seed restaurant data (categories, menu items, ingredients, tables)
        const existingCategories = await strapi.db.query('api::menu-category.menu-category').findMany({ limit: 1 });
        if (existingCategories.length === 0) {
          console.log('\n🍽️  No restaurant data found, running restaurant seed...\n');
          await seedRestaurantData(strapi);
        } else {
          console.log('✅ Restaurant data already exists');
        }

        // Setup public permissions for REST API access
        await setupPublicPermissions(strapi);
      } catch (error) {
        console.error('Seed error:', error);
      }
    }
  },
};
