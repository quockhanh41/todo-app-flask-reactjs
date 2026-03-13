import { useAuthStore } from "@/stores/auth-store";
import { NotificationFeed } from "@/types/types";

import { apiClient } from "./client";

export const getNotificationsAPI = async () => {
  const token = useAuthStore.getState().token;

  const response = await apiClient.get<NotificationFeed>("/notifications", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const markNotificationAsReadAPI = async (data: {
  notificationId: number;
  token: string | null;
}) => {
  const { notificationId, token } = data;

  await apiClient.patch(`/notifications/${notificationId}/read`, null, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const markAllNotificationsAsReadAPI = async (token: string | null) => {
  await apiClient.patch("/notifications/read-all", null, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
