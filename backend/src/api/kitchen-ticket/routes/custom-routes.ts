export default {
  routes: [
    {
      method: 'POST',
      path: '/kitchen-tickets/:documentId/start',
      handler: 'kitchen-ticket.start',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'POST',
      path: '/kitchen-tickets/:documentId/complete',
      handler: 'kitchen-ticket.complete',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'POST',
      path: '/kitchen-tickets/:documentId/pause',
      handler: 'kitchen-ticket.pause',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'POST',
      path: '/kitchen-tickets/:documentId/resume',
      handler: 'kitchen-ticket.resume',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'POST',
      path: '/kitchen-tickets/:documentId/cancel',
      handler: 'kitchen-ticket.cancel',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'POST',
      path: '/kitchen-tickets/:documentId/fail',
      handler: 'kitchen-ticket.fail',
      config: {
        policies: [],
        middlewares: []
      }
    }
  ]
};
