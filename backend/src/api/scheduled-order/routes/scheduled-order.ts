/**
 * Scheduled Order Router Configuration
 *
 * Configures REST and GraphQL routes for scheduled orders.
 * Auth is handled at controller level.
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::scheduled-order.scheduled-order', {
  config: {
    find: {
      auth: false,
      policies: [],
      middlewares: [],
    },
    findOne: {
      auth: false,
      policies: [],
      middlewares: [],
    },
    create: {
      auth: false,
      policies: [],
      middlewares: [],
    },
    update: {
      auth: false,
      policies: [],
      middlewares: [],
    },
    delete: {
      auth: false,
      policies: [],
      middlewares: [],
    },
  },
});
