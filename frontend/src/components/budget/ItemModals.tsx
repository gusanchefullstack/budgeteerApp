import { useEffect } from 'react'
import { useForm, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { z } from 'zod'
import { FormDialog } from '@/components/ui/FormDialog'
import { useAddItem, useUpdateItem } from '@/hooks/useBudgetCRUD'
import type { BudgetItem, Section } from '@/lib/schemas'
import { FREQUENCIES } from '@/lib/schemas'
import { capitalize } from '@/lib/utils'
import styles from './CrudModal.module.css'

const itemSchema = z.object({
  name:          z.string().min(1).max(20, 'Max 20 characters'),
  plannedDate:   z.string().min(1, 'Required'),
  plannedAmount: z.number().positive('Must be positive'),
  itemType:      z.enum(['income', 'expense']),
  currency:      z.string().length(3, '3-letter code'),
  frequency:     z.enum(FREQUENCIES),
})
type ItemInput = z.infer<typeof itemSchema>

// ─── Add item ─────────────────────────────────────────────────────────────────

interface AddProps {
  open: boolean
  budgetId: string
  section: Section
  categoryName: string
  groupName: string
  onClose: () => void
}

export function AddItemModal({ open, budgetId, section, categoryName, groupName, onClose }: AddProps) {
  const add = useAddItem(budgetId)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ItemInput>({
    resolver: zodResolver(itemSchema),
    defaultValues: { currency: 'USD', frequency: 'monthly', itemType: section === 'incomes' ? 'income' : 'expense' },
  })

  useEffect(() => {
    if (open) {
      reset({ currency: 'USD', frequency: 'monthly', itemType: section === 'incomes' ? 'income' : 'expense' })
      add.reset()
    }
  }, [open, section])

  async function onSubmit(data: ItemInput) {
    await add.mutateAsync({ section, categoryName, groupName, ...data })
    onClose()
  }

  return (
    <FormDialog open={open} title={`Add item to "${groupName}"`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
        <ItemFields errors={errors} register={register} />
        {add.isError && <p className={styles.error}>Failed. Please try again.</p>}
        <div className={styles.actions}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 size={13} className="animate-spin" /> Adding…</> : 'Add item'}
          </button>
        </div>
      </form>
    </FormDialog>
  )
}

// ─── Edit item ────────────────────────────────────────────────────────────────

interface EditProps {
  open: boolean
  budgetId: string
  section: Section
  categoryName: string
  groupName: string
  item: BudgetItem
  onClose: () => void
}

export function EditItemModal({ open, budgetId, section, categoryName, groupName, item, onClose }: EditProps) {
  const update = useUpdateItem(budgetId)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ItemInput>({
    resolver: zodResolver(itemSchema),
  })

  useEffect(() => {
    if (open) {
      reset({
        name:          item.name,
        plannedDate:   item.plannedDate.split('T')[0],
        plannedAmount: item.plannedAmount,
        itemType:      item.type,
        currency:      item.currency,
        frequency:     item.frequency,
      })
      update.reset()
    }
  }, [open, item])

  async function onSubmit(data: ItemInput) {
    await update.mutateAsync({
      section, categoryName, groupName, itemName: item.name,
      name:          data.name !== item.name ? data.name : undefined,
      plannedDate:   data.plannedDate,
      plannedAmount: data.plannedAmount,
      currency:      data.currency,
      frequency:     data.frequency,
    })
    onClose()
  }

  return (
    <FormDialog open={open} title={`Edit "${item.name}"`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
        <ItemFields errors={errors} register={register} />
        {update.isError && <p className={styles.error}>Failed. Please try again.</p>}
        <div className={styles.actions}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : 'Save changes'}
          </button>
        </div>
      </form>
    </FormDialog>
  )
}

// ─── Shared fields ────────────────────────────────────────────────────────────

function ItemFields({ errors, register }: {
  errors: FieldErrors<ItemInput>
  register: UseFormRegister<ItemInput>
}) {
  return (
    <>
      <div className={styles.field}>
        <label className="field-label" htmlFor="item-name">Item name</label>
        <input id="item-name" type="text" autoFocus maxLength={20}
          className={`field ${errors.name ? 'error' : ''}`} placeholder="e.g. Monthly Salary"
          {...register('name')} />
        {errors.name && <span className="field-error">{errors.name.message}</span>}
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className="field-label" htmlFor="item-amount">Planned amount</label>
          <input id="item-amount" type="number" step="0.01" min="0.01"
            className={`field ${errors.plannedAmount ? 'error' : ''}`} placeholder="0.00"
            {...register('plannedAmount', { valueAsNumber: true })} />
          {errors.plannedAmount && <span className="field-error">{errors.plannedAmount.message}</span>}
        </div>
        <div className={styles.field}>
          <label className="field-label" htmlFor="item-currency">Currency</label>
          <input id="item-currency" type="text" maxLength={3}
            className={`field ${errors.currency ? 'error' : ''}`} placeholder="USD"
            {...register('currency')} />
          {errors.currency && <span className="field-error">{errors.currency.message}</span>}
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className="field-label" htmlFor="item-date">Planned date</label>
          <input id="item-date" type="date"
            className={`field ${errors.plannedDate ? 'error' : ''}`}
            {...register('plannedDate')} />
          {errors.plannedDate && <span className="field-error">{errors.plannedDate.message}</span>}
        </div>
        <div className={styles.field}>
          <label className="field-label" htmlFor="item-freq">Frequency</label>
          <select id="item-freq" className="field" {...register('frequency')}>
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>{capitalize(f)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label className="field-label" htmlFor="item-type">Type</label>
        <select id="item-type" className="field" {...register('itemType')}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>
    </>
  )
}
