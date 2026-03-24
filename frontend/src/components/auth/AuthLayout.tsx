import type { ReactNode } from 'react'
import styles from './AuthLayout.module.css'

interface Props {
  children: ReactNode
}

export function AuthLayout({ children }: Props) {
  return (
    <div className={styles.root}>
      {/* Ambient background blobs */}
      <div className={styles.blob1} aria-hidden />
      <div className={styles.blob2} aria-hidden />
      <div className={styles.blob3} aria-hidden />

      {/* Grid overlay */}
      <div className={styles.grid} aria-hidden />

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoMark}>B</span>
          <span className={styles.logoText}>udgeteer</span>
        </div>

        {children}
      </div>

      {/* Bottom tagline */}
      <p className={styles.tagline}>
        Your finances, finally under control.
      </p>
    </div>
  )
}
