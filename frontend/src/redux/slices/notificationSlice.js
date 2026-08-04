import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
  },
  reducers: {
    setNotifications: (state, action) => {
      state.items = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.read).length;
    },
    addNotification: (state, action) => {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
    markAsRead: (state, action) => {
      const notif = state.items.find((n) => n._id === action.payload);
      if (notif && !notif.read) notif.read = true;
      if (state.unreadCount > 0) state.unreadCount -= 1;
    },
    clearNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },
  },
});

export const { setNotifications, addNotification, markAsRead, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
