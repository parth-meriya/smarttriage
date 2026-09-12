'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { NotificationDto } from '@/lib/api/types';
import { triageApi } from '@/lib/api/services';
import { useAuth } from './useAuth';

/**
 * Live notifications for the authenticated user.
 *
 * - Fetches the user's notifications + unread count from the backend
 *   (includes role-targeted and broadcast notifications).
 * - Refreshes when queue WebSocket events land (the same events that create
 *   notifications server-side) or when any component broadcasts
 *   `smarttriage:refresh-notifications`.
 */
export function useNotifications() {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [items, count] = await Promise.all([
        triageApi.getNotifications(),
        triageApi.getUnreadCount(),
      ]);
      setNotifications(Array.isArray(items) ? items : []);
      setUnreadCount(count?.unread_count ?? 0);
    } catch {
      // Silent: bell simply shows zero unread on API failure
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Initial load + reload when the session user changes
  useEffect(() => {
    if (isAuthenticated) fetchNotifications();
  }, [isAuthenticated, user?.id, fetchNotifications]);

  // Listen for global refresh triggers (WS events, mark-read from other views)
  useEffect(() => {
    if (!isAuthenticated) return;
    const handler = () => fetchNotifications();
    window.addEventListener('smarttriage:refresh-notifications', handler);
    return () => window.removeEventListener('smarttriage:refresh-notifications', handler);
  }, [isAuthenticated, fetchNotifications]);

  // Demo logins start with a placeholder token and swap in the real JWT in the
  // background; refetch once real credentials land.
  useEffect(() => {
    if (!isAuthenticated) return;
    const handler = () => fetchNotifications();
    window.addEventListener('smarttriage:auth-refreshed', handler);
    return () => window.removeEventListener('smarttriage:auth-refreshed', handler);
  }, [isAuthenticated, fetchNotifications]);

  const markRead = useCallback(async (id: number) => {
    try {
      await triageApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Ignore; next refresh will reconcile
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await triageApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  }, []);

  return { notifications, unreadCount, isLoading, refetch: fetchNotifications, markRead, markAllRead };
}
