import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { User } from '@/lib/schemas'

interface ApiOk<T> { success: boolean; data: T }

const ME_KEY = ['me'] as const

export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: () => api.get<ApiOk<User>>('/auth/me').then((r) => r.data),
    staleTime: 1000 * 60 * 10, // 10 min — changes rarely
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/auth/unsubscribe'),
    onSuccess: () => qc.clear(),
  })
}
