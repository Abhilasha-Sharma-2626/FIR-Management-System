const notificationService = require('../services/notification.service');

async function getNotifications(req, res, next) {
  try {
    const { unreadOnly, limit, offset } = req.query;
    const notifications = await notificationService.getUserNotifications(req.user.userId, {
      unreadOnly: unreadOnly === 'true',
      limit,
      offset
    });
    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const count = await notificationService.getUnreadCount(req.user.userId);
    return res.status(200).json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    next(error);
  }
}

async function markRead(req, res, next) {
  try {
    const { id } = req.params;
    const notification = await notificationService.markAsRead(parseInt(id, 10), req.user.userId);
    return res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
}

async function markAllRead(req, res, next) {
  try {
    const result = await notificationService.markAllAsRead(req.user.userId);
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      ...result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead
};
