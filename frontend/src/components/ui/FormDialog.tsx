import { type ReactNode } from 'react'
import { X } from 'lucide-react'
import styles from './FormDialog.module.css'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function FormDialog({ open, title, onClose, children }: Props) {
  if (!open) return null

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.dialog} role="dialog" aria-modal aria-label={title}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </>
  )
}
