// src/hooks/useNotifications.js
import { useState, useEffect } from 'react';
import useLocalStorage from './useLocalStorage';

function useNotifications() {
  const [notifications, setNotifications] = useLocalStorage('schoolPortalNotifications', []);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.isRead).length);
  }, [notifications]);

  const addNotification = (newNotification) => {
    const notificationWithDefaults = {
      ...newNotification,
      id: Date.now(),
      isRead: false,
      timestamp: new Date().toISOString(),
    };
    setNotifications(prev => [notificationWithDefaults, ...prev]);
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}

export default useNotifications;