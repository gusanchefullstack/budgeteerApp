import { useState } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { useRouter } from '@tanstack/react-router'
import type { DraftBudget, DraftCategory } from './types'
import { emptyCategory, draftToPayload } from './types'
import { CategoryEditor } from './CategoryEditor'
import { useCreateBudget } from '@/hooks/useCreateBudget'
import { ApiError } from '@/lib/api'
import styles from './TreeCreateForm.module.css'
import formStyles from './CreationForm.module.css'

const INITIAL: DraftBudget = {
  name: '', beginningDate: '', endingDate: '', incomes: [], expenses: [],
}

export function TreeCreateForm() {
  const router = useRouter()
  const createBudget = useCreateBudget()
  const [draft, setDraft] = useState<DraftBudget>(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function setField<K extends 'name' | 'beginningDate' | 'endingDate'>(key: K, val: string) {
    setDraft((d) => ({ ...d, [key]: val }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  function addCategory(section: 'incomes' | 'expenses') {
    setDraft((d) => ({ ...d, [section]: [...d[section], emptyCategory(section)] }))
  }

  function updateCategory(section: 'incomes' | 'expenses', idx: number, updated: DraftCategory) {
    setDraft((d) => {
      const cats = [...d[section]]
      cats[idx] = updated
      return { ...d, [section]: cats }
    })
  }

  function removeCategory(section: 'incomes' | 'expenses', idx: number) {
    setDraft((d) => ({ ...d, [section]: d[section].filter((_, i) => i !== idx) }))
  }

  function handleDragEnd(section: 'incomes' | 'expenses') {
    return ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return
      setDraft((d) => {
        const cats = d[section]
        const oldIdx = cats.findIndex((c) => c.uid === active.id)
        const newIdx = cats.findIndex((c) => c.uid === over.id)
        return { ...d, [section]: arrayMove(cats, oldIdx, newIdx) }
      })
    }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!draft.name.trim()) errs.name = 'Name is required'
    else if (!/^[a-zA-Z0-9 ]{1,50}$/.test(draft.name)) errs.name = 'Max 50 alphanumeric characters'
    if (!draft.beginningDate) errs.beginningDate = 'Start date required'
    if (!draft.endingDate) errs.endingDate = 'End date required'
    if (draft.beginningDate && draft.endingDate && new Date(draft.endingDate) <= new Date(draft.beginningDate))
      errs.endingDate = 'End date must be after start date'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      await createBudget.mutateAsync(draftToPayload(draft))
      router.navigate({ to: '/dashboard' })
    } catch {
      // error shown via createBudget.isError
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.root}>
      {/* ── Basic info ── */}
      <div className={styles.basicInfo}>
        <div className={formStyles.fieldGroup}>
          <label className="field-label" htmlFor="name">Budget name</label>
          <input
            id="name"
            type="text"
            maxLength={50}
            autoFocus
            className={`field ${errors.name ? 'error' : ''}`}
            placeholder="e.g. My 2026 Budget"
            value={draft.name}
            onChange={(e) => setField('name', e.target.value)}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className={formStyles.dateRow}>
          <div className={formStyles.fieldGroup}>
            <label className="field-label" htmlFor="beginningDate">Start date</label>
            <input
              id="beginningDate"
              type="date"
              className={`field ${errors.beginningDate ? 'error' : ''}`}
              value={draft.beginningDate}
              onChange={(e) => setField('beginningDate', e.target.value)}
            />
            {errors.beginningDate && <span className="field-error">{errors.beginningDate}</span>}
          </div>
          <div className={formStyles.fieldGroup}>
            <label className="field-label" htmlFor="endingDate">End date</label>
            <input
              id="endingDate"
              type="date"
              className={`field ${errors.endingDate ? 'error' : ''}`}
              value={draft.endingDate}
              onChange={(e) => setField('endingDate', e.target.value)}
            />
            {errors.endingDate && <span className="field-error">{errors.endingDate}</span>}
          </div>
        </div>
      </div>

      {/* ── Hierarchy builder ── */}
      <div className={styles.treeGrid}>
        {(['incomes', 'expenses'] as const).map((section) => (
          <div key={section} className={styles.treeColumn}>
            <div className={`${styles.columnHeader} ${styles[`columnHeader_${section === 'incomes' ? 'income' : 'expense'}`]}`}>
              {section === 'incomes'
                ? <TrendingUp size={15} strokeWidth={1.75} />
                : <TrendingDown size={15} strokeWidth={1.75} />}
              <span>{section === 'incomes' ? 'Incomes' : 'Expenses'}</span>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd(section)}
            >
              <SortableContext
                items={draft[section].map((c) => c.uid)}
                strategy={verticalListSortingStrategy}
              >
                <div className={styles.categoryList}>
                  {draft[section].map((cat, idx) => (
                    <SortableCategoryEditor
                      key={cat.uid}
                      id={cat.uid}
                      category={cat}
                      section={section}
                      onChange={(u) => updateCategory(section, idx, u)}
                      onRemove={() => removeCategory(section, idx)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <button
              type="button"
              className={`btn-ghost ${styles.addCatBtn}`}
              onClick={() => addCategory(section)}
            >
              <Plus size={14} /> Add category
            </button>
          </div>
        ))}
      </div>

      {createBudget.isError && (
        <div className={formStyles.serverError}>
          {createBudget.error instanceof ApiError && createBudget.error.status === 409
            ? 'You already have a budget. Only one budget per account is allowed.'
            : 'Failed to create budget. Please try again.'}
        </div>
      )}

      <div className={formStyles.formActions}>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : 'Create budget'}
        </button>
      </div>
    </form>
  )
}

// Sortable wrapper for dnd-kit
interface SortableProps {
  id: string
  category: DraftCategory
  section: 'incomes' | 'expenses'
  onChange: (u: DraftCategory) => void
  onRemove: () => void
}

function SortableCategoryEditor({ id, category, section, onChange, onRemove }: SortableProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
    >
      <CategoryEditor
        category={category}
        section={section}
        onChange={onChange}
        onRemove={onRemove}
        dragHandle={{ ...attributes, ...listeners }}
      />
    </div>
  )
}
