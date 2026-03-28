import { useQuery } from "@tanstack/react-query";
import { fetchLanguages } from "../api/client";
import type { Language } from "../types";

export function useLanguages() {
  return useQuery<Language[]>({
    queryKey: ["languages"],
    queryFn: fetchLanguages,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}
