import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { ReactNode, useMemo, useState } from "react";
import { EditForm } from "./edit-form";
import { Task } from "@/types/types";

interface IProps {
  task: Task;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const EditDialog = ({ task, trigger, open, onOpenChange }: IProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const resolvedOpen = isControlled ? open : internalOpen;
  const resolvedOnOpenChange = useMemo(
    () => onOpenChange ?? setInternalOpen,
    [onOpenChange],
  );
  const defaultTrigger = (
    <Button className="size-8 ml-auto" variant="ghost" size="icon">
      <Pencil className="size-4" />
    </Button>
  );
  const shouldRenderTrigger = trigger !== undefined || open === undefined;

  return (
    <Dialog open={resolvedOpen} onOpenChange={resolvedOnOpenChange}>
      {shouldRenderTrigger && (
        <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      )}
      <DialogContent className="md:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit a task</DialogTitle>
          <DialogDescription>
            Make changes to your task effortlessly. Edit priorities, deadlines,
            or descriptions to keep everything on track.
          </DialogDescription>
        </DialogHeader>
        <EditForm task={task} onSuccess={() => resolvedOnOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};
