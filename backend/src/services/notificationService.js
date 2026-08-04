const Notification = require('../models/Notification');

let ioRef = null;

const setSocketServer = (io) => {
  ioRef = io;
};

const emitToUser = (userId, eventName, payload) => {
  if (!ioRef || !userId) return;
  ioRef.to(`user_${userId}`).emit(eventName, payload);
};

const emitToRoom = (roomName, eventName, payload) => {
  if (!ioRef || !roomName) return;
  ioRef.to(roomName).emit(eventName, payload);
};

const createNotification = async (data, options = {}) => {
  const notification = await Notification.create(data);
  const eventName = options.eventName || 'notification:new';

  if (options.targetUser) {
    emitToUser(options.targetUser, eventName, { notification });
  }

  if (options.room) {
    emitToRoom(options.room, eventName, { notification });
  }

  if (options.broadcast && ioRef) {
    ioRef.emit(eventName, { notification });
  }

  return notification;
};

module.exports = {
  setSocketServer,
  emitToUser,
  emitToRoom,
  createNotification,
};