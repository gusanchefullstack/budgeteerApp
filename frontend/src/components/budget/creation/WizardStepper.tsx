import { Check } from 'lucide-react'
import styles from './WizardStepper.module.css'

interface Step {
  label: string
  description: string
}

interface Props {
  steps: Step[]
  current: number
}

export function WizardStepper({ steps, current }: Props) {
  return (
    <div className={styles.root}>
      {steps.map((step, idx) => {
        const done = idx < current
        const active = idx === current
        return (
          <div key={step.label} className={styles.stepWrap}>
            <div className={`${styles.step} ${done ? styles.done : active ? styles.active : styles.pending}`}>
              <div className={styles.indicator}>
                {done ? <Check size={14} strokeWidth={2.5} /> : <span>{idx + 1}</span>}
              </div>
              <div className={styles.labels}>
                <span className={styles.label}>{step.label}</span>
                <span className={styles.desc}>{step.description}</span>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div className={`${styles.connector} ${done ? styles.connectorDone : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
