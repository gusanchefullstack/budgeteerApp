import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { z } from 'zod'
import { FormDialog } from '@/components/ui/FormDialog'
import { useUpdateBudgetMeta } from '@/hooks/useBudgetCRUD'
import type { Budget } from '@/lib/schemas'
import styles from './CrudModal.module.css'

const schema = z
  .object({
    name: z.string().regex(/^[a-zA-Z0-9 ]{1,50}$/, 'Max 50 alphanumeric characters'),
    beginningDate: z.string().min(1, 'Required'),
    endingDate: z.string().min(1, 'Required'),
  })
  .refine((d) => new Date(d.endingDate) > new Date(d.beginningDate), {
    message: 'End date must be after start date',
    path: ['endingDate'],
  })

type Input = z.infer<typeof schema>

interface Props {
  open: boolean
  budget: Budget
  onClose: () => void
}

export function EditBudgetModal({ open, budget, onClose }: Props) {
  const update = useUpdateBudgetMeta(budget.id)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Input>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open) {
      reset({
        name: budget.name,
        beginningDate: budget.beginningDate.split('T')[0],
        endingDate: budget.endingDate.split('T')[0],
      })
      update.reset()
    }
  }, [open])

  async function onSubmit(data: Input) {
    await update.mutateAsync(data)
    onClose()
  }

  return (
    <FormDialog open={open} title="Edit budget" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
        <div className={styles.field}>
          <label className="field-label" htmlFor="eb-name">Budget name</label>
          <input id="eb-name" type="text" className={`field ${errors.name ? 'error' : ''}`}
            {...register('name')} />
          {errors.name && <span className="field-error">{errors.name.message}</span>}
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className="field-label" htmlFor="eb-start">Start date</label>
            <input id="eb-start" type="date" className={`field ${errors.beginningDate ? 'error' : ''}`}
              {...register('beginningDate')} />
            {errors.beginningDate && <span className="field-error">{errors.beginningDate.message}</span>}
          </div>
          <div className={styles.field}>
            <label className="field-label" htmlFor="eb-end">End date</label>
            <input id="eb-end" type="date" className={`field ${errors.endingDate ? 'error' : ''}`}
              {...register('endingDate')} />
            {errors.endingDate && <span className="field-error">{errors.endingDate.message}</span>}
          </div>
        </div>

        {update.isError && <p className={styles.error}>Failed to update. Please try again.</p>}

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
