import { useQuery } from "@tanstack/react-query";

import { getNotificationsAPI } from "../api/notifications";

export const useGetNotificationsQuery = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: getNotificationsAPI,
    staleTime: 15 * 1000,
    refetchInterval: 60 * 1000,
  });
};
