export default {
  routes: [
    {
      method: 'POST',
      path: '/kitchen-tickets/:documentId/start',
      handler: 'kitchen-ticket.start',
      config: {
        auth: false, // TODO: Re-enable auth when login is implemented
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'POST',
      path: '/kitchen-tickets/:documentId/complete',
      handler: 'kitchen-ticket.complete',
      config: {
        auth: false,
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'POST',
      path: '/kitchen-tickets/:documentId/pause',
      handler: 'kitchen-ticket.pause',
      config: {
        auth: false,
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'POST',
      path: '/kitchen-tickets/:documentId/resume',
      handler: 'kitchen-ticket.resume',
      config: {
        auth: false,
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'POST',
      path: '/kitchen-tickets/:documentId/cancel',
      handler: 'kitchen-ticket.cancel',
      config: {
        auth: false,
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'POST',
      path: '/kitchen-tickets/:documentId/fail',
      handler: 'kitchen-ticket.fail',
      config: {
        auth: false,
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'POST',
      path: '/kitchen-tickets/:documentId/serve',
      handler: 'kitchen-ticket.serve',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/kitchen-tickets/:documentId/recall',
      handler: 'kitchen-ticket.recall',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
