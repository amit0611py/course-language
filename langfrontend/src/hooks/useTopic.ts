import { useQuery } from "@tanstack/react-query";
import { fetchTopic, fetchTopicBreadcrumb } from "../api/client";
import type { Topic } from "../types";

export function useTopic(path: string) {
  return useQuery<Topic>({
    queryKey: ["topic", path],
    queryFn: () => fetchTopic(path),
    enabled: !!path,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useTopicBreadcrumb(path: string) {
  return useQuery<string[]>({
    queryKey: ["breadcrumb", path],
    queryFn: () => fetchTopicBreadcrumb(path),
    enabled: !!path,
    staleTime: 10 * 60 * 1000,
  });
}
