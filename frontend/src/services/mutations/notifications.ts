import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationFeed } from "@/types/types";

import {
  markAllNotificationsAsReadAPI,
  markNotificationAsReadAPI,
} from "../api/notifications";

export const useMarkNotificationAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsReadAPI,
    onMutate: async ({ notificationId }) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      const previousFeed = queryClient.getQueryData<NotificationFeed>([
        "notifications",
      ]);

      if (previousFeed) {
        const nextItems = previousFeed.items.map((item) =>
          item.id === notificationId ? { ...item, isRead: true } : item,
        );
        const unreadCount = nextItems.reduce(
          (acc, item) => acc + (item.isRead ? 0 : 1),
          0,
        );

        queryClient.setQueryData<NotificationFeed>(["notifications"], {
          ...previousFeed,
          items: nextItems,
          unreadCount,
        });
      }

      return { previousFeed };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(["notifications"], context.previousFeed);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useMarkAllNotificationsAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsReadAPI,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      const previousFeed = queryClient.getQueryData<NotificationFeed>([
        "notifications",
      ]);

      if (previousFeed) {
        queryClient.setQueryData<NotificationFeed>(["notifications"], {
          ...previousFeed,
          items: previousFeed.items.map((item) => ({ ...item, isRead: true })),
          unreadCount: 0,
        });
      }

      return { previousFeed };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(["notifications"], context.previousFeed);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
