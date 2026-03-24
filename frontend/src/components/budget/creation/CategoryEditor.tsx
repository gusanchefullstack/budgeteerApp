import { ChevronDown, ChevronRight, Plus, Trash2, GripVertical } from 'lucide-react'
import { useState } from 'react'
import type { DraftCategory, DraftGroup } from './types'
import { emptyGroup } from './types'
import { GroupEditor } from './GroupEditor'
import styles from './CategoryEditor.module.css'

interface Props {
  category: DraftCategory
  section: 'incomes' | 'expenses'
  onChange: (updated: DraftCategory) => void
  onRemove: () => void
  dragHandle?: React.HTMLAttributes<HTMLButtonElement>
}

export function CategoryEditor({ category, section, onChange, onRemove, dragHandle }: Props) {
  const [open, setOpen] = useState(true)
  const variant = section === 'incomes' ? 'income' : 'expense'

  function setName(name: string) { onChange({ ...category, name }) }

  function addGroup() {
    onChange({ ...category, budgetGroups: [...category.budgetGroups, emptyGroup()] })
  }

  function updateGroup(idx: number, updated: DraftGroup) {
    const groups = [...category.budgetGroups]
    groups[idx] = updated
    onChange({ ...category, budgetGroups: groups })
  }

  function removeGroup(idx: number) {
    onChange({ ...category, budgetGroups: category.budgetGroups.filter((_, i) => i !== idx) })
  }

  const totalItems = category.budgetGroups.reduce((s, g) => s + g.budgetItems.length, 0)

  return (
    <div className={`${styles.root} ${styles[`root_${variant}`]}`}>
      <div className={styles.header}>
        {dragHandle && (
          <button type="button" className={styles.grip} {...dragHandle} aria-label="Drag to reorder">
            <GripVertical size={14} />
          </button>
        )}
        <button type="button" className={styles.chevronBtn} onClick={() => setOpen((o) => !o)}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <input
          type="text"
          maxLength={20}
          className={`field ${styles.nameInput}`}
          placeholder="Category name"
          value={category.name}
          onChange={(e) => setName(e.target.value)}
        />
        <span className={styles.meta}>
          {category.budgetGroups.length}g · {totalItems}i
        </span>
        <button type="button" className="btn-icon" onClick={onRemove} aria-label="Remove category">
          <Trash2 size={14} style={{ color: 'var(--expense-base)' }} />
        </button>
      </div>

      {open && (
        <div className={styles.body}>
          <div className={styles.groupList}>
            {category.budgetGroups.map((grp, idx) => (
              <GroupEditor
                key={grp.uid}
                group={grp}
                section={section}
                onChange={(u) => updateGroup(idx, u)}
                onRemove={() => removeGroup(idx)}
              />
            ))}
          </div>
          <button type="button" className={`btn-ghost ${styles.addGroupBtn}`} onClick={addGroup}>
            <Plus size={13} /> Add group
          </button>
        </div>
      )}
    </div>
  )
}
