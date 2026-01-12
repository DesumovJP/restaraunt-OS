import { factories } from '@strapi/strapi';
import { logAction } from '../../../utils/action-logger';

export default factories.createCoreController('api::worker-shift.worker-shift', ({ strapi }) => ({

  // Clock in - start shift
  async clockIn(ctx) {
    const { documentId } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const shift = await strapi.documents('api::worker-shift.worker-shift').findOne({
      documentId,
      populate: ['worker']
    });

    if (!shift) {
      return ctx.notFound('Shift not found');
    }

    // Verify this is the worker's shift
    if ((shift as any).worker?.documentId !== user.documentId) {
      return ctx.forbidden('You can only clock in to your own shifts');
    }

    if (shift.status !== 'scheduled') {
      return ctx.badRequest(`Cannot clock in to shift with status: ${shift.status}`);
    }

    const now = new Date();
    const actualStartTime = now.toTimeString().slice(0, 5); // HH:MM

    const updatedShift = await strapi.documents('api::worker-shift.worker-shift').update({
      documentId,
      data: {
        status: 'started',
        actualStartTime,
      }
    });

    await logAction(strapi, {
      action: 'start',
      entityType: 'worker_performance',
      entityId: documentId,
      entityName: `Shift ${shift.date}`,
      description: `Worker clocked in for shift`,
      descriptionUk: `Працівник розпочав зміну`,
      dataAfter: { status: 'started', actualStartTime },
      metadata: {
        shiftDate: shift.date,
        scheduledStart: shift.startTime,
        actualStart: actualStartTime,
        workerId: user.documentId,
        workerName: user.username,
      },
      module: 'admin',
      severity: 'info',
      performedBy: user.documentId,
      performedByName: user.username,
    });

    return ctx.send({ success: true, shift: updatedShift });
  },

  // Clock out - end shift
  async clockOut(ctx) {
    const { documentId } = ctx.params;
    const { breakMinutes } = ctx.request.body || {};
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const shift = await strapi.documents('api::worker-shift.worker-shift').findOne({
      documentId,
      populate: ['worker']
    });

    if (!shift) {
      return ctx.notFound('Shift not found');
    }

    // Verify this is the worker's shift
    if ((shift as any).worker?.documentId !== user.documentId) {
      return ctx.forbidden('You can only clock out of your own shifts');
    }

    if (shift.status !== 'started') {
      return ctx.badRequest(`Cannot clock out of shift with status: ${shift.status}`);
    }

    const now = new Date();
    const actualEndTime = now.toTimeString().slice(0, 5);

    // Calculate actual minutes worked
    const startParts = String(shift.actualStartTime!).split(':');
    const endParts = actualEndTime.split(':');
    const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
    const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
    let actualMinutes = endMinutes - startMinutes - (breakMinutes || shift.breakMinutes || 0);

    // Handle overnight shifts
    if (actualMinutes < 0) {
      actualMinutes += 24 * 60;
    }

    // Calculate overtime
    const scheduledMinutes = shift.scheduledMinutes || 0;
    const overtimeMinutes = Math.max(0, actualMinutes - scheduledMinutes);

    // Calculate pay if hourly rate is set
    let totalPay = 0;
    if (shift.hourlyRate) {
      const regularHours = Math.min(actualMinutes, scheduledMinutes) / 60;
      const overtimeHours = overtimeMinutes / 60;
      totalPay = (regularHours * Number(shift.hourlyRate)) + (overtimeHours * Number(shift.hourlyRate) * 1.5);
    }

    const updatedShift = await strapi.documents('api::worker-shift.worker-shift').update({
      documentId,
      data: {
        status: 'completed',
        actualEndTime,
        actualMinutes,
        overtimeMinutes,
        breakMinutes: breakMinutes || shift.breakMinutes,
        totalPay: totalPay > 0 ? totalPay : undefined,
      }
    });

    await logAction(strapi, {
      action: 'complete',
      entityType: 'worker_performance',
      entityId: documentId,
      entityName: `Shift ${shift.date}`,
      description: `Worker clocked out, worked ${Math.floor(actualMinutes / 60)}h ${actualMinutes % 60}m`,
      descriptionUk: `Працівник завершив зміну, відпрацював ${Math.floor(actualMinutes / 60)}г ${actualMinutes % 60}хв`,
      dataAfter: {
        status: 'completed',
        actualEndTime,
        actualMinutes,
        overtimeMinutes,
      },
      metadata: {
        shiftDate: shift.date,
        actualStart: shift.actualStartTime,
        actualEnd: actualEndTime,
        scheduledMinutes,
        actualMinutes,
        overtimeMinutes,
        breakMinutes: breakMinutes || shift.breakMinutes,
        totalPay,
        workerId: user.documentId,
        workerName: user.username,
      },
      module: 'admin',
      severity: 'info',
      performedBy: user.documentId,
      performedByName: user.username,
    });

    return ctx.send({ success: true, shift: updatedShift, actualMinutes, overtimeMinutes });
  },

  // Get worker's shifts for a date range
  async myShifts(ctx) {
    const user = ctx.state.user;
    const { fromDate, toDate } = ctx.query;

    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const fromDateStr = (fromDate || new Date().toISOString().split('T')[0]) as string;
    const toDateStr = (toDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) as string;

    const shifts = await strapi.documents('api::worker-shift.worker-shift').findMany({
      filters: {
        worker: { documentId: user.documentId },
        date: {
          $gte: fromDateStr,
          $lte: toDateStr,
        }
      },
      sort: [{ date: 'asc' }, { startTime: 'asc' }],
      populate: ['createdBy']
    });

    return ctx.send({ shifts });
  },

  // Get worker statistics
  async workerStats(ctx) {
    const { workerId } = ctx.params;
    const { fromDate, toDate } = ctx.query;

    const from = (fromDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]) as string;
    const to = (toDate || new Date().toISOString().split('T')[0]) as string;

    const shifts = await strapi.documents('api::worker-shift.worker-shift').findMany({
      filters: {
        worker: { documentId: workerId },
        date: { $gte: from, $lte: to },
        status: { $in: ['completed', 'started'] }
      }
    });

    // Calculate statistics
    let totalScheduledMinutes = 0;
    let totalActualMinutes = 0;
    let totalOvertimeMinutes = 0;
    let totalPay = 0;
    let completedShifts = 0;
    let missedShifts = 0;
    let lateArrivals = 0;

    for (const shift of shifts) {
      totalScheduledMinutes += shift.scheduledMinutes || 0;
      totalActualMinutes += shift.actualMinutes || 0;
      totalOvertimeMinutes += shift.overtimeMinutes || 0;
      totalPay += Number(shift.totalPay) || 0;

      if (shift.status === 'completed') {
        completedShifts++;
      }
      if (shift.status === 'missed') {
        missedShifts++;
      }

      // Check if late (more than 5 minutes)
      if (shift.actualStartTime && shift.startTime) {
        const scheduled = String(shift.startTime).split(':');
        const actual = String(shift.actualStartTime).split(':');
        const scheduledMins = parseInt(scheduled[0]) * 60 + parseInt(scheduled[1]);
        const actualMins = parseInt(actual[0]) * 60 + parseInt(actual[1]);
        if (actualMins - scheduledMins > 5) {
          lateArrivals++;
        }
      }
    }

    // Get missed shifts count
    const allShifts = await strapi.documents('api::worker-shift.worker-shift').findMany({
      filters: {
        worker: { documentId: workerId },
        date: { $gte: from as string, $lte: to as string },
      }
    });
    missedShifts = allShifts.filter(s => s.status === 'missed').length;

    const attendanceRate = allShifts.length > 0
      ? ((completedShifts / (completedShifts + missedShifts)) * 100).toFixed(1)
      : 100;

    const punctualityRate = completedShifts > 0
      ? (((completedShifts - lateArrivals) / completedShifts) * 100).toFixed(1)
      : 100;

    return ctx.send({
      period: { from, to },
      totalShifts: allShifts.length,
      completedShifts,
      missedShifts,
      lateArrivals,
      totalScheduledHours: (totalScheduledMinutes / 60).toFixed(1),
      totalActualHours: (totalActualMinutes / 60).toFixed(1),
      totalOvertimeHours: (totalOvertimeMinutes / 60).toFixed(1),
      totalPay: totalPay.toFixed(2),
      attendanceRate: `${attendanceRate}%`,
      punctualityRate: `${punctualityRate}%`,
    });
  },

  // Bulk create shifts (for manager to schedule)
  async bulkCreate(ctx) {
    const { shifts } = ctx.request.body;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    if (!Array.isArray(shifts) || shifts.length === 0) {
      return ctx.badRequest('Shifts array is required');
    }

    const createdShifts = [];

    for (const shiftData of shifts) {
      // Calculate scheduled minutes
      const startParts = shiftData.startTime.split(':');
      const endParts = shiftData.endTime.split(':');
      const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
      let scheduledMinutes = endMinutes - startMinutes - (shiftData.breakMinutes || 0);
      if (scheduledMinutes < 0) scheduledMinutes += 24 * 60;

      const shift = await strapi.documents('api::worker-shift.worker-shift').create({
        data: {
          ...shiftData,
          scheduledMinutes,
          createdBy: user.documentId,
        }
      });
      createdShifts.push(shift);
    }

    await logAction(strapi, {
      action: 'create',
      entityType: 'worker_performance',
      entityId: 'bulk',
      entityName: `${createdShifts.length} shifts`,
      description: `Created ${createdShifts.length} worker shifts`,
      descriptionUk: `Створено ${createdShifts.length} змін працівників`,
      metadata: {
        shiftsCount: createdShifts.length,
        dates: [...new Set(shifts.map(s => s.date))],
      },
      module: 'admin',
      severity: 'info',
      performedBy: user.documentId,
      performedByName: user.username,
    });

    return ctx.send({ success: true, shifts: createdShifts });
  },

  // Get team schedule for a date range
  async teamSchedule(ctx) {
    const { fromDate, toDate, department } = ctx.query;

    const filters: any = {
      date: {
        $gte: fromDate || new Date().toISOString().split('T')[0],
        $lte: toDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }
    };

    if (department && department !== 'all') {
      filters.department = department;
    }

    const shifts = await strapi.documents('api::worker-shift.worker-shift').findMany({
      filters,
      sort: [{ date: 'asc' }, { startTime: 'asc' }],
      populate: ['worker', 'createdBy']
    });

    // Group by date
    const schedule: Record<string, any[]> = {};
    for (const shift of shifts) {
      const dateKey = String(shift.date);
      if (!schedule[dateKey]) {
        schedule[dateKey] = [];
      }
      schedule[dateKey].push(shift);
    }

    return ctx.send({ schedule, totalShifts: shifts.length });
  }
}));
