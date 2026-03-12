import { Tag } from "@/types/types";
import { apiClient } from "./client";

export const getTagsAPI = async () => {
  const response = await apiClient.get<Tag[]>("/tags");

  return response.data;
};
