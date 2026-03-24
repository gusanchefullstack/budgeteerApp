import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from '@tanstack/react-router'
import { useCreateBudget } from '@/hooks/useCreateBudget'
import { ApiError } from '@/lib/api'
import styles from './CreationForm.module.css'

const quickSchema = z
  .object({
    name: z.string().regex(/^[a-zA-Z0-9 ]{1,50}$/, 'Max 50 alphanumeric characters'),
    beginningDate: z.string().min(1, 'Start date required'),
    endingDate: z.string().min(1, 'End date required'),
  })
  .refine((d) => new Date(d.endingDate) > new Date(d.beginningDate), {
    message: 'End date must be after start date',
    path: ['endingDate'],
  })

type QuickInput = z.infer<typeof quickSchema>

export function QuickCreateForm() {
  const router = useRouter()
  const createBudget = useCreateBudget()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QuickInput>({ resolver: zodResolver(quickSchema) })

  async function onSubmit(data: QuickInput) {
    try {
      await createBudget.mutateAsync({ ...data, incomes: [], expenses: [] })
      router.navigate({ to: '/dashboard' })
    } catch (err) {
      // handled via createBudget.isError
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
      <div className={styles.fieldGroup}>
        <label className="field-label" htmlFor="name">Budget name</label>
        <input
          id="name"
          type="text"
          autoFocus
          className={`field ${errors.name ? 'error' : ''}`}
          placeholder="e.g. My 2026 Budget"
          {...register('name')}
        />
        {errors.name && <span className="field-error">{errors.name.message}</span>}
      </div>

      <div className={styles.dateRow}>
        <div className={styles.fieldGroup}>
          <label className="field-label" htmlFor="beginningDate">Start date</label>
          <input
            id="beginningDate"
            type="date"
            className={`field ${errors.beginningDate ? 'error' : ''}`}
            {...register('beginningDate')}
          />
          {errors.beginningDate && <span className="field-error">{errors.beginningDate.message}</span>}
        </div>

        <div className={styles.fieldGroup}>
          <label className="field-label" htmlFor="endingDate">End date</label>
          <input
            id="endingDate"
            type="date"
            className={`field ${errors.endingDate ? 'error' : ''}`}
            {...register('endingDate')}
          />
          {errors.endingDate && <span className="field-error">{errors.endingDate.message}</span>}
        </div>
      </div>

      {createBudget.isError && (
        <div className={styles.serverError}>
          {createBudget.error instanceof ApiError && createBudget.error.status === 409
            ? 'You already have a budget. Only one budget is allowed per account.'
            : 'Failed to create budget. Please try again.'}
        </div>
      )}

      <div className={styles.formActions}>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : 'Create budget'}
        </button>
      </div>
    </form>
  )
}
