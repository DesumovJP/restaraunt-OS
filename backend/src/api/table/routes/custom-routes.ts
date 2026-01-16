export default {
  routes: [
    {
      method: 'POST',
      path: '/tables/:documentId/close',
      handler: 'table.close',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/tables/:documentId/emergency-close',
      handler: 'table.emergencyClose',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/tables/:documentId/merge',
      handler: 'table.merge',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/tables/:documentId/merge',
      handler: 'table.unmerge',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/tables/:documentId/transfer',
      handler: 'table.transfer',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
