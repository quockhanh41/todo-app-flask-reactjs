export type Tag = {
  id: number;
  name: string;
};

export type Status =
  | "TaskStatus.PENDING"
  | "TaskStatus.IN_PROGRESS"
  | "TaskStatus.COMPLETED";

export type Priority =
  | "TaskPriority.LOW"
  | "TaskPriority.MEDIUM"
  | "TaskPriority.HIGH";

export type Task = {
  id: number;
  title: string;
  content: string;
  status: Status;
  createdAt: string;
  tagName: string;
  deadline: string | null;
  priority: Priority;
};

export type NotificationType =
  | "TASK_DUE_SOON"
  | "TASK_OVERDUE"
  | "NotificationType.TASK_DUE_SOON"
  | "NotificationType.TASK_OVERDUE";

export type NotificationItem = {
  id: number;
  taskId: number;
  taskTitle: string | null;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type NotificationFeed = {
  items: NotificationItem[];
  unreadCount: number;
};
