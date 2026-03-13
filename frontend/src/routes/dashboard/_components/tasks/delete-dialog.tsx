import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { useDeleteTaskMutation } from "@/services/mutations/tasks";
import { useAuthStore } from "@/stores/auth-store";
import { Trash } from "lucide-react";
import { ReactNode } from "react";
import { toast } from "sonner";

interface IProps {
  taskId: number;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const DeleteDialog = ({
  taskId,
  trigger,
  open,
  onOpenChange,
}: IProps) => {
  const mutation = useDeleteTaskMutation();
  const { token } = useAuthStore();
  const shouldRenderTrigger = trigger !== undefined || open === undefined;

  const handleDelete = async () => {
    await mutation.mutateAsync({ token, taskId });

    toast.success("Task successfully deleted");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {shouldRenderTrigger && (
        <AlertDialogTrigger asChild>
          {trigger ?? (
            <Button variant="destructive" className="font-medium" size="sm">
              Delete
              <Trash />
            </Button>
          )}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base">
            Are you absolutely sure?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your task
            and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={handleDelete}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
