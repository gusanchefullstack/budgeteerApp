import { Trash2 } from 'lucide-react'
import type { DraftItem } from './types'
import { FREQUENCIES } from '@/lib/schemas'
import { capitalize } from '@/lib/utils'
import styles from './ItemEditor.module.css'

interface Props {
  item: DraftItem
  onChange: (updated: DraftItem) => void
  onRemove: () => void
}

export function ItemEditor({ item, onChange, onRemove }: Props) {
  function set<K extends keyof DraftItem>(key: K, value: DraftItem[K]) {
    onChange({ ...item, [key]: value })
  }

  return (
    <div className={styles.root}>
      <div className={styles.row}>
        {/* Name */}
        <div className={styles.fieldWide}>
          <label className="field-label">Item name</label>
          <input
            type="text"
            maxLength={20}
            className="field"
            placeholder="e.g. Salary"
            value={item.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>

        {/* Planned amount */}
        <div className={styles.fieldAmount}>
          <label className="field-label">Planned amount</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className="field"
            placeholder="0.00"
            value={item.plannedAmount || ''}
            onChange={(e) => set('plannedAmount', parseFloat(e.target.value) || 0)}
          />
        </div>

        {/* Currency */}
        <div className={styles.fieldCurrency}>
          <label className="field-label">Currency</label>
          <input
            type="text"
            maxLength={3}
            className="field"
            placeholder="USD"
            value={item.currency}
            onChange={(e) => set('currency', e.target.value.toUpperCase())}
          />
        </div>
      </div>

      <div className={styles.row}>
        {/* Planned date */}
        <div className={styles.fieldMid}>
          <label className="field-label">Planned date</label>
          <input
            type="date"
            className="field"
            value={item.plannedDate}
            onChange={(e) => set('plannedDate', e.target.value)}
          />
        </div>

        {/* Frequency */}
        <div className={styles.fieldMid}>
          <label className="field-label">Frequency</label>
          <select
            className="field"
            value={item.frequency}
            onChange={(e) => set('frequency', e.target.value as DraftItem['frequency'])}
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>{capitalize(f)}</option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div className={styles.fieldMid}>
          <label className="field-label">Type</label>
          <select
            className="field"
            value={item.type}
            onChange={(e) => set('type', e.target.value as DraftItem['type'])}
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        {/* Remove */}
        <button type="button" className={`btn-icon ${styles.removeBtn}`} onClick={onRemove} aria-label="Remove item">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
