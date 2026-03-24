import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { useRouter } from '@tanstack/react-router'
import { WizardStepper } from './WizardStepper'
import { CategoryEditor } from './CategoryEditor'
import type { DraftBudget, DraftCategory, DraftItem } from './types'
import { emptyCategory, draftToPayload } from './types'
import { useCreateBudget } from '@/hooks/useCreateBudget'
import { ApiError } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import styles from './WizardCreateForm.module.css'
import formStyles from './CreationForm.module.css'

const STEPS = [
  { label: 'Basics',   description: 'Name & dates' },
  { label: 'Incomes',  description: 'Categories & items' },
  { label: 'Expenses', description: 'Categories & items' },
  { label: 'Review',   description: 'Confirm & submit' },
]

const INITIAL: DraftBudget = { name: '', beginningDate: '', endingDate: '', incomes: [], expenses: [] }

export function WizardCreateForm() {
  const router = useRouter()
  const createBudget = useCreateBudget()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<DraftBudget>(INITIAL)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Step 0 validation ──
  function validateBasics(): boolean {
    const errs: Record<string, string> = {}
    if (!draft.name.trim()) errs.name = 'Name is required'
    else if (!/^[a-zA-Z0-9 ]{1,50}$/.test(draft.name)) errs.name = 'Max 50 alphanumeric characters'
    if (!draft.beginningDate) errs.beginningDate = 'Start date required'
    if (!draft.endingDate) errs.endingDate = 'End date required'
    if (draft.beginningDate && draft.endingDate && new Date(draft.endingDate) <= new Date(draft.beginningDate))
      errs.endingDate = 'End date must be after start date'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  function next() {
    if (step === 0 && !validateBasics()) return
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function back() { setStep((s) => Math.max(s - 1, 0)) }

  function setField(key: 'name' | 'beginningDate' | 'endingDate', val: string) {
    setDraft((d) => ({ ...d, [key]: val }))
    setFieldErrors((e) => ({ ...e, [key]: '' }))
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

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      await createBudget.mutateAsync(draftToPayload(draft))
      router.navigate({ to: '/dashboard' })
    } catch {
      // error shown below
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.root}>
      <WizardStepper steps={STEPS} current={step} />

      <div className={styles.panel}>
        {/* ── Step 0: Basics ── */}
        {step === 0 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Name your budget</h2>
            <p className={styles.stepDesc}>Give it a name and set the date range it covers.</p>

            <div className={formStyles.fieldGroup}>
              <label className="field-label" htmlFor="wz-name">Budget name</label>
              <input
                id="wz-name"
                type="text"
                maxLength={50}
                autoFocus
                className={`field ${fieldErrors.name ? 'error' : ''}`}
                placeholder="e.g. Annual 2026"
                value={draft.name}
                onChange={(e) => setField('name', e.target.value)}
              />
              {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
            </div>

            <div className={formStyles.dateRow}>
              <div className={formStyles.fieldGroup}>
                <label className="field-label" htmlFor="wz-start">Start date</label>
                <input id="wz-start" type="date" className={`field ${fieldErrors.beginningDate ? 'error' : ''}`}
                  value={draft.beginningDate} onChange={(e) => setField('beginningDate', e.target.value)} />
                {fieldErrors.beginningDate && <span className="field-error">{fieldErrors.beginningDate}</span>}
              </div>
              <div className={formStyles.fieldGroup}>
                <label className="field-label" htmlFor="wz-end">End date</label>
                <input id="wz-end" type="date" className={`field ${fieldErrors.endingDate ? 'error' : ''}`}
                  value={draft.endingDate} onChange={(e) => setField('endingDate', e.target.value)} />
                {fieldErrors.endingDate && <span className="field-error">{fieldErrors.endingDate}</span>}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Incomes ── */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <div className={styles.sectionHeader}>
              <TrendingUp size={18} style={{ color: 'var(--income-base)' }} />
              <div>
                <h2 className={styles.stepTitle}>Income categories</h2>
                <p className={styles.stepDesc}>Add your sources of income — salaries, freelance, dividends, etc.</p>
              </div>
            </div>
            <SectionBuilder section="incomes" categories={draft.incomes}
              onAdd={() => addCategory('incomes')}
              onUpdate={(i, u) => updateCategory('incomes', i, u)}
              onRemove={(i) => removeCategory('incomes', i)} />
          </div>
        )}

        {/* ── Step 2: Expenses ── */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <div className={styles.sectionHeader}>
              <TrendingDown size={18} style={{ color: 'var(--expense-base)' }} />
              <div>
                <h2 className={styles.stepTitle}>Expense categories</h2>
                <p className={styles.stepDesc}>Add your spending categories — housing, food, transport, etc.</p>
              </div>
            </div>
            <SectionBuilder section="expenses" categories={draft.expenses}
              onAdd={() => addCategory('expenses')}
              onUpdate={(i, u) => updateCategory('expenses', i, u)}
              onRemove={(i) => removeCategory('expenses', i)} />
          </div>
        )}

        {/* ── Step 3: Review ── */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Review your budget</h2>
            <p className={styles.stepDesc}>Everything looks good? Submit to create your budget.</p>

            <div className={styles.reviewGrid}>
              <ReviewBlock label="Budget name" value={draft.name} />
              <ReviewBlock label="Date range" value={`${draft.beginningDate} → ${draft.endingDate}`} mono />
              <ReviewBlock label="Income categories" value={`${draft.incomes.length} categories`} />
              <ReviewBlock label="Expense categories" value={`${draft.expenses.length} categories`} />
            </div>

            <div className={styles.reviewTotals}>
              <ReviewTotal
                label="Total planned income"
                amount={sumPlanned(draft.incomes, draft.beginningDate, draft.endingDate)}
                variant="income"
              />
              <ReviewTotal
                label="Total planned expenses"
                amount={sumPlanned(draft.expenses, draft.beginningDate, draft.endingDate)}
                variant="expense"
              />
            </div>

            {createBudget.isError && (
              <div className={formStyles.serverError}>
                {createBudget.error instanceof ApiError && createBudget.error.status === 409
                  ? 'You already have a budget. Only one budget per account is allowed.'
                  : 'Failed to create budget. Please try again.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <div className={styles.nav}>
        {step > 0
          ? <button type="button" className="btn-ghost" onClick={back}>
              <ArrowLeft size={14} /> Back
            </button>
          : <div />
        }

        {step < STEPS.length - 1
          ? <button type="button" className="btn-primary" onClick={next}>
              Next <ArrowRight size={14} />
            </button>
          : <button type="button" className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? <><Loader2 size={14} className="animate-spin" /> Creating…</>
                : <><Check size={14} /> Create budget</>
              }
            </button>
        }
      </div>
    </div>
  )
}

// ── Helpers ──

function countOccurrences(
  frequency: DraftItem['frequency'],
  beginningDate: string,
  endingDate: string,
): number {
  if (!beginningDate || !endingDate) return 1
  if (frequency === 'onetime') return 1

  const begin = new Date(beginningDate)
  const end   = new Date(endingDate)
  if (end <= begin) return 1

  switch (frequency) {
    case 'daily': {
      return Math.floor((end.getTime() - begin.getTime()) / 86_400_000) + 1
    }
    case 'weekly': {
      const beginDow = (begin.getUTCDay() + 6) % 7
      const firstMonday = new Date(begin)
      firstMonday.setUTCDate(firstMonday.getUTCDate() - beginDow)
      let count = 0
      const cur = new Date(firstMonday)
      while (cur <= end) { count++; cur.setUTCDate(cur.getUTCDate() + 7) }
      return count
    }
    case 'monthly': {
      return (end.getUTCFullYear() - begin.getUTCFullYear()) * 12
        + (end.getUTCMonth() - begin.getUTCMonth()) + 1
    }
    case 'quarterly': {
      return (end.getUTCFullYear() - begin.getUTCFullYear()) * 4
        + Math.floor(end.getUTCMonth() / 3) - Math.floor(begin.getUTCMonth() / 3) + 1
    }
    case 'semiannually': {
      return (end.getUTCFullYear() - begin.getUTCFullYear()) * 2
        + Math.floor(end.getUTCMonth() / 6) - Math.floor(begin.getUTCMonth() / 6) + 1
    }
    case 'annually': {
      return end.getUTCFullYear() - begin.getUTCFullYear() + 1
    }
    default: return 1
  }
}

function sumPlanned(cats: DraftCategory[], beginningDate: string, endingDate: string): number {
  return cats.flatMap((c) => c.budgetGroups).flatMap((g) => g.budgetItems)
    .reduce((sum, i) => sum + i.plannedAmount * countOccurrences(i.frequency, beginningDate, endingDate), 0)
}

interface SectionBuilderProps {
  section: 'incomes' | 'expenses'
  categories: DraftCategory[]
  onAdd: () => void
  onUpdate: (idx: number, updated: DraftCategory) => void
  onRemove: (idx: number) => void
}

function SectionBuilder({ section, categories, onAdd, onUpdate, onRemove }: SectionBuilderProps) {
  return (
    <div className={styles.sectionBuilder}>
      <div className={styles.categoryList}>
        {categories.map((cat, idx) => (
          <CategoryEditor
            key={cat.uid}
            category={cat}
            section={section}
            onChange={(u) => onUpdate(idx, u)}
            onRemove={() => onRemove(idx)}
          />
        ))}
        {categories.length === 0 && (
          <p className={styles.emptySect}>No categories yet. Add one below.</p>
        )}
      </div>
      <button type="button" className="btn-ghost" onClick={onAdd}>
        <Plus size={14} /> Add category
      </button>
    </div>
  )
}

interface ReviewBlockProps { label: string; value: string; mono?: boolean }

function ReviewBlock({ label, value, mono }: ReviewBlockProps) {
  return (
    <div className={styles.reviewBlock}>
      <span className={styles.reviewLabel}>{label}</span>
      <span className={`${styles.reviewValue} ${mono ? styles.reviewMono : ''}`}>{value}</span>
    </div>
  )
}

interface ReviewTotalProps { label: string; amount: number; variant: 'income' | 'expense' }

function ReviewTotal({ label, amount, variant }: ReviewTotalProps) {
  return (
    <div className={`${styles.reviewTotal} ${styles[`reviewTotal_${variant}`]}`}>
      <span className={styles.reviewTotalLabel}>{label}</span>
      <span className={styles.reviewTotalAmount}>{formatCurrency(amount)}</span>
    </div>
  )
}
