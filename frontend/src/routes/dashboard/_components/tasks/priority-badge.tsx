import { Priority } from "@/types/types";

interface IProps {
  priority: Priority;
}

export const PriorityBadge = ({ priority }: IProps) => {
  const PRIORITY_NAME: Record<Priority, string> = {
    "TaskPriority.LOW": "Low",
    "TaskPriority.MEDIUM": "Medium",
    "TaskPriority.HIGH": "High",
  };

  const PRIORITY_CLASS: Record<Priority, string> = {
    "TaskPriority.LOW": "bg-sky-50 text-sky-700 border-sky-200",
    "TaskPriority.MEDIUM": "bg-amber-50 text-amber-700 border-amber-200",
    "TaskPriority.HIGH": "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${PRIORITY_CLASS[priority]}`}
    >
      {PRIORITY_NAME[priority]} priority
    </div>
  );
};
