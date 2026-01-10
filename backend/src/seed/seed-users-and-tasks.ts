/**
 * Seed script for creating test users and daily tasks
 *
 * Run with: npx ts-node src/seed/seed-users-and-tasks.ts
 * Or via strapi: npm run strapi console, then run the seed
 */

interface SeedUser {
  username: string;
  email: string;
  password: string;
  systemRole: string;
  department: string;
  station?: string;
  firstName: string;
  lastName: string;
}

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
  assigneeRole: string; // Will be matched to user by role
}

// Test users for each role
const testUsers: SeedUser[] = [
  {
    username: 'admin',
    email: 'admin@restaurant.com',
    password: 'Admin123!',
    systemRole: 'admin',
    department: 'management',
    firstName: 'Олександр',
    lastName: 'Коваленко',
  },
  {
    username: 'manager',
    email: 'manager@restaurant.com',
    password: 'Manager123!',
    systemRole: 'manager',
    department: 'management',
    firstName: 'Марія',
    lastName: 'Петренко',
  },
  {
    username: 'chef',
    email: 'chef@restaurant.com',
    password: 'Chef123!',
    systemRole: 'chef',
    department: 'kitchen',
    station: 'pass',
    firstName: 'Віктор',
    lastName: 'Шевченко',
  },
  {
    username: 'cook1',
    email: 'cook1@restaurant.com',
    password: 'Cook123!',
    systemRole: 'cook',
    department: 'kitchen',
    station: 'grill',
    firstName: 'Андрій',
    lastName: 'Бондаренко',
  },
  {
    username: 'cook2',
    email: 'cook2@restaurant.com',
    password: 'Cook123!',
    systemRole: 'cook',
    department: 'kitchen',
    station: 'salad',
    firstName: 'Олена',
    lastName: 'Савченко',
  },
  {
    username: 'waiter1',
    email: 'waiter1@restaurant.com',
    password: 'Waiter123!',
    systemRole: 'waiter',
    department: 'service',
    station: 'front',
    firstName: 'Ірина',
    lastName: 'Мельник',
  },
  {
    username: 'waiter2',
    email: 'waiter2@restaurant.com',
    password: 'Waiter123!',
    systemRole: 'waiter',
    department: 'service',
    station: 'front',
    firstName: 'Дмитро',
    lastName: 'Козак',
  },
  {
    username: 'bartender',
    email: 'bartender@restaurant.com',
    password: 'Bartender123!',
    systemRole: 'bartender',
    department: 'bar',
    station: 'bar',
    firstName: 'Максим',
    lastName: 'Романенко',
  },
  {
    username: 'host',
    email: 'host@restaurant.com',
    password: 'Host123!',
    systemRole: 'host',
    department: 'service',
    station: 'front',
    firstName: 'Наталія',
    lastName: 'Ткаченко',
  },
  {
    username: 'cashier',
    email: 'cashier@restaurant.com',
    password: 'Cashier123!',
    systemRole: 'cashier',
    department: 'service',
    station: 'front',
    firstName: 'Тетяна',
    lastName: 'Лисенко',
  },
];

