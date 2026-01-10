const Notification = require('../models/Notification');

exports.getMyNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifs = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(notifs);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    res.status(200).json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.markAllRead = async (req, res) => {
  try {
    const { userId } = req.params;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.status(200).json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
};