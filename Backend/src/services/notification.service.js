const pool = require('../config/db');

/**
 * Create a new notification for a user
 */
async function createNotification({ client = null, userId, firId = null, message }) {
  const db = client || pool;
  const query = `
    INSERT INTO notifications (user_id, fir_id, message)
    VALUES ($1, $2, $3)
    RETURNING notification_id, user_id, fir_id, message, is_read, created_at;
  `;
  const result = await db.query(query, [userId, firId, message]);
  return result.rows[0];
}

/**
 * Fetch paginated notifications for the logged-in user
 */
async function getUserNotifications(userId, { unreadOnly = false, limit = 20, offset = 0 } = {}) {
  const conditions = ['user_id = $1'];
  const params = [userId];
  let paramIdx = 2;

  if (unreadOnly) {
    conditions.push('is_read = FALSE');
  }

  const query = `
    SELECT notification_id, fir_id, message, is_read, created_at
    FROM notifications
    WHERE ${conditions.join(' AND ')}
    ORDER BY created_at DESC
    LIMIT $${paramIdx++} OFFSET $${paramIdx++};
  `;
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Fast badge count of unread notifications using partial index
 */
async function getUnreadCount(userId) {
  const query = `
    SELECT COUNT(*)::INT AS unread_count
    FROM notifications
    WHERE user_id = $1 AND is_read = FALSE;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0]?.unread_count || 0;
}

/**
 * Mark a single notification as read (with user isolation)
 */
async function markAsRead(notificationId, userId) {
  const query = `
    UPDATE notifications
    SET is_read = TRUE
    WHERE notification_id = $1 AND user_id = $2
    RETURNING notification_id, user_id, is_read, created_at;
  `;
  const result = await pool.query(query, [notificationId, userId]);
  if (result.rows.length === 0) {
    const error = new Error('Notification not found or access denied');
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
}

/**
 * Mark all notifications for the user as read
 */
async function markAllAsRead(userId) {
  const query = `
    UPDATE notifications
    SET is_read = TRUE
    WHERE user_id = $1 AND is_read = FALSE
    RETURNING notification_id;
  `;
  const result = await pool.query(query, [userId]);
  return { updatedCount: result.rows.length };
}

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
