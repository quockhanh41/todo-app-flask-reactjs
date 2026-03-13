import { Task } from "@/types/types";

interface IProps {
  task: Task;
  dateFormat?: "date" | "dateTime";
}

export const DeadlineBadge = ({ task, dateFormat = "dateTime" }: IProps) => {
  if (!task.deadline) return null;

  const deadlineDate = new Date(task.deadline);
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  const isCompleted = task.status === "TaskStatus.COMPLETED";

  let label = "";
  let className = "block max-w-full overflow-x-auto whitespace-nowrap rounded-md border px-2.5 py-1 text-[11px] font-medium sm:text-xs";

  if (isCompleted) {
    label = "Completed";
    className += " bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (diffMinutes < 0) {
    label = "Overdue";
    className += " bg-rose-50 text-rose-700 border-rose-200";
  } else if (diffMinutes <= 30) {
    label = "Due soon";
    className += " bg-amber-50 text-amber-700 border-amber-200";
  } else {
    label = "Scheduled";
    className += " bg-slate-50 text-slate-700 border-slate-200";
  }

  const absolute =
    dateFormat === "date"
      ? deadlineDate.toLocaleDateString("en-GB")
      : deadlineDate.toLocaleString();

  const toRelative = () => {
    const minutes = Math.round(Math.abs(diffMinutes));
    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h`;

    const days = Math.round(hours / 24);
    return `${days}d`;
  };

  const relative = diffMinutes < 0 ? `${toRelative()} ago` : `in ${toRelative()}`;

  return (
    <div className={className}>
      {label}: {relative} • {absolute}
    </div>
  );
};

