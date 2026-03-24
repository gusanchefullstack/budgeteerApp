import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { z } from 'zod'
import { FormDialog } from '@/components/ui/FormDialog'
import { useAddCategory, useUpdateCategory } from '@/hooks/useBudgetCRUD'
import type { Section } from '@/lib/schemas'
import styles from './CrudModal.module.css'

const nameSchema = z.object({ name: z.string().min(1).max(20, 'Max 20 characters') })
type NameInput = z.infer<typeof nameSchema>

// ─── Add category ─────────────────────────────────────────────────────────────

interface AddProps {
  open: boolean
  budgetId: string
  section: Section
  onClose: () => void
}

export function AddCategoryModal({ open, budgetId, section, onClose }: AddProps) {
  const add = useAddCategory(budgetId)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<NameInput>({
    resolver: zodResolver(nameSchema),
  })

  useEffect(() => { if (open) { reset({ name: '' }); add.reset() } }, [open])

  async function onSubmit({ name }: NameInput) {
    await add.mutateAsync({ section, name })
    onClose()
  }

  return (
    <FormDialog open={open} title={`Add ${section === 'incomes' ? 'income' : 'expense'} category`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
        <div className={styles.field}>
          <label className="field-label" htmlFor="add-cat-name">Category name</label>
          <input id="add-cat-name" type="text" autoFocus maxLength={20}
            className={`field ${errors.name ? 'error' : ''}`} placeholder="e.g. Housing"
            {...register('name')} />
          {errors.name && <span className="field-error">{errors.name.message}</span>}
        </div>
        {add.isError && <p className={styles.error}>Failed. Please try again.</p>}
        <div className={styles.actions}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 size={13} className="animate-spin" /> Adding…</> : 'Add category'}
          </button>
        </div>
      </form>
    </FormDialog>
  )
}

// ─── Edit category ────────────────────────────────────────────────────────────

interface EditProps {
  open: boolean
  budgetId: string
  section: Section
  currentName: string
  onClose: () => void
}

export function EditCategoryModal({ open, budgetId, section, currentName, onClose }: EditProps) {
  const update = useUpdateCategory(budgetId)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<NameInput>({
    resolver: zodResolver(nameSchema),
  })

  useEffect(() => { if (open) { reset({ name: currentName }); update.reset() } }, [open, currentName])

  async function onSubmit({ name }: NameInput) {
    await update.mutateAsync({ section, categoryName: currentName, name })
    onClose()
  }

  return (
    <FormDialog open={open} title="Rename category" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
        <div className={styles.field}>
          <label className="field-label" htmlFor="edit-cat-name">New name</label>
          <input id="edit-cat-name" type="text" autoFocus maxLength={20}
            className={`field ${errors.name ? 'error' : ''}`}
            {...register('name')} />
          {errors.name && <span className="field-error">{errors.name.message}</span>}
        </div>
        {update.isError && <p className={styles.error}>Failed. Please try again.</p>}
        <div className={styles.actions}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : 'Save'}
          </button>
        </div>
      </form>
    </FormDialog>
  )
}
