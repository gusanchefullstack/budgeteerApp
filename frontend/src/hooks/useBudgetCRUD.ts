import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Budget } from '@/lib/schemas'

interface ApiOk<T> { success: boolean; data: T }

const BUDGET_KEY = ['budget'] as const

function setBudget(qc: ReturnType<typeof useQueryClient>, res: ApiOk<Budget>) {
  qc.setQueryData(BUDGET_KEY, res.data)
}

// ─── Budget ───────────────────────────────────────────────────────────────────

export function useUpdateBudgetMeta(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { name?: string; beginningDate?: string; endingDate?: string }) =>
      api.patch<ApiOk<Budget>>(`/budget/${id}`, body),
    onSuccess: (res) => setBudget(qc, res),
  })
}

// ─── Category ─────────────────────────────────────────────────────────────────

interface AddCategoryBody {
  section: 'incomes' | 'expenses'
  name: string
}

export function useAddCategory(budgetId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: AddCategoryBody) =>
      api.post<ApiOk<Budget>>(`/budget/${budgetId}/category`, body),
    onSuccess: (res) => setBudget(qc, res),
  })
}

interface UpdateCategoryBody {
  section: 'incomes' | 'expenses'
  categoryName: string
  name: string
}

export function useUpdateCategory(budgetId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateCategoryBody) =>
      api.patch<ApiOk<Budget>>(`/budget/${budgetId}/category`, body),
    onSuccess: (res) => setBudget(qc, res),
  })
}

interface DeleteCategoryBody {
  section: 'incomes' | 'expenses'
  categoryName: string
}

export function useDeleteCategory(budgetId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: DeleteCategoryBody) =>
      api.delete<ApiOk<Budget>>(`/budget/${budgetId}/category`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: BUDGET_KEY }),
  })
}

// ─── Group ────────────────────────────────────────────────────────────────────

interface AddGroupBody {
  section: 'incomes' | 'expenses'
  categoryName: string
  name: string
}

export function useAddGroup(budgetId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: AddGroupBody) =>
      api.post<ApiOk<Budget>>(`/budget/${budgetId}/group`, body),
    onSuccess: (res) => setBudget(qc, res),
  })
}

interface UpdateGroupBody {
  section: 'incomes' | 'expenses'
  categoryName: string
  groupName: string
  name: string
}

export function useUpdateGroup(budgetId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateGroupBody) =>
      api.patch<ApiOk<Budget>>(`/budget/${budgetId}/group`, body),
    onSuccess: (res) => setBudget(qc, res),
  })
}

interface DeleteGroupBody {
  section: 'incomes' | 'expenses'
  categoryName: string
  groupName: string
}

export function useDeleteGroup(budgetId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: DeleteGroupBody) =>
      api.delete<ApiOk<Budget>>(`/budget/${budgetId}/group`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: BUDGET_KEY }),
  })
}

// ─── Item ─────────────────────────────────────────────────────────────────────

interface AddItemBody {
  section: 'incomes' | 'expenses'
  categoryName: string
  groupName: string
  name: string
  plannedDate: string
  plannedAmount: number
  itemType: 'income' | 'expense'
  currency: string
  frequency: string
}

export function useAddItem(budgetId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: AddItemBody) =>
      api.post<ApiOk<Budget>>(`/budget/${budgetId}/item`, body),
    onSuccess: (res) => setBudget(qc, res),
  })
}

interface UpdateItemBody {
  section: 'incomes' | 'expenses'
  categoryName: string
  groupName: string
  itemName: string
  name?: string
  plannedDate?: string
  plannedAmount?: number
  currency?: string
  frequency?: string
}

export function useUpdateItem(budgetId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateItemBody) =>
      api.patch<ApiOk<Budget>>(`/budget/${budgetId}/item`, body),
    onSuccess: (res) => setBudget(qc, res),
  })
}

interface DeleteItemBody {
  section: 'incomes' | 'expenses'
  categoryName: string
  groupName: string
  itemName: string
}

export function useDeleteItem(budgetId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: DeleteItemBody) =>
      api.delete<ApiOk<Budget>>(`/budget/${budgetId}/item`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: BUDGET_KEY }),
  })
}
