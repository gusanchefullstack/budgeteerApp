import { useState } from 'react'
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import type { Budget } from '@/lib/schemas'
import { useTransactions } from '@/hooks/useTransactions'
import { formatCurrency, formatDate } from '@/lib/utils'
import styles from './TransactionPanel.module.css'

interface Props {
  budgetId: string
  budget: Budget
}

interface Filters {
  txtype?: 'income' | 'expense'
  txcategory?: string
  startDate?: string
  endDate?: string
}

export function TransactionPanel({ budgetId, budget }: Props) {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Filters>({})
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading } = useTransactions(budgetId, { page, ...filters })

  const allCategories = [
    ...budget.incomes.map((c) => c.name),
    ...budget.expenses.map((c) => c.name),
  ]

  function applyFilters(next: Filters) {
    setFilters(next)
    setPage(1)
  }

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Transactions</h2>
        <button className="btn-ghost" onClick={() => setShowFilters((v) => !v)}>
          <Filter size={14} />
          Filters
        </button>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className={styles.filterBar}>
          <select
            className="field"
            value={filters.txtype ?? ''}
            onChange={(e) => applyFilters({ ...filters, txtype: e.target.value as 'income' | 'expense' || undefined })}
          >
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            className="field"
            value={filters.txcategory ?? ''}
            onChange={(e) => applyFilters({ ...filters, txcategory: e.target.value || undefined })}
          >
            <option value="">All categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <input
            type="date"
            className="field"
            value={filters.startDate ?? ''}
            onChange={(e) => applyFilters({ ...filters, startDate: e.target.value || undefined })}
            placeholder="Start date"
          />
          <input
            type="date"
            className="field"
            value={filters.endDate ?? ''}
            onChange={(e) => applyFilters({ ...filters, endDate: e.target.value || undefined })}
            placeholder="End date"
          />

          <button
            className="btn-ghost"
            onClick={() => applyFilters({})}
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrap}>
        {isLoading ? (
          <div className={styles.loading}>Loading…</div>
        ) : !data || data.data.length === 0 ? (
          <div className={styles.empty}>No transactions found.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Group</th>
                <th>Item</th>
                <th>Type</th>
                <th className={styles.right}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((tx) => (
                <tr key={tx.id}>
                  <td className={styles.mono}>{formatDate(tx.txdatetime)}</td>
                  <td>{tx.txcategory}</td>
                  <td className={styles.secondary}>{tx.txgroup}</td>
                  <td className={styles.secondary}>{tx.txitem}</td>
                  <td>
                    <span className={`badge badge-${tx.txtype}`}>{tx.txtype}</span>
                  </td>
                  <td className={`${styles.right} ${styles.mono} ${tx.txtype === 'income' ? styles.income : styles.expense}`}>
                    {formatCurrency(tx.txamount, tx.txcurrency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Page {data.page} of {data.totalPages} · {data.total} total
          </span>
          <button
            className="btn-icon"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="btn-icon"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
