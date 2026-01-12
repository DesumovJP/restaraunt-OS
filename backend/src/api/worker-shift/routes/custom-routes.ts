export default {
  routes: [
    {
      method: 'POST',
      path: '/worker-shifts/:documentId/clock-in',
      handler: 'worker-shift.clockIn',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/worker-shifts/:documentId/clock-out',
      handler: 'worker-shift.clockOut',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/worker-shifts/my-shifts',
      handler: 'worker-shift.myShifts',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/worker-shifts/stats/:workerId',
      handler: 'worker-shift.workerStats',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/worker-shifts/bulk',
      handler: 'worker-shift.bulkCreate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/worker-shifts/team-schedule',
      handler: 'worker-shift.teamSchedule',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
