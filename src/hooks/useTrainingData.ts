// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Training Data React Query Hooks
// TanStack React Query hooks for fetching/caching training sample data.
// ═══════════════════════════════════════════════════════════════════════════════

import type { TrainingSample } from "@/lib/feedbackStore";
import {
  exportUserDataset,
  fetchGlobalSamples,
  fetchSampleCount,
  fetchSamplesForDiscipline,
  saveSamples,
  trainingQueryKeys,
} from "@/lib/feedbackStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Hook: Get total training sample count for the current user */
export function useTrainingSampleCount(userId: string | undefined) {
  return useQuery({
    queryKey: trainingQueryKeys.count(userId ?? ""),
    queryFn: () => fetchSampleCount(userId!),
    enabled: !!userId,
    staleTime: 30_000, // 30 seconds
  });
}

/** Hook: Get training samples for a specific discipline */
export function useTrainingSamples(
  userId: string | undefined,
  discipline: string,
) {
  return useQuery({
    queryKey: trainingQueryKeys.forDiscipline(userId ?? "", discipline),
    queryFn: () => fetchSamplesForDiscipline(userId!, discipline),
    enabled: !!userId && !!discipline,
    staleTime: 60_000,
  });
}

/** Hook: Get global community training samples (all users) */
export function useGlobalTrainingSamples(discipline: string) {
  return useQuery({
    queryKey: trainingQueryKeys.global(discipline),
    queryFn: () => fetchGlobalSamples(discipline),
    enabled: !!discipline,
    staleTime: 120_000, // 2 minutes
  });
}

/** Hook: Save training samples (mutation) */
export function useSaveTrainingSamples(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      samples: Omit<TrainingSample, "id" | "user_id" | "created_at">[],
    ) => saveSamples(userId!, samples),
    onSuccess: () => {
      // Invalidate all training-related queries
      queryClient.invalidateQueries({
        queryKey: trainingQueryKeys.all,
      });
    },
  });
}

/** Hook: Export user dataset */
export function useExportDataset(userId: string | undefined) {
  return useQuery({
    queryKey: [...trainingQueryKeys.all, "export", userId ?? ""],
    queryFn: () => exportUserDataset(userId!),
    enabled: false, // Only fetch on demand
  });
}
