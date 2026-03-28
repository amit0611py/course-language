import { useQuery } from "@tanstack/react-query";
import { fetchNavigation } from "../api/client";
import type { NavigationResponse } from "../types";

// Returns the full { language, sections } envelope so components can use
// the enriched language metadata (meta.color, meta.tagline) from the nav response.
export function useNavigation(slug: string) {
  return useQuery<NavigationResponse>({
    queryKey: ["navigation", slug],
    queryFn: () => fetchNavigation(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
