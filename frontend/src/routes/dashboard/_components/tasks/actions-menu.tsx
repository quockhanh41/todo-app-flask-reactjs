import { Button } from "@/components/ui/button";
import { Task } from "@/types/types";
import { Ellipsis, Pencil, Trash } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { DeleteDialog } from "./delete-dialog";
import { EditDialog } from "./edit-dialog";

interface IProps {
  task: Task;
}

export const TaskActionsMenu = ({ task }: IProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (event.target instanceof Node && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative ml-auto" ref={containerRef}>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Open task actions"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <Ellipsis className="size-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-10 z-20 w-40 rounded-lg border bg-background p-1.5 shadow-lg animate-in fade-in zoom-in-95 duration-150">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors hover:bg-muted"
            onClick={() => {
              setIsOpen(false);
              setIsEditOpen(true);
            }}
          >
            <Pencil className="size-4" />
            Edit
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left text-destructive transition-colors hover:bg-destructive/10"
            onClick={() => {
              setIsOpen(false);
              setIsDeleteOpen(true);
            }}
          >
            <Trash className="size-4" />
            Delete
          </button>
        </div>
      )}

      <EditDialog task={task} open={isEditOpen} onOpenChange={setIsEditOpen} />
      <DeleteDialog
        taskId={task.id}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </div>
  );
};
