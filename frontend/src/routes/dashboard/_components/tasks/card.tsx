import { Task } from "@/types/types";
import { ShowDialog } from "./show-dialog";
import { DeadlineBadge } from "./deadline-badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { useUpdateTaskMutation } from "@/services/mutations/tasks";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { DragEventHandler } from "react";
import { TaskActionsMenu } from "./actions-menu";

interface IProps {
  task: Task;
  draggable?: boolean;
  onDragStart?: DragEventHandler<HTMLDivElement>;
  onDragEnd?: DragEventHandler<HTMLDivElement>;
}

export const TaskCard = ({ task, draggable, onDragStart, onDragEnd }: IProps) => {
  const { token } = useAuthStore();
  const updateTaskMutation = useUpdateTaskMutation();
  const isCompleted = task.status === "TaskStatus.COMPLETED";
  const isLongContent = task.content.length > 96;

  const priorityLabel = {
    "TaskPriority.LOW": "Low",
    "TaskPriority.MEDIUM": "Medium",
    "TaskPriority.HIGH": "High",
  } as const;

  const statusLabel = {
    "TaskStatus.PENDING": "Pending",
    "TaskStatus.IN_PROGRESS": "In Progress",
    "TaskStatus.COMPLETED": "Completed",
  } as const;

  const priorityClass = {
    "TaskPriority.LOW": "text-sky-800",
    "TaskPriority.MEDIUM": "text-amber-800",
    "TaskPriority.HIGH": "text-rose-800",
  } as const;

  const statusClass = {
    "TaskStatus.PENDING": "text-slate-700",
    "TaskStatus.IN_PROGRESS": "text-violet-800",
    "TaskStatus.COMPLETED": "text-emerald-800",
  } as const;

  const tagClass = "text-cyan-800";

  const priorityToApi = {
    "TaskPriority.LOW": "LOW",
    "TaskPriority.MEDIUM": "MEDIUM",
    "TaskPriority.HIGH": "HIGH",
  } as const;

  const handleMarkCompleted = async () => {
    if (isCompleted) return;

    await updateTaskMutation.mutateAsync({
      taskId: task.id,
      token,
      formData: {
        title: task.title,
        content: task.content,
        status: "COMPLETED",
        priority: priorityToApi[task.priority],
        deadline: task.deadline
          ? new Date(task.deadline).toISOString().slice(0, 16)
          : undefined,
      },
    });

    toast.success("Task marked as completed");
  };

  return (
    <div
      id={`task-card-${task.id}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`rounded-xl border bg-background p-4 shadow-sm ring-2 ring-transparent transition-all duration-300 hover:shadow-md ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <div className="mb-1 flex items-start gap-2">
        <ShowDialog task={task} />
        <TaskActionsMenu task={task} />
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2 text-[13px] font-semibold tracking-[0.01em] text-muted-foreground">
        <span className={priorityClass[task.priority]}>{priorityLabel[task.priority]}</span>
        <span className="text-slate-400">&bull;</span>
        <span className={statusClass[task.status]}>{statusLabel[task.status]}</span>
        <span className="text-slate-400">&bull;</span>
        <span className={tagClass}>{task.tagName}</span>
      </div>

      <div className="relative group/content">
        <p
          tabIndex={isLongContent ? 0 : -1}
          className={`whitespace-pre-line break-words text-sm text-muted-foreground outline-none ${
            isLongContent ? "line-clamp-2" : ""
          }`}
        >
          {task.content}
        </p>

        {isLongContent && (
          <div className="pointer-events-none absolute left-0 top-full z-30 mt-2 w-full rounded-md border bg-popover p-3 text-xs text-popover-foreground opacity-0 shadow-lg transition-all duration-300 ease-out delay-0 group-hover/content:delay-150 group-focus-within/content:delay-150 group-hover/content:translate-y-0 group-hover/content:opacity-100 group-focus-within/content:translate-y-0 group-focus-within/content:opacity-100 -translate-y-1">
            <p className="max-h-40 overflow-y-auto whitespace-pre-line break-words leading-relaxed">
              {task.content}
            </p>
          </div>
        )}
      </div>

      <div className="mt-3">
        <DeadlineBadge task={task} dateFormat="date" />
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          type="button"
          size="sm"
          variant={isCompleted ? "secondary" : "default"}
          disabled={isCompleted || updateTaskMutation.isPending}
          onClick={handleMarkCompleted}
        >
          <Check className="mr-1 size-4" />
          {isCompleted ? "Completed" : "Mark completed"}
        </Button>
      </div>
    </div>
  );
};
