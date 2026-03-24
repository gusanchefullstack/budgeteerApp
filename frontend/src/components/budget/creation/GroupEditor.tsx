import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { DraftGroup, DraftItem } from './types'
import { emptyItem } from './types'
import { ItemEditor } from './ItemEditor'
import styles from './GroupEditor.module.css'

interface Props {
  group: DraftGroup
  section: 'incomes' | 'expenses'
  onChange: (updated: DraftGroup) => void
  onRemove: () => void
}

export function GroupEditor({ group, section, onChange, onRemove }: Props) {
  const [open, setOpen] = useState(true)
  const itemType = section === 'incomes' ? 'income' : 'expense'

  function setName(name: string) { onChange({ ...group, name }) }

  function addItem() {
    onChange({ ...group, budgetItems: [...group.budgetItems, emptyItem(itemType)] })
  }

  function updateItem(idx: number, updated: DraftItem) {
    const items = [...group.budgetItems]
    items[idx] = updated
    onChange({ ...group, budgetItems: items })
  }

  function removeItem(idx: number) {
    onChange({ ...group, budgetItems: group.budgetItems.filter((_, i) => i !== idx) })
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <button type="button" className={styles.chevronBtn} onClick={() => setOpen((o) => !o)}>
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        <input
          type="text"
          maxLength={20}
          className={`field ${styles.nameInput}`}
          placeholder="Group name"
          value={group.name}
          onChange={(e) => setName(e.target.value)}
        />
        <span className={styles.count}>{group.budgetItems.length} item{group.budgetItems.length !== 1 ? 's' : ''}</span>
        <button type="button" className="btn-icon" onClick={onRemove} aria-label="Remove group">
          <Trash2 size={13} style={{ color: 'var(--expense-base)' }} />
        </button>
      </div>

      {open && (
        <div className={styles.body}>
          <div className={styles.itemList}>
            {group.budgetItems.map((item, idx) => (
              <ItemEditor
                key={item.uid}
                item={item}
                onChange={(u) => updateItem(idx, u)}
                onRemove={() => removeItem(idx)}
              />
            ))}
          </div>
          <button type="button" className={`btn-ghost ${styles.addItemBtn}`} onClick={addItem}>
            <Plus size={13} /> Add item
          </button>
        </div>
      )}
    </div>
  )
}
