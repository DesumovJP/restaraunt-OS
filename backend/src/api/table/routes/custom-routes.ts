export default {
  routes: [
    {
      method: 'POST',
      path: '/tables/:documentId/close',
      handler: 'table.close',
      config: {
        auth: false, // Allow public access (permissions handled in setup-permissions.ts)
        policies: [],
        middlewares: []
      }
    }
  ]
};
