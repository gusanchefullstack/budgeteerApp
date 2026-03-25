import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Transaction, CreateTransactionInput } from '@/lib/schemas'

interface ApiResponse<T> { success: boolean; data: T }

interface TxFilters {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
  txtype?: 'income' | 'expense'
  txcategory?: string
  txgroup?: string
  txitem?: string
}

const PAGE_SIZE = 15

export function useTransactions(budgetId: string | undefined, filters: TxFilters = {}) {
  const { page = 1, limit = PAGE_SIZE, ...queryFilters } = filters

  return useQuery({
    queryKey: ['transactions', budgetId, filters],
    enabled: !!budgetId,
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(queryFilters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v))
      })
      const qs = params.toString()
      const raw = await api.get<ApiResponse<Transaction[]>>(
        qs ? `/transactions/q?${qs}` : '/transactions',
      )
      const all = raw.data
      // Client-side pagination (backend returns all matching)
      const start = (page - 1) * limit
      return {
        data: all.slice(start, start + limit),
        total: all.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(all.length / limit)),
      }
    },
  })
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTransactionInput) =>
      api.post<ApiResponse<Transaction>>('/transactions', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.refetchQueries({ queryKey: ['budget'] })
    },
  })
}
