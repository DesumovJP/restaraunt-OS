export default {
  routes: [
    // Batch receiving
    {
      method: 'POST',
      path: '/stock-batches/receive',
      handler: 'stock-batch.receive',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },

    // FIFO consumption
    {
      method: 'POST',
      path: '/stock-batches/consume',
      handler: 'stock-batch.consume',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },

    // Batch processing (cleaning, boiling, etc.)
    {
      method: 'POST',
      path: '/stock-batches/:documentId/process',
      handler: 'stock-batch.process',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },

    // Batch write-off
    {
      method: 'POST',
      path: '/stock-batches/:documentId/write-off',
      handler: 'stock-batch.writeOff',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },

    // Batch locking
    {
      method: 'POST',
      path: '/stock-batches/:documentId/lock',
      handler: 'stock-batch.lock',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/stock-batches/:documentId/lock',
      handler: 'stock-batch.unlock',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },

    // Physical inventory count
    {
      method: 'POST',
      path: '/stock-batches/:documentId/count',
      handler: 'stock-batch.inventoryCount',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },

    // Alerts and notifications
    {
      method: 'GET',
      path: '/stock-batches/expiring',
      handler: 'stock-batch.expiringSoon',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/stock-batches/low-stock',
      handler: 'stock-batch.lowStock',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
