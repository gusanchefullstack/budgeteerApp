import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Loader2 } from 'lucide-react'
import type { Budget, CreateTransactionInput } from '@/lib/schemas'
import { createTransactionSchema } from '@/lib/schemas'
import { useCreateTransaction } from '@/hooks/useTransactions'
import styles from './AddTransactionDrawer.module.css'

interface Props {
  open: boolean
  onClose: () => void
  budget: Budget
}

export function AddTransactionDrawer({ open, onClose, budget }: Props) {
  const createTx = useCreateTransaction()

  const allItems = [
    ...budget.incomes.flatMap((cat) =>
      cat.budgetGroups.flatMap((grp) =>
        grp.budgetItems.map((item) => ({
          category: cat.name,
          group: grp.name,
          item: item.name,
          type: 'income' as const,
          currency: item.currency,
        })),
      ),
    ),
    ...budget.expenses.flatMap((cat) =>
      cat.budgetGroups.flatMap((grp) =>
        grp.budgetItems.map((item) => ({
          category: cat.name,
          group: grp.name,
          item: item.name,
          type: 'expense' as const,
          currency: item.currency,
        })),
      ),
    ),
  ]

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: { txcurrency: 'USD' },
  })

  const selectedItem = watch('txitem')
  const matchedItem = allItems.find((i) => i.item === selectedItem)

  function handleItemChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    const found = allItems.find((i) => i.item === val)
    if (found) {
      setValue('txitem', found.item)
      setValue('txcategory', found.category)
      setValue('txgroup', found.group)
      setValue('txtype', found.type)
      setValue('txcurrency', found.currency)
    }
  }

  async function onSubmit(data: CreateTransactionInput) {
    await createTx.mutateAsync(data)
    reset()
    onClose()
  }

  if (!open) return null

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <aside className={styles.drawer}>
        <div className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>Add transaction</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {createTx.isError && (
          <div className={styles.error}>Failed to create transaction. Please try again.</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
          {/* Budget item selector */}
          <div>
            <label className="field-label">Budget item</label>
            <select className={`field ${!selectedItem && errors.txitem ? 'error' : ''}`} onChange={handleItemChange} defaultValue="">
              <option value="" disabled>Select an item…</option>
              <optgroup label="Incomes">
                {allItems.filter((i) => i.type === 'income').map((i) => (
                  <option key={`${i.category}-${i.group}-${i.item}`} value={i.item}>
                    {i.category} › {i.group} › {i.item}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Expenses">
                {allItems.filter((i) => i.type === 'expense').map((i) => (
                  <option key={`${i.category}-${i.group}-${i.item}`} value={i.item}>
                    {i.category} › {i.group} › {i.item}
                  </option>
                ))}
              </optgroup>
            </select>
            {/* hidden fields auto-populated */}
            <input type="hidden" {...register('txitem')} />
            <input type="hidden" {...register('txcategory')} />
            <input type="hidden" {...register('txgroup')} />
            <input type="hidden" {...register('txtype')} />
            {errors.txitem && <span className="field-error">{errors.txitem.message}</span>}
          </div>

          {/* Date/time */}
          <div>
            <label className="field-label" htmlFor="txdatetime">Date & time</label>
            <input
              id="txdatetime"
              type="datetime-local"
              className={`field ${errors.txdatetime ? 'error' : ''}`}
              {...register('txdatetime')}
            />
            {errors.txdatetime && <span className="field-error">{errors.txdatetime.message}</span>}
          </div>

          {/* Amount + currency */}
          <div className={styles.row}>
            <div style={{ flex: 1 }}>
              <label className="field-label" htmlFor="txamount">Amount</label>
              <input
                id="txamount"
                type="number"
                step="0.01"
                min="0.01"
                className={`field ${errors.txamount ? 'error' : ''}`}
                placeholder="0.00"
                {...register('txamount', { valueAsNumber: true })}
              />
              {errors.txamount && <span className="field-error">{errors.txamount.message}</span>}
            </div>
            <div style={{ width: 90 }}>
              <label className="field-label" htmlFor="txcurrency">Currency</label>
              <input
                id="txcurrency"
                type="text"
                maxLength={3}
                className={`field ${errors.txcurrency ? 'error' : ''}`}
                placeholder="USD"
                readOnly={!!matchedItem}
                {...register('txcurrency')}
              />
            </div>
          </div>

          {/* Auto-populated readonly summary */}
          {selectedItem && matchedItem && (
            <div className={styles.summary}>
              <span className={`badge badge-${matchedItem.type}`}>{matchedItem.type}</span>
              <span className={styles.summaryText}>
                {matchedItem.category} › {matchedItem.group} › {matchedItem.item}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`btn-primary ${styles.submitBtn}`}
          >
            {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Add transaction'}
          </button>
        </form>
      </aside>
    </>
  )
}