// Sample daily tasks
const sampleTasks: SeedTask[] = [
  // Admin tasks
  {
    title: 'Перевірити фінансовий звіт за тиждень',
    description: 'Проаналізувати виручку, витрати та прибутковість',
    priority: 'high',
    category: 'admin',
    dueTime: '10:00',
    estimatedMinutes: 60,
    assigneeRole: 'admin',
  },

  // Manager tasks
  {
    title: 'Провести ранковий брифінг',
    description: 'Обговорити план на день, особливі події, резервації',
    priority: 'high',
    category: 'admin',
    dueTime: '09:00',
    estimatedMinutes: 15,
    isRecurring: true,
    recurringPattern: 'daily',
    assigneeRole: 'manager',
  },
  {
    title: 'Перевірити графік змін на наступний тиждень',
    priority: 'normal',
    category: 'admin',
    dueTime: '14:00',
    estimatedMinutes: 30,
    assigneeRole: 'manager',
  },

  // Chef tasks
  {
    title: 'Перевірити якість поставки',
    description: 'Оглянути свіжість продуктів від постачальника Metro',
    priority: 'urgent',
    category: 'inventory',
    dueTime: '08:00',
    estimatedMinutes: 30,
    station: 'prep',
    assigneeRole: 'chef',
  },
  {
    title: 'Оновити спеціальну пропозицію дня',
    priority: 'high',
    category: 'prep',
    dueTime: '10:00',
    estimatedMinutes: 20,
    assigneeRole: 'chef',
  },
  {
    title: 'Провести інвентаризацію морозильної камери',
    priority: 'normal',
    category: 'inventory',
    dueTime: '16:00',
    estimatedMinutes: 45,
    isRecurring: true,
    recurringPattern: 'weekly',
    assigneeRole: 'chef',
  },

  // Cook tasks (grill)
  {
    title: 'Підготувати mise en place для гриль-станції',
    description: 'Нарізати м\'ясо, підготувати маринади',
    priority: 'high',
    category: 'prep',
    dueTime: '10:00',
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
    dueTime: '22:00',
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
    dueTime: '08:30',
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
    dueTime: '10:30',
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
    dueTime: '11:00',
    estimatedMinutes: 15,
    station: 'front',
    assigneeRole: 'waiter',
  },
  {
    title: 'Вивчити нові позиції меню',
    description: 'Запам\'ятати інгредієнти та алергени нових страв',
    priority: 'normal',
    category: 'training',
    dueTime: '15:00',
    estimatedMinutes: 30,
    assigneeRole: 'waiter',
  },

  // Bartender tasks
  {
    title: 'Підготувати бар до відкриття',
    description: 'Перевірити запаси, нарізати фрукти для гарнірів',
    priority: 'high',
    category: 'prep',
    dueTime: '10:30',
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
    dueTime: '23:00',
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
    dueTime: '22:30',
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
    dueTime: '09:00',
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
    dueTime: '10:00',
    estimatedMinutes: 15,
    assigneeRole: 'host',
  },

  // Cashier tasks
  {
    title: 'Підготувати касу до відкриття',
    description: 'Перевірити залишок готівки, підготувати здачу',
    priority: 'high',
    category: 'admin',
    dueTime: '10:45',
    estimatedMinutes: 15,
    isRecurring: true,
    recurringPattern: 'daily',
    assigneeRole: 'cashier',
  },
  {
    title: 'Здати касовий звіт',
    priority: 'high',
    category: 'admin',
    dueTime: '23:30',
    estimatedMinutes: 20,
    isRecurring: true,
    recurringPattern: 'daily',
    assigneeRole: 'cashier',
  },
];

// Export for use in Strapi bootstrap or console
export { testUsers, sampleTasks };

export async function seedUsersAndTasks(strapi: any) {
  console.log('🌱 Starting seed...');

  const today = new Date().toISOString().split('T')[0];
  const createdUsers: Record<string, any> = {};

  // Create users
  console.log('👥 Creating test users...');

  // Get authenticated role first
  const authenticatedRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'authenticated' }
  });

  if (!authenticatedRole) {
    console.error('❌ Authenticated role not found!');
    return;
  }

  for (const userData of testUsers) {
    try {
      // Check if user exists
      const existing = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { email: userData.email }
      });

      if (existing) {
        console.log(`  ⏭️  User ${userData.username} already exists`);
        createdUsers[userData.systemRole] = existing;
        continue;
      }

      // Use the users-permissions service to properly hash password
      const userService = strapi.plugin('users-permissions').service('user');

      const user = await userService.add({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        provider: 'local',
        confirmed: true,
        blocked: false,
        role: authenticatedRole.id,
        // Custom fields
        systemRole: userData.systemRole,
        department: userData.department,
        station: userData.station,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: true,
      });

      console.log(`  ✅ Created user: ${userData.username} (${userData.systemRole})`);
      createdUsers[userData.systemRole] = user;

      // Store first user of each role (for users with same role like cook1, cook2)
      if (!createdUsers[userData.systemRole]) {
        createdUsers[userData.systemRole] = user;
      }
    } catch (error: any) {
      console.error(`  ❌ Failed to create user ${userData.username}:`, error.message);
    }
  }

  // Create tasks
  console.log('\n📋 Creating sample tasks...');
  for (const taskData of sampleTasks) {
    try {
      const assignee = createdUsers[taskData.assigneeRole];
      if (!assignee) {
        console.log(`  ⏭️  No user found for role ${taskData.assigneeRole}, skipping task`);
        continue;
      }

      // Get manager or admin as creator for non-self tasks
      const creator = createdUsers['manager'] || createdUsers['admin'] || assignee;

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

      console.log(`  ✅ Created task: "${taskData.title}" for ${taskData.assigneeRole}`);
    } catch (error: any) {
      console.error(`  ❌ Failed to create task "${taskData.title}":`, error.message);
    }
  }

  console.log('\n✨ Seed completed!');
  console.log('\n📝 Test credentials:');
  testUsers.forEach(u => {
    console.log(`   ${u.systemRole.padEnd(10)} - ${u.email} / ${u.password}`);
  });
}

// For direct execution
export default seedUsersAndTasks;
