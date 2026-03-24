import type { Frequency } from '@/lib/schemas'

// Local draft types (include a stable `uid` for dnd-kit and React keys)
export interface DraftItem {
  uid: string
  name: string
  plannedDate: string
  plannedAmount: number
  type: 'income' | 'expense'
  currency: string
  frequency: Frequency
}

export interface DraftGroup {
  uid: string
  name: string
  budgetItems: DraftItem[]
}

export interface DraftCategory {
  uid: string
  name: string
  budgetGroups: DraftGroup[]
}

export interface DraftBudget {
  name: string
  beginningDate: string
  endingDate: string
  incomes: DraftCategory[]
  expenses: DraftCategory[]
}

// Convert draft → API payload (strip uids, add section types)
export function draftToPayload(draft: DraftBudget) {
  const mapCategory = (section: 'incomes' | 'expenses') =>
    (cats: DraftCategory[]) =>
      cats.map((cat) => ({
        name: cat.name,
        type: section,
        budgetGroups: cat.budgetGroups.map((grp) => ({
          name: grp.name,
          type: section,
          budgetItems: grp.budgetItems.map((item) => ({
            name:          item.name,
            plannedDate:   item.plannedDate,
            plannedAmount: item.plannedAmount,
            type:          item.type,
            currency:      item.currency,
            frequency:     item.frequency,
          })),
        })),
      }))

  return {
    name:          draft.name,
    beginningDate: draft.beginningDate,
    endingDate:    draft.endingDate,
    incomes:       mapCategory('incomes')(draft.incomes),
    expenses:      mapCategory('expenses')(draft.expenses),
  }
}

let _counter = 0
export function uid(): string {
  return `uid_${++_counter}_${Math.random().toString(36).slice(2, 6)}`
}

export function emptyCategory(_section?: 'incomes' | 'expenses'): DraftCategory {
  return { uid: uid(), name: '', budgetGroups: [] }
}

export function emptyGroup(): DraftGroup {
  return { uid: uid(), name: '', budgetItems: [] }
}

export function emptyItem(type: 'income' | 'expense'): DraftItem {
  return {
    uid: uid(),
    name: '',
    plannedDate: '',
    plannedAmount: 0,
    type,
    currency: 'USD',
    frequency: 'monthly',
  }
}
