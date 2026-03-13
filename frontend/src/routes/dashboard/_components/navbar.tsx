import { Button } from "@/components/ui/button";
import {
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from "@/services/mutations/notifications";
import { useGetNotificationsQuery } from "@/services/queries/notifications";
import { useAuthStore } from "@/stores/auth-store";
import { NotificationItem } from "@/types/types";
import { Bell, CircleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type NotificationFilter = "all" | "unread" | "urgent";

export const Navbar = () => {
  const navigate = useNavigate();
  const { logout, token } = useAuthStore();
  const { data: feed } = useGetNotificationsQuery();
  const markOneMutation = useMarkNotificationAsReadMutation();
  const markAllMutation = useMarkAllNotificationsAsReadMutation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!panelRef.current) return;
      if (event.target instanceof Node && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatRelativeTime = (value: string) => {
    const createdAt = new Date(value).getTime();
    const diffMs = Date.now() - createdAt;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleMarkRead = async (notificationId: number) => {
    await markOneMutation.mutateAsync({ notificationId, token });
  };

  const handleMarkAllRead = async () => {
    await markAllMutation.mutateAsync(token);
  };

  const isUrgentNotification = (item: NotificationItem) => {
    const normalizedType = item.type.toUpperCase();
    return (
      normalizedType.includes("TASK_OVERDUE") ||
      normalizedType.includes("TASK_DUE_SOON")
    );
  };

  const highlightTaskCard = (taskId: number) => {
    const target = document.getElementById(`task-card-${taskId}`);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("ring-amber-400");

    window.setTimeout(() => {
      target.classList.remove("ring-amber-400");
    }, 2000);
  };

  const handleOpenTask = async (item: NotificationItem) => {
    highlightTaskCard(item.taskId);
    setIsOpen(false);

    if (!item.isRead) {
      await handleMarkRead(item.id);
    }
  };

  const allItems = feed?.items ?? [];
  const filteredItems = allItems.filter((item) => {
    if (activeFilter === "unread") return !item.isRead;
    if (activeFilter === "urgent") return isUrgentNotification(item);
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-background z-50 border-b">
      <nav className="flex items-center justify-between h-16 cs-container">
        <Link to="/dashboard" className="font-bold text-lg">
          TodoApp
        </Link>
        <div className="flex items-center gap-2" ref={panelRef}>
          <div className="relative">
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Toggle notifications"
              onClick={() => setIsOpen((prev) => !prev)}
            >
              <Bell className="size-4" />
            </Button>
            {(feed?.unreadCount ?? 0) > 0 && (
              <span className="absolute -top-2 -right-2 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                {feed?.unreadCount}
              </span>
            )}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-[22rem] origin-top-right rounded-md border bg-background p-3 shadow-lg animate-in fade-in zoom-in-95 duration-150">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold">Notifications</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllRead}
                    disabled={(feed?.items.length ?? 0) === 0 || markAllMutation.isPending}
                  >
                    {markAllMutation.isPending ? "Marking..." : "Mark all as read"}
                  </Button>
                </div>

                <div className="mb-3 flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={activeFilter === "all" ? "default" : "outline"}
                    onClick={() => setActiveFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={activeFilter === "unread" ? "default" : "outline"}
                    onClick={() => setActiveFilter("unread")}
                  >
                    Unread
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={activeFilter === "urgent" ? "default" : "outline"}
                    onClick={() => setActiveFilter("urgent")}
                  >
                    Urgent
                  </Button>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2">
                  {filteredItems.length === 0 ? (
                    <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                      No notifications for this filter.
                    </p>
                  ) : (
                    filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                          item.isRead ? "bg-background" : "bg-amber-50/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            title={item.message}
                            className={`line-clamp-2 ${
                              item.isRead ? "font-medium" : "font-semibold"
                            }`}
                          >
                            {item.message}
                          </p>
                          {isUrgentNotification(item) && (
                            <CircleAlert className="mt-0.5 size-4 text-amber-600" />
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <div className="min-w-0 text-xs text-muted-foreground">
                            <p>{formatRelativeTime(item.createdAt)}</p>
                            {item.taskTitle && (
                              <p className="truncate" title={item.taskTitle}>
                                {item.taskTitle}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenTask(item)}
                            >
                              Open task
                            </Button>
                            {!item.isRead && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkRead(item.id)}
                                disabled={markOneMutation.isPending}
                              >
                                Mark as read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <Button
            className="font-medium"
            size="sm"
            variant="outline"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </nav>
    </header>
  );
};
