"use client";

import { create } from "zustand";
import type { Notification } from "@/types";
import api from "@/lib/api";

interface NotificationState {
  unreadCount: number;
  notifications: Notification[];
  fetchUnreadCount: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  notifications: [],

  fetchUnreadCount: async () => {
    try {
      const response = await api.get<{ count: number }>(
        "/notifications/unread-count/"
      );
      set({ unreadCount: response.data.count });
    } catch {
      // Silently fail - notification count is non-critical
    }
  },

  fetchNotifications: async () => {
    try {
      const response = await api.get<{ results: Notification[] }>(
        "/notifications/"
      );
      set({ notifications: response.data.results });
    } catch {
      // Silently fail
    }
  },

  markAsRead: async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/`, { isRead: true });
      const { notifications, unreadCount } = get();
      set({
        notifications: notifications.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, unreadCount - 1),
      });
    } catch {
      // Silently fail
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post("/notifications/mark-all-read/");
      const { notifications } = get();
      set({
        notifications: notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: n.readAt || new Date().toISOString(),
        })),
        unreadCount: 0,
      });
    } catch {
      // Silently fail
    }
  },
}));
