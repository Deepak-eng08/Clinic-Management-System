import Notification from '../models/Notification.js';
import { emitRealTimeNotification } from '../config/socket.js';

/**
 * Creates and dispatches a notification to a specific user
 * @param {string} recipientId - User ID of the recipient
 * @param {string} title - Title of the notification
 * @param {string} message - Message body
 * @param {string} type - Notification category ('appointment', 'payment', 'prescription', 'system')
 */
export const createNotification = async (recipientId, title, message, type) => {
  try {
    const notification = await Notification.create({
      recipientId,
      title,
      message,
      type,
    });

    // Send real-time notification
    emitRealTimeNotification(recipientId, notification);
    
    return notification;
  } catch (error) {
    console.error('Failed to create or send notification:', error.message);
  }
};
