import { Status } from "@/types/types";

interface IProps {
  status: Status;
}

export const StatusBadge = ({ status }: IProps) => {
  const STATUS_NAME: Record<Status, string> = {
    "TaskStatus.PENDING": "Pending",
    "TaskStatus.IN_PROGRESS": "In Progress",
    "TaskStatus.COMPLETED": "Completed",
  };

  const STATUS_CLASS: Record<Status, string> = {
    "TaskStatus.PENDING": "bg-slate-100 text-slate-700 border-slate-200",
    "TaskStatus.IN_PROGRESS": "bg-violet-50 text-violet-700 border-violet-200",
    "TaskStatus.COMPLETED": "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <div
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[status]}`}
    >
      {STATUS_NAME[status]}
    </div>
  );
};
