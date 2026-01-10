/**
 * Seed script for creating test daily tasks only
 * This is meant to run after users already exist
 *
 * Run with: SEED_TASKS=true npm run develop
 */

interface SeedTask {
  title: string;
  description?: string;
  priority: string;
  category: string;
  dueTime?: string;
  station?: string;
  estimatedMinutes?: number;
  isRecurring?: boolean;
  recurringPattern?: string;
  assigneeRole: string;
}

// Sample daily tasks - note: dueTime must be in HH:mm:ss.SSS format for Strapi
const sampleTasks: SeedTask[] = [
  // Admin tasks
  {
    title: 'Перевірити фінансовий звіт за тиждень',
    description: 'Проаналізувати виручку, витрати та прибутковість',
    priority: 'high',
    category: 'admin',
    dueTime: '10:00:00.000',
    estimatedMinutes: 60,
    assigneeRole: 'admin',
  },

  // Manager tasks
  {
    title: 'Провести ранковий брифінг',
    description: 'Обговорити план на день, особливі події, резервації',
    priority: 'high',
    category: 'admin',
    dueTime: '09:00:00.000',
    estimatedMinutes: 15,
    isRecurring: true,
    recurringPattern: 'daily',
    assigneeRole: 'manager',
  },
  {
    title: 'Перевірити графік змін на наступний тиждень',
    priority: 'normal',
    category: 'admin',
    dueTime: '14:00:00.000',
    estimatedMinutes: 30,
    assigneeRole: 'manager',
  },

  // Chef tasks
  {
    title: 'Перевірити якість поставки',
    description: 'Оглянути свіжість продуктів від постачальника Metro',
    priority: 'urgent',
    category: 'inventory',
    dueTime: '08:00:00.000',
    estimatedMinutes: 30,
    station: 'prep',
    assigneeRole: 'chef',
  },
  {
    title: 'Оновити спеціальну пропозицію дня',
    priority: 'high',
    category: 'prep',
    dueTime: '10:00:00.000',
    estimatedMinutes: 20,
    assigneeRole: 'chef',
  },
  {
    title: 'Провести інвентаризацію морозильної камери',
    priority: 'normal',
    category: 'inventory',
    dueTime: '16:00:00.000',
    estimatedMinutes: 45,
    isRecurring: true,
    recurringPattern: 'weekly',
    assigneeRole: 'chef',
  },

  // Cook tasks (grill)
  {
    title: 'Підготувати mise en place для гриль-станції',
    description: "Нарізати м'ясо, підготувати маринади",
    priority: 'high',
    category: 'prep',
    dueTime: '10:00:00.000',
    estimatedMinutes: 45,
    station: 'grill',
    isRecurring: true,
    recurringPattern: 'daily',
    assigneeRole: 'cook',
  },
  {
    title: 'Почистити гриль після зміни',
    priority: 'normal',
    category: 'cleaning',
    dueTime: '22:00:00.000',
    estimatedMinutes: 30,
    station: 'grill',
    isRecurring: true,
    recurringPattern: 'daily',
    assigneeRole: 'cook',
  },
  {
    title: 'Перевірити температуру холодильників',
    priority: 'high',
    category: 'maintenance',
    dueTime: '08:30:00.000',
    estimatedMinutes: 10,
    isRecurring: true,
    recurringPattern: 'daily',
    assigneeRole: 'cook',
  },

  // Waiter tasks
  {
    title: 'Накрити столи до відкриття',
    description: 'Перевірити чистоту, розкласти прибори та серветки',
    priority: 'high',
    category: 'service',
    dueTime: '10:30:00.000',
    estimatedMinutes: 30,
    station: 'front',
    isRecurring: true,
    recurringPattern: 'daily',
    assigneeRole: 'waiter',
  },
  {
    title: 'Заповнити солі та перці на столах',
    priority: 'normal',
    category: 'service',
    dueTime: '11:00:00.000',
    estimatedMinutes: 15,
    station: 'front',
    assigneeRole: 'waiter',
  },
  {
    title: 'Вивчити нові позиції меню',
    description: "Запам'ятати інгредієнти та алергени нових страв",
    priority: 'normal',
    category: 'training',
    dueTime: '15:00:00.000',
    estimatedMinutes: 30,
    assigneeRole: 'waiter',
  },

  // Bartender tasks
  {
    title: 'Підготувати бар до відкриття',
    description: 'Перевірити запаси, нарізати фрукти для гарнірів',
    priority: 'high',
    category: 'prep',
    dueTime: '10:30:00.000',
    estimatedMinutes: 30,
    station: 'bar',
    isRecurring: true,
    recurringPattern: 'daily',
    assigneeRole: 'bartender',
  },
  {
    title: 'Інвентаризація алкоголю',
    priority: 'normal',
    category: 'inventory',
    dueTime: '23:00:00.000',
    estimatedMinutes: 20,
    station: 'bar',
    isRecurring: true,
    recurringPattern: 'daily',
    assigneeRole: 'bartender',
  },
  {
    title: 'Почистити кавомашину',
    priority: 'normal',
    category: 'cleaning',
    dueTime: '22:30:00.000',
    estimatedMinutes: 15,
    station: 'bar',
    isRecurring: true,
    recurringPattern: 'daily',
    assigneeRole: 'bartender',
  },

  // Host tasks
  {
    title: 'Підтвердити резервації на сьогодні',
    description: 'Зателефонувати гостям для підтвердження бронювання',
    priority: 'high',
    category: 'service',
    dueTime: '09:00:00.000',
    estimatedMinutes: 30,
    station: 'front',
    isRecurring: true,
    recurringPattern: 'daily',
    assigneeRole: 'host',
  },
  {
    title: 'Оновити план розсадки',
    priority: 'normal',
    category: 'admin',
    dueTime: '10:00:00.000',
    estimatedMinutes: 15,
    assigneeRole: 'host',
  },

  // Cashier tasks
  {
    title: 'Підготувати касу до відкриття',
    description: 'Перевірити залишок готівки, підготувати здачу',
    priority: 'high',
    category: 'admin',
    dueTime: '10:45:00.000',
    estimatedMinutes: 15,
    isRecurring: true,
    recurringPattern: 'daily',
    assigneeRole: 'cashier',
  },
  {
    title: 'Здати касовий звіт',
    priority: 'high',
    category: 'admin',
    dueTime: '23:30:00.000',
    estimatedMinutes: 20,
    isRecurring: true,
    recurringPattern: 'daily',
    assigneeRole: 'cashier',
  },
];

