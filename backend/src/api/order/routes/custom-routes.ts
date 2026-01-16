export default {
  routes: [
    {
      method: 'POST',
      path: '/orders/:documentId/items',
      handler: 'order.addItems',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
