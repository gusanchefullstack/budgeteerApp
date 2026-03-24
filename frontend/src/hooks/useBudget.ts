import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Budget } from '@/lib/schemas'

const BUDGET_KEY = ['budget'] as const

interface ApiResponse<T> { success: boolean; data: T }

export function useBudget() {
  return useQuery({
    queryKey: BUDGET_KEY,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Budget | null>>('/budget')
      return res.data
    },
  })
}

export function useDeleteBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/budget/${id}`),
    onSuccess: () => qc.setQueryData(BUDGET_KEY, null),
  })
}