export { sampleTasks };

export async function seedTasksOnly(strapi: any) {
  console.log('\n📋 Seeding tasks for existing users...\n');

  const today = new Date().toISOString().split('T')[0];

  // Find users by systemRole
  const users = await strapi.db.query('plugin::users-permissions.user').findMany({});

  if (users.length === 0) {
    console.log('❌ No users found. Please run the full seed first.');
    return;
  }

  // Group users by role
  const usersByRole: Record<string, any> = {};
  for (const user of users) {
    if (!usersByRole[user.systemRole]) {
      usersByRole[user.systemRole] = user;
    }
  }

  console.log(`Found users for roles: ${Object.keys(usersByRole).join(', ')}`);

  // Get manager as default task creator
  const creator = usersByRole['manager'] || usersByRole['admin'] || users[0];

  let createdCount = 0;
  let skippedCount = 0;

  for (const taskData of sampleTasks) {
    try {
      const assignee = usersByRole[taskData.assigneeRole];
      if (!assignee) {
        console.log(`  ⏭️  No user found for role ${taskData.assigneeRole}, skipping task`);
        skippedCount++;
        continue;
      }

      // Check if similar task already exists
      const existing = await strapi.db.query('api::daily-task.daily-task').findMany({
        where: {
          title: taskData.title,
          dueDate: today
        }
      });

      if (existing.length > 0) {
        console.log(`  ⏭️  Task "${taskData.title}" already exists for today`);
        skippedCount++;
        continue;
      }

      await strapi.documents('api::daily-task.daily-task').create({
        data: {
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          category: taskData.category,
          dueDate: today,
          dueTime: taskData.dueTime,
          station: taskData.station,
          estimatedMinutes: taskData.estimatedMinutes,
          isRecurring: taskData.isRecurring || false,
          recurringPattern: taskData.recurringPattern,
          status: 'pending',
          assignee: assignee.documentId,
          createdByUser: creator.documentId,
        }
      });

      console.log(`  ✅ Created: "${taskData.title}" for ${taskData.assigneeRole}`);
      createdCount++;
    } catch (error: any) {
      console.error(`  ❌ Failed to create "${taskData.title}":`, error.message);
    }
  }

  console.log(`\n✨ Task seeding completed!`);
  console.log(`   Created: ${createdCount} tasks`);
  console.log(`   Skipped: ${skippedCount} tasks\n`);
}

export default seedTasksOnly;
