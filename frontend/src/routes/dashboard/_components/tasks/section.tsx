import { useGetTasksOnUserQuery } from "@/services/queries/tasks";
import { EmptyState } from "./empty-state";
import { CreateDialog } from "./create-dialog";
import { QuickAdd } from "./quick-add";
import { TaskCard } from "./card";
import { useUpdateTaskMutation } from "@/services/mutations/tasks";
import { useAuthStore } from "@/stores/auth-store";
import { Task } from "@/types/types";
import { DragEvent, useState } from "react";

type ApiStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

const COLUMNS: Array<{
  key: ApiStatus;
  title: string;
  taskStatus: Task["status"];
  titleClass: string;
  countClass: string;
  accentBorderClass: string;
}> = [
  {
    key: "PENDING",
    title: "Pending",
    taskStatus: "TaskStatus.PENDING",
    titleClass: "text-slate-700",
    countClass: "bg-slate-100 text-slate-700 border border-slate-200",
    accentBorderClass: "border-t-slate-400",
  },
  {
    key: "IN_PROGRESS",
    title: "In Progress",
    taskStatus: "TaskStatus.IN_PROGRESS",
    titleClass: "text-violet-800",
    countClass: "bg-violet-100 text-violet-800 border border-violet-200",
    accentBorderClass: "border-t-violet-500",
  },
  {
    key: "COMPLETED",
    title: "Completed",
    taskStatus: "TaskStatus.COMPLETED",
    titleClass: "text-emerald-800",
    countClass: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    accentBorderClass: "border-t-emerald-500",
  },
];

export const TasksSection = () => {
  const { data: tasks = [] } = useGetTasksOnUserQuery();
  const { token } = useAuthStore();
  const updateTaskMutation = useUpdateTaskMutation();
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null);
  const [activeDropColumn, setActiveDropColumn] = useState<ApiStatus | null>(null);

  const priorityToApi = {
    "TaskPriority.LOW": "LOW",
    "TaskPriority.MEDIUM": "MEDIUM",
    "TaskPriority.HIGH": "HIGH",
  } as const;

  const statusToApi = {
    "TaskStatus.PENDING": "PENDING",
    "TaskStatus.IN_PROGRESS": "IN_PROGRESS",
    "TaskStatus.COMPLETED": "COMPLETED",
  } as const;

  const handleDragStart = (taskId: number) => {
    setDraggingTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setActiveDropColumn(null);
  };

  const handleDragOverColumn = (
    event: DragEvent<HTMLElement>,
    columnStatus: ApiStatus,
  ) => {
    event.preventDefault();
    setActiveDropColumn(columnStatus);
  };

  const handleDropToColumn = async (
    event: DragEvent<HTMLElement>,
    nextStatus: ApiStatus,
  ) => {
    event.preventDefault();

    if (!draggingTaskId) return;

    const task = tasks.find((item) => item.id === draggingTaskId);
    if (!task) {
      handleDragEnd();
      return;
    }

    const currentStatus = statusToApi[task.status];
    if (currentStatus === nextStatus) {
      handleDragEnd();
      return;
    }

    await updateTaskMutation.mutateAsync({
      taskId: task.id,
      token,
      formData: {
        title: task.title,
        content: task.content,
        status: nextStatus,
        priority: priorityToApi[task.priority],
        deadline: task.deadline
          ? new Date(task.deadline).toISOString().slice(0, 16)
          : undefined,
      },
    });
    handleDragEnd();
  };

  const dueSoonCount = tasks.filter(
    (task) =>
      task.deadline &&
      (() => {
        const deadline = new Date(task.deadline);
        const now = new Date();
        const diffMinutes =
          (deadline.getTime() - now.getTime()) / (1000 * 60);
        return diffMinutes >= 0 && diffMinutes <= 30;
      })(),
  ).length;

  return (
    <div>
      {tasks.length === 0 ? (
        <EmptyState />
      ) : (
        <div>
          {dueSoonCount > 0 && (
            <div className="mb-4 rounded-md border bg-muted px-4 py-3 text-sm">
              <span>
                You have <strong>{dueSoonCount}</strong> task
                {dueSoonCount > 1 ? "s" : ""} due within 30 minutes.
              </span>
            </div>
          )}
          <div className="mb-4 md:mb-6 lg:mb-8 flex flex-col items-center max-w-2xl mx-auto w-full">
            <QuickAdd />
            <CreateDialog />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {COLUMNS.map((column) => {
              const columnTasks = tasks.filter(
                (task) => task.status === column.taskStatus,
              );

              return (
                <section
                  key={column.key}
                  onDragOver={(event) => handleDragOverColumn(event, column.key)}
                  onDrop={(event) => handleDropToColumn(event, column.key)}
                  className={`rounded-xl border-2 border-x border-b bg-muted/30 p-3 transition-colors ${column.accentBorderClass} ${
                    activeDropColumn === column.key
                      ? "border-amber-300 bg-amber-50/40"
                      : ""
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3
                      className={`text-sm font-semibold uppercase tracking-wide ${column.titleClass}`}
                    >
                      {column.title}
                    </h3>
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-semibold ${column.countClass}`}
                    >
                      {columnTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3 min-h-20">
                    {columnTasks.length === 0 ? (
                      <div className="rounded-lg border border-dashed bg-background/60 px-3 py-6 text-center text-xs text-muted-foreground">
                        Drop task here
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          draggable
                          onDragStart={() => handleDragStart(task.id)}
                          onDragEnd={handleDragEnd}
                        />
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
