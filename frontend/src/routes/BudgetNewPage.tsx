import { lazy, Suspense } from 'react'
import { useSearch, Link } from '@tanstack/react-router'
import { ArrowLeft, Layers, Wand2, FileText } from 'lucide-react'
import { PageSpinner } from '@/components/layout/PageSpinner'
import styles from './BudgetNewPage.module.css'

const QuickCreateForm  = lazy(() => import('@/components/budget/creation/QuickCreateForm').then((m) => ({ default: m.QuickCreateForm })))
const WizardCreateForm = lazy(() => import('@/components/budget/creation/WizardCreateForm').then((m) => ({ default: m.WizardCreateForm })))
const TreeCreateForm   = lazy(() => import('@/components/budget/creation/TreeCreateForm').then((m) => ({ default: m.TreeCreateForm })))

const MODE_META = {
  tree: {
    icon: <Layers size={18} strokeWidth={1.5} />,
    title: 'Full Tree Builder',
    subtitle: 'Design your complete budget hierarchy in one editor. Drag categories to reorder.',
  },
  wizard: {
    icon: <Wand2 size={18} strokeWidth={1.5} />,
    title: 'Step-by-Step Wizard',
    subtitle: 'Follow a guided flow through basics, income, expenses, and review.',
  },
  quick: {
    icon: <FileText size={18} strokeWidth={1.5} />,
    title: 'Quick Start',
    subtitle: 'Create your budget with just a name and date range — add details later.',
  },
}

export default function BudgetNewPage() {
  const { mode } = useSearch({ from: '/app/budget/new' })
  const meta = MODE_META[mode] ?? MODE_META.wizard

  return (
    <div className={styles.root}>
      {/* Back */}
      <Link to="/dashboard" className={styles.backLink}>
        <ArrowLeft size={14} /> Dashboard
      </Link>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.modeIcon}>{meta.icon}</div>
        <div>
          <h1 className={styles.title}>{meta.title}</h1>
          <p className={styles.subtitle}>{meta.subtitle}</p>
        </div>
      </header>

      {/* Mode switcher */}
      <div className={styles.modeTabs}>
        {(Object.keys(MODE_META) as Array<keyof typeof MODE_META>).map((m) => (
          <Link
            key={m}
            to="/budget/new"
            search={{ mode: m }}
            className={`${styles.modeTab} ${mode === m ? styles.modeTabActive : ''}`}
          >
            {MODE_META[m].icon}
            <span>{MODE_META[m].title}</span>
          </Link>
        ))}
      </div>

      {/* Form */}
      <div className={styles.formWrap}>
        <Suspense fallback={<PageSpinner />}>
          {mode === 'tree'   && <TreeCreateForm />}
          {mode === 'wizard' && <WizardCreateForm />}
          {mode === 'quick'  && <QuickCreateForm />}
        </Suspense>
      </div>
    </div>
  )
}
