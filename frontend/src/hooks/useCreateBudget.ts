import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Budget } from '@/lib/schemas'

interface ApiResponse<T> { success: boolean; data: T }

export function useCreateBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: unknown) =>
      api.post<ApiResponse<Budget>>('/budget', payload),
    onSuccess: (res) => {
      qc.setQueryData(['budget'], res.data)
    },
  })
}
