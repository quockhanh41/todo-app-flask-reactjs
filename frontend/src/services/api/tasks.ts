import { TCreateFormSchema, TEditFormSchema } from "@/schemas/task-schema";
import { useAuthStore } from "@/stores/auth-store";
import { Task } from "@/types/types";
import { apiClient } from "./client";

export const getTasksOnUserAPI = async () => {
  const token = useAuthStore.getState().token;

  const response = await apiClient.get<Task[]>("/tasks/user", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const createTaskAPI = async (data: {
  formData: TCreateFormSchema;
  token: string | null;
}) => {
  const { formData, token } = data;

  // Convert optional deadline from local datetime-local string to ISO (UTC) if present
  const payload = {
    ...formData,
    deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
  };

  await apiClient.post("/tasks", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateTaskAPI = async (data: {
  formData: TEditFormSchema;
  taskId: number;
  token: string | null;
}) => {
  const { formData, token, taskId } = data;

  const payload = {
    ...formData,
    deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
  };

  await apiClient.put(`/tasks/${taskId}`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const deleteTaskAPI = async (data: {
  taskId: number;
  token: string | null;
}) => {
  const { token, taskId } = data;

  await apiClient.delete(`/tasks/${taskId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
