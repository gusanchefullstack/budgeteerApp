import { useState } from 'react'
import { User, AtSign, Hash, Shield, AlertTriangle, LogOut } from 'lucide-react'
import { useRouter } from '@tanstack/react-router'
import { useMe, useDeleteAccount } from '@/hooks/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageSpinner } from '@/components/layout/PageSpinner'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const { data: user, isLoading } = useMe()
  const deleteAccount = useDeleteAccount()
  const { logout } = useAuth()
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (isLoading) return <PageSpinner />

  async function handleDeleteAccount() {
    await deleteAccount.mutateAsync()
    logout()
    queryClient.clear()
    router.navigate({ to: '/login' })
  }

  async function handleLogout() {
    try { await api.post('/auth/logout') } catch { /* stateless */ }
    logout()
    queryClient.clear()
    router.navigate({ to: '/login' })
  }

  return (
    <div className={styles.root}>
      {/* ── Page header ── */}
      <header className={styles.header}>
        <h1 className={styles.title}>Profile</h1>
        <p className={styles.subtitle}>Your account information and settings.</p>
      </header>

      {/* ── Identity card ── */}
      <section className={styles.card}>
        <div className={styles.avatar}>
          {user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '??'}
        </div>

        <div className={styles.identity}>
          <h2 className={styles.fullName}>
            {user ? `${user.firstName} ${user.lastName}` : '—'}
          </h2>
          <span className={styles.usernamePill}>
            <AtSign size={12} strokeWidth={2} />
            {user?.username ?? '—'}
          </span>
        </div>
      </section>

      {/* ── Details grid ── */}
      <section className={styles.detailsCard}>
        <h3 className={styles.sectionLabel}>Account details</h3>
        <div className={styles.detailGrid}>
          <DetailRow icon={<User size={15} />} label="First name" value={user?.firstName} />
          <DetailRow icon={<User size={15} />} label="Last name" value={user?.lastName} />
          <DetailRow icon={<AtSign size={15} />} label="Username" value={user?.username} mono />
          <DetailRow icon={<Hash size={15} />} label="User ID" value={user?.id} mono truncate />
        </div>
      </section>

      {/* ── Security section ── */}
      <section className={styles.detailsCard}>
        <h3 className={styles.sectionLabel}>Security</h3>
        <div className={styles.securityRow}>
          <div className={styles.securityInfo}>
            <Shield size={16} className={styles.securityIcon} />
            <div>
              <p className={styles.securityTitle}>Password</p>
              <p className={styles.securityDesc}>Authentication uses username + password.</p>
            </div>
          </div>
          <span className={styles.badge}>Active</span>
        </div>
      </section>

      {/* ── Actions ── */}
      <section className={styles.actionsCard}>
        <button className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={handleLogout}>
          <LogOut size={15} />
          Sign out of this session
        </button>
      </section>

      {/* ── Danger zone ── */}
      <section className={styles.dangerCard}>
        <div className={styles.dangerHeader}>
          <AlertTriangle size={16} className={styles.dangerIcon} />
          <h3 className={styles.dangerTitle}>Danger zone</h3>
        </div>
        <p className={styles.dangerDesc}>
          Permanently delete your account, your budget, and all associated transactions.
          This action <strong>cannot be undone</strong>.
        </p>
        <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>
          Delete my account
        </button>
      </section>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete your account?"
        description="All your data — budget, transactions, and profile — will be permanently erased. This cannot be undone."
        confirmLabel="Yes, delete everything"
        variant="danger"
        loading={deleteAccount.isPending}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}

interface DetailRowProps {
  icon: React.ReactNode
  label: string
  value?: string
  mono?: boolean
  truncate?: boolean
}

function DetailRow({ icon, label, value, mono, truncate }: DetailRowProps) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailIcon}>{icon}</span>
      <span className={styles.detailLabel}>{label}</span>
      <span className={`${styles.detailValue} ${mono ? styles.mono : ''} ${truncate ? styles.truncate : ''}`}>
        {value ?? '—'}
      </span>
    </div>
  )
}
