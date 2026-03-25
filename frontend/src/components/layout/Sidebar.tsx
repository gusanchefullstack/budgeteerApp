import { Link, useRouter } from '@tanstack/react-router'
import {
  LayoutDashboard,
  PlusCircle,
  User,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from './ThemeProvider'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/budget/new', icon: PlusCircle, label: 'New Budget' },
  { to: '/profile', icon: User, label: 'Profile' },
] as const

export function Sidebar() {
  const { logout } = useAuth()
  const router = useRouter()
  const { theme, toggle } = useTheme()

  async function handleLogout() {
    try { await api.post('/auth/logout') } catch { /* stateless — ignore */ }
    logout()
    queryClient.clear()
    router.navigate({ to: '/login' })
  }

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoMark}>B</span>
        <span className={styles.logoText}>udgeteer</span>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to} className={styles.navItem} activeProps={{ className: styles.navItemActive }}>
            <Icon size={17} strokeWidth={1.75} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Theme toggle */}
      <button className={styles.themeBtn} onClick={toggle} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun size={17} strokeWidth={1.75} /> : <Moon size={17} strokeWidth={1.75} />}
        <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
      </button>

      {/* Logout */}
      <button className={styles.logoutBtn} onClick={handleLogout}>
        <LogOut size={17} strokeWidth={1.75} />
        <span>Sign out</span>
      </button>
    </aside>
  )
}
