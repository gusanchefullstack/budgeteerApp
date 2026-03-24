import { useState } from 'react'
import {
  ChevronDown, ChevronRight, TrendingUp, TrendingDown,
  Plus, Pencil, Trash2, MoreHorizontal,
} from 'lucide-react'
import type { Budget, BudgetCategory, BudgetGroup, BudgetItem, Section } from '@/lib/schemas'
import { formatCurrency, capitalize } from '@/lib/utils'
import { useDeleteCategory, useDeleteGroup, useDeleteItem } from '@/hooks/useBudgetCRUD'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AddCategoryModal, EditCategoryModal } from './CategoryModals'
import { AddGroupModal, EditGroupModal } from './GroupModals'
import { AddItemModal, EditItemModal } from './ItemModals'
import styles from './BudgetTree.module.css'

interface Props { budget: Budget }

export function BudgetTree({ budget }: Props) {
  return (
    <div className={styles.root}>
      <h2 className={styles.sectionTitle}>Budget structure</h2>
      <div className={styles.columns}>
        <TreeSection budget={budget} section="incomes"
          categories={budget.incomes}
          icon={<TrendingUp size={15} strokeWidth={1.75} />} />
        <TreeSection budget={budget} section="expenses"
          categories={budget.expenses}
          icon={<TrendingDown size={15} strokeWidth={1.75} />} />
      </div>
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

interface TreeSectionProps {
  budget: Budget
  section: Section
  categories: BudgetCategory[]
  icon: React.ReactNode
}

function TreeSection({ budget, section, categories, icon }: TreeSectionProps) {
  const [addOpen, setAddOpen] = useState(false)
  const variant = section === 'incomes' ? 'income' : 'expense'
  const title = section === 'incomes' ? 'Incomes' : 'Expenses'

  return (
    <div className={styles.column}>
      <div className={`${styles.columnHeader} ${styles[`columnHeader_${variant}`]}`}>
        {icon}
        <span>{title}</span>
        <span className={styles.columnCount}>{categories.length}</span>
        <button className={styles.addBtn} onClick={() => setAddOpen(true)} aria-label={`Add ${variant} category`}>
          <Plus size={13} />
        </button>
      </div>

      {categories.length === 0 ? (
        <button className={styles.emptyAdd} onClick={() => setAddOpen(true)}>
          <Plus size={14} /> Add a category
        </button>
      ) : (
        <div className={styles.categoryList}>
          {categories.map((cat, i) => (
            <CategoryNode key={cat.name} budget={budget} category={cat} section={section} delay={i * 40} />
          ))}
        </div>
      )}

      <AddCategoryModal open={addOpen} budgetId={budget.id} section={section} onClose={() => setAddOpen(false)} />
    </div>
  )
}

// ─── Category node ────────────────────────────────────────────────────────────

interface CategoryNodeProps {
  budget: Budget
  category: BudgetCategory
  section: Section
  delay: number
}

function CategoryNode({ budget, category, section, delay }: CategoryNodeProps) {
  const [open, setOpen] = useState(true)
  const [menu, setMenu] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [addGroupOpen, setAddGroupOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteCategory = useDeleteCategory(budget.id)

  const variant = section === 'incomes' ? 'income' : 'expense'
  const totalPlanned = category.budgetGroups.flatMap((g) => g.budgetItems)
    .flatMap((i) => i.buckets).reduce((s, b) => s + b.plannedAmount, 0)

  async function handleDelete() {
    await deleteCategory.mutateAsync({ section, categoryName: category.name })
    setDeleteOpen(false)
  }

  return (
    <div className={styles.categoryNode} style={{ animationDelay: `${delay}ms` }}>
      <div className={styles.categoryHeader}>
        <button className={styles.chevronBtn} onClick={() => setOpen((o) => !o)}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <span className={styles.categoryName}>{category.name}</span>
        <span className={`${styles.categoryTotal} ${styles[`total_${variant}`]}`}>
          {formatCurrency(totalPlanned)}
        </span>
        <div className={styles.menuWrap}>
          <button className="btn-icon" onClick={() => setMenu((v) => !v)} aria-label="Category actions">
            <MoreHorizontal size={14} />
          </button>
          {menu && (
            <NodeMenu
              onClose={() => setMenu(false)}
              onEdit={() => { setMenu(false); setEditOpen(true) }}
              onAddChild={() => { setMenu(false); setAddGroupOpen(true) }}
              onDelete={() => { setMenu(false); setDeleteOpen(true) }}
              addLabel="Add group"
            />
          )}
        </div>
      </div>

      {open && (
        <div className={styles.groupList}>
          {category.budgetGroups.map((grp) => (
            <GroupNode key={grp.name} budget={budget} group={grp} category={category} section={section} />
          ))}
        </div>
      )}

      <EditCategoryModal open={editOpen} budgetId={budget.id} section={section}
        currentName={category.name} onClose={() => setEditOpen(false)} />
      <AddGroupModal open={addGroupOpen} budgetId={budget.id} section={section}
        categoryName={category.name} onClose={() => setAddGroupOpen(false)} />
      <ConfirmDialog open={deleteOpen}
        title={`Delete "${category.name}"?`}
        description="This will delete the category, all its groups, items, and associated transactions."
        confirmLabel="Delete" variant="danger"
        loading={deleteCategory.isPending}
        onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />
    </div>
  )
}

// ─── Group node ───────────────────────────────────────────────────────────────

interface GroupNodeProps {
  budget: Budget
  group: BudgetGroup
  category: BudgetCategory
  section: Section
}

function GroupNode({ budget, group, category, section }: GroupNodeProps) {
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteGroup = useDeleteGroup(budget.id)

  const totalPlanned = group.budgetItems.flatMap((i) => i.buckets).reduce((s, b) => s + b.plannedAmount, 0)

  async function handleDelete() {
    await deleteGroup.mutateAsync({ section, categoryName: category.name, groupName: group.name })
    setDeleteOpen(false)
  }

  return (
    <div className={styles.groupNode}>
      <div className={styles.groupHeader}>
        <button className={styles.chevronBtn} onClick={() => setOpen((o) => !o)}>
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        <span className={styles.groupName}>{group.name}</span>
        <span className={styles.groupTotal}>{formatCurrency(totalPlanned)}</span>
        <div className={styles.menuWrap}>
          <button className="btn-icon" onClick={() => setMenu((v) => !v)} aria-label="Group actions">
            <MoreHorizontal size={13} />
          </button>
          {menu && (
            <NodeMenu
              onClose={() => setMenu(false)}
              onEdit={() => { setMenu(false); setEditOpen(true) }}
              onAddChild={() => { setMenu(false); setAddItemOpen(true) }}
              onDelete={() => { setMenu(false); setDeleteOpen(true) }}
              addLabel="Add item"
            />
          )}
        </div>
      </div>

      {open && (
        <div className={styles.itemList}>
          {group.budgetItems.map((item) => (
            <ItemNode key={item.name} budget={budget} item={item}
              group={group} category={category} section={section} />
          ))}
        </div>
      )}

      <EditGroupModal open={editOpen} budgetId={budget.id} section={section}
        categoryName={category.name} currentName={group.name} onClose={() => setEditOpen(false)} />
      <AddItemModal open={addItemOpen} budgetId={budget.id} section={section}
        categoryName={category.name} groupName={group.name} onClose={() => setAddItemOpen(false)} />
      <ConfirmDialog open={deleteOpen}
        title={`Delete "${group.name}"?`}
        description="This will delete the group, all its items, and associated transactions."
        confirmLabel="Delete" variant="danger"
        loading={deleteGroup.isPending}
        onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />
    </div>
  )
}

// ─── Item node ────────────────────────────────────────────────────────────────

interface ItemNodeProps {
  budget: Budget
  item: BudgetItem
  group: BudgetGroup
  category: BudgetCategory
  section: Section
}

function ItemNode({ budget, item, group, category, section }: ItemNodeProps) {
  const [menu, setMenu] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteItem = useDeleteItem(budget.id)

  const variant = section === 'incomes' ? 'income' : 'expense'
  const plannedTotal = item.buckets.reduce((s, b) => s + b.plannedAmount, 0)
  const actualTotal = item.buckets.reduce((s, b) => s + b.currentAmount, 0)
  const progress = plannedTotal > 0 ? Math.min(1, actualTotal / plannedTotal) : 0

  async function handleDelete() {
    await deleteItem.mutateAsync({ section, categoryName: category.name, groupName: group.name, itemName: item.name })
    setDeleteOpen(false)
  }

  return (
    <div className={styles.itemNode}>
      <div className={styles.itemHeader}>
        <span className={styles.itemName}>{item.name}</span>
        <span className={`${styles.itemFrequency} badge badge-neutral`}>{capitalize(item.frequency)}</span>
        <span className={`${styles.itemAmount} ${styles[`total_${variant}`]}`}>
          {formatCurrency(plannedTotal, item.currency)}
        </span>
        <div className={styles.menuWrap}>
          <button className="btn-icon" onClick={() => setMenu((v) => !v)} aria-label="Item actions">
            <MoreHorizontal size={13} />
          </button>
          {menu && (
            <NodeMenu
              onClose={() => setMenu(false)}
              onEdit={() => { setMenu(false); setEditOpen(true) }}
              onDelete={() => { setMenu(false); setDeleteOpen(true) }}
            />
          )}
        </div>
      </div>
      <div className={styles.progressBar}>
        <div className={`${styles.progressFill} ${styles[`progressFill_${variant}`]}`}
          style={{ width: `${progress * 100}%` }} />
      </div>
      <div className={styles.itemFooter}>
        <span className={styles.itemActual}>{formatCurrency(actualTotal, item.currency)} actual</span>
        <span className={styles.itemActual}>{Math.round(progress * 100)}%</span>
      </div>

      <EditItemModal open={editOpen} budgetId={budget.id} section={section}
        categoryName={category.name} groupName={group.name} item={item}
        onClose={() => setEditOpen(false)} />
      <ConfirmDialog open={deleteOpen}
        title={`Delete "${item.name}"?`}
        description="This will delete the item and all its associated transactions."
        confirmLabel="Delete" variant="danger"
        loading={deleteItem.isPending}
        onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />
    </div>
  )
}

// ─── Shared context menu ──────────────────────────────────────────────────────

interface NodeMenuProps {
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onAddChild?: () => void
  addLabel?: string
}

function NodeMenu({ onClose, onEdit, onDelete, onAddChild, addLabel }: NodeMenuProps) {
  return (
    <>
      <div className={styles.menuBackdrop} onClick={onClose} />
      <div className={styles.menu}>
        {onAddChild && (
          <button className={styles.menuItem} onClick={onAddChild}>
            <Plus size={13} /> {addLabel}
          </button>
        )}
        <button className={styles.menuItem} onClick={onEdit}>
          <Pencil size={13} /> Rename
        </button>
        <div className={styles.menuDivider} />
        <button className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={onDelete}>
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </>
  )
}
