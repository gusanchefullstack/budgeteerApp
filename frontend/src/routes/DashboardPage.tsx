import { Link } from '@tanstack/react-router'
import { Layers, Wand2, FileText } from 'lucide-react'
import { useBudget } from '@/hooks/useBudget'
import { BudgetDashboard } from '@/components/budget/BudgetDashboard'
import { PageSpinner } from '@/components/layout/PageSpinner'
import styles from './DashboardPage.module.css'

export default function DashboardPage() {
  const { data: budget, isLoading, isError } = useBudget()

  if (isLoading) return <PageSpinner />

  if (isError) {
    return (
      <div className={styles.errorState}>
        <p>Could not load your budget. Please try again.</p>
      </div>
    )
  }

  if (!budget) return <NoBudgetState />

  return <BudgetDashboard budget={budget} />
}

function NoBudgetState() {
  return (
    <div className={styles.emptyRoot}>
      <div className={styles.emptyHeader}>
        <h1 className={styles.emptyTitle}>Your budget awaits</h1>
        <p className={styles.emptySubtitle}>
          Choose how you'd like to get started.
        </p>
      </div>

      <div className={styles.modeGrid}>
        <Link to="/budget/new" search={{ mode: 'tree' }} className={styles.modeCard}>
          <div className={`${styles.modeIcon} ${styles.modeIconTree}`}>
            <Layers size={28} strokeWidth={1.5} />
          </div>
          <h2 className={styles.modeTitle}>Full Tree</h2>
          <p className={styles.modeDesc}>
            Design the complete budget hierarchy — categories, groups, and items — in one visual editor.
          </p>
          <span className={styles.modeCta}>Get started →</span>
        </Link>

        <Link to="/budget/new" search={{ mode: 'wizard' }} className={`${styles.modeCard} ${styles.modeCardFeatured}`}>
          <div className={`${styles.modeIcon} ${styles.modeIconWizard}`}>
            <Wand2 size={28} strokeWidth={1.5} />
          </div>
          <h2 className={styles.modeTitle}>Step-by-Step</h2>
          <p className={styles.modeDesc}>
            Follow a guided wizard that walks you through each section at your own pace.
          </p>
          <span className={styles.modeCta}>Start wizard →</span>
        </Link>

        <Link to="/budget/new" search={{ mode: 'quick' }} className={styles.modeCard}>
          <div className={`${styles.modeIcon} ${styles.modeIconQuick}`}>
            <FileText size={28} strokeWidth={1.5} />
          </div>
          <h2 className={styles.modeTitle}>Quick Start</h2>
          <p className={styles.modeDesc}>
            Enter just a name and date range now, then fill in the details later from your dashboard.
          </p>
          <span className={styles.modeCta}>Quick start →</span>
        </Link>
      </div>
    </div>
  )
}
