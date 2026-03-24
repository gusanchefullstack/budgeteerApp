import { useState } from 'react'
import { TrendingUp, TrendingDown, Scale, Plus, Trash2, Pencil } from 'lucide-react'
import { useRouter } from '@tanstack/react-router'
import type { Budget } from '@/lib/schemas'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useDeleteBudget } from '@/hooks/useBudget'
import { BudgetTree } from './BudgetTree'
import { EditBudgetModal } from './EditBudgetModal'
import { TransactionPanel } from '../txn/TransactionPanel'
import { AddTransactionDrawer } from '../txn/AddTransactionDrawer'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import styles from './BudgetDashboard.module.css'

interface Props { budget: Budget }

function sumPlanned(categories: Budget['incomes']): number {
  return categories.flatMap((c) => c.budgetGroups).flatMap((g) => g.budgetItems)
    .flatMap((item) => item.buckets)
    .reduce((acc, b) => acc + b.plannedAmount, 0)
}

function sumActual(categories: Budget['incomes']): number {
  return categories.flatMap((c) => c.budgetGroups).flatMap((g) => g.budgetItems)
    .flatMap((i) => i.buckets).reduce((acc, b) => acc + b.currentAmount, 0)
}

export function BudgetDashboard({ budget }: Props) {
  const router = useRouter()
  const deleteBudget = useDeleteBudget()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAddTx, setShowAddTx] = useState(false)
  const [showEditBudget, setShowEditBudget] = useState(false)

  const plannedIncome  = sumPlanned(budget.incomes)
  const plannedExpense = sumPlanned(budget.expenses)
  const actualIncome   = sumActual(budget.incomes)
  const actualExpense  = sumActual(budget.expenses)
  const plannedBalance = plannedIncome - plannedExpense
  const actualBalance  = actualIncome - actualExpense

  async function handleDelete() {
    await deleteBudget.mutateAsync(budget.id)
    router.navigate({ to: '/dashboard' })
  }

  return (
    <div className={styles.root}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.budgetName}>{budget.name}</h1>
          <span className={styles.dateRange}>
            {formatDate(budget.beginningDate)} – {formatDate(budget.endingDate)}
          </span>
        </div>
        <div className={styles.headerActions}>
          <button className="btn-ghost" onClick={() => setShowEditBudget(true)}>
            <Pencil size={14} />
            Edit
          </button>
          <button className="btn-primary" onClick={() => setShowAddTx(true)}>
            <Plus size={15} />
            Add transaction
          </button>
          <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </header>

      {/* ── Summary cards ── */}
      <div className={styles.summaryGrid}>
        <SummaryCard
          label="Planned income"
          planned={plannedIncome}
          actual={actualIncome}
          variant="income"
          icon={<TrendingUp size={18} strokeWidth={1.75} />}
          delay={0}
        />
        <SummaryCard
          label="Planned expenses"
          planned={plannedExpense}
          actual={actualExpense}
          variant="expense"
          icon={<TrendingDown size={18} strokeWidth={1.75} />}
          delay={80}
        />
        <SummaryCard
          label="Balance"
          planned={plannedBalance}
          actual={actualBalance}
          variant={plannedBalance >= 0 ? 'income' : 'expense'}
          icon={<Scale size={18} strokeWidth={1.75} />}
          delay={160}
        />
      </div>

      {/* ── Budget tree ── */}
      <div className={styles.treeSection}>
        <BudgetTree budget={budget} />
      </div>

      {/* ── Transactions ── */}
      <div className={styles.txSection}>
        <TransactionPanel budgetId={budget.id} budget={budget} />
      </div>

      {/* ── Modals ── */}
      <EditBudgetModal open={showEditBudget} budget={budget} onClose={() => setShowEditBudget(false)} />

      <AddTransactionDrawer
        open={showAddTx}
        onClose={() => setShowAddTx(false)}
        budget={budget}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete budget?"
        description={`This will permanently delete "${budget.name}" and all its transactions. This cannot be undone.`}
        confirmLabel="Yes, delete"
        variant="danger"
        loading={deleteBudget.isPending}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}

interface SummaryCardProps {
  label: string
  planned: number
  actual: number
  variant: 'income' | 'expense'
  icon: React.ReactNode
  delay: number
}

function SummaryCard({ label, planned, actual, variant, icon, delay }: SummaryCardProps) {
  const currency = 'USD'
  return (
    <div
      className={`${styles.summaryCard} ${styles[`summaryCard_${variant}`]}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={styles.summaryIcon}>{icon}</div>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={styles.summaryAmount}>{formatCurrency(planned, currency)}</span>
      <span className={styles.summaryActual}>
        {formatCurrency(actual, currency)} actual
      </span>
    </div>
  )
}
