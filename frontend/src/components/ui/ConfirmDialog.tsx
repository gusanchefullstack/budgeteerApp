import { Loader2 } from 'lucide-react'
import styles from './ConfirmDialog.module.css'

interface Props {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  variant?: 'danger' | 'default'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open, title, description, confirmLabel = 'Confirm',
  variant = 'default', loading = false, onConfirm, onCancel,
}: Props) {
  if (!open) return null

  return (
    <>
      <div className={styles.backdrop} onClick={onCancel} />
      <div className={styles.dialog} role="alertdialog" aria-modal>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
        <div className={styles.actions}>
          <button className="btn-ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Working…</> : confirmLabel}
          </button>
        </div>
      </div>
    </>
  )
}
