export default {
  async beforeCreate(event) {
    const { data } = event.params;

    // Set default status if not provided
    if (!data.status) {
      data.status = 'pending';
    }

    // Set default priority if not provided
    if (!data.priority) {
      data.priority = 'normal';
    }
  },

  async beforeUpdate(event) {
    const { data, where } = event.params;

    // If status is being changed to completed, set completedAt
    if (data.status === 'completed' && !data.completedAt) {
      data.completedAt = new Date().toISOString();
    }

    // If status is being changed to in_progress, set startedAt
    if (data.status === 'in_progress' && !data.startedAt) {
      data.startedAt = new Date().toISOString();
    }
  },

  async afterCreate(event) {
    const { result } = event;

    // Log task creation (could be extended for notifications)
    strapi.log.info(`Daily task created: ${result.title} (${result.documentId})`);
  },

  async afterUpdate(event) {
    const { result } = event;

    // Log status changes
    if (result.status) {
      strapi.log.info(`Daily task ${result.documentId} status changed to: ${result.status}`);
    }
  }
};
