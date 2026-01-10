export default {
  routes: [
    // Start task
    {
      method: 'POST',
      path: '/daily-tasks/:documentId/start',
      handler: 'daily-task.start',
      config: {
        policies: [],
        middlewares: []
      }
    },
    // Complete task
    {
      method: 'POST',
      path: '/daily-tasks/:documentId/complete',
      handler: 'daily-task.complete',
      config: {
        policies: [],
        middlewares: []
      }
    },
    // Cancel task
    {
      method: 'POST',
      path: '/daily-tasks/:documentId/cancel',
      handler: 'daily-task.cancel',
      config: {
        policies: [],
        middlewares: []
      }
    },
    // Get my tasks for today
    {
      method: 'GET',
      path: '/daily-tasks/my/today',
      handler: 'daily-task.myToday',
      config: {
        policies: [],
        middlewares: []
      }
    },
    // Get team tasks (for managers)
    {
      method: 'GET',
      path: '/daily-tasks/team',
      handler: 'daily-task.teamTasks',
      config: {
        policies: [],
        middlewares: []
      }
    },
    // Get task statistics
    {
      method: 'GET',
      path: '/daily-tasks/stats',
      handler: 'daily-task.stats',
      config: {
        policies: [],
        middlewares: []
      }
    },
    // Generate recurring tasks
    {
      method: 'POST',
      path: '/daily-tasks/generate-recurring',
      handler: 'daily-task.generateRecurring',
      config: {
        policies: [],
        middlewares: []
      }
    }
  ]
};
