import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { CreateForm } from "./create-form";

export const CreateDialog = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-medium" size="sm">
          Create a new task
        </Button>
      </DialogTrigger>
      <DialogContent className="md:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create a new task</DialogTitle>
          <DialogDescription>
            Stay on track by creating a new task. Set priorities, deadlines, and
            details to manage your to-dos effortlessly.
          </DialogDescription>
        </DialogHeader>
          <CreateForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};
