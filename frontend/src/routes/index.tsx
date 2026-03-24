import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { isAuthenticated } from '@/lib/auth'
import { PageSpinner } from '@/components/layout/PageSpinner'

// ─── Lazy page imports (bundle splitting) ─────────────────────────────────────

const LoginPage      = lazy(() => import('@/routes/LoginPage'))
const RegisterPage   = lazy(() => import('@/routes/RegisterPage'))
const DashboardPage  = lazy(() => import('@/routes/DashboardPage'))
const BudgetNewPage  = lazy(() => import('@/routes/BudgetNewPage'))
const ProfilePage    = lazy(() => import('@/routes/ProfilePage'))

// ─── Auth guard helper ────────────────────────────────────────────────────────

function requireAuth() {
  if (!isAuthenticated()) throw redirect({ to: '/login' })
}

function requireGuest() {
  if (isAuthenticated()) throw redirect({ to: '/dashboard' })
}

// ─── Routes ───────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => (
    <Suspense fallback={<PageSpinner />}>
      <Outlet />
    </Suspense>
  ),
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: requireGuest,
  component: () => <LoginPage />,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  beforeLoad: requireGuest,
  component: () => <RegisterPage />,
})

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  beforeLoad: requireAuth,
  component: AppShell,
})

const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/dashboard',
  component: () => <DashboardPage />,
})

const budgetNewRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/budget/new',
  validateSearch: (s: Record<string, unknown>) => ({
    mode: (s['mode'] as 'tree' | 'wizard' | 'quick') ?? 'wizard',
  }),
  component: () => <BudgetNewPage />,
})

const profileRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/profile',
  component: () => <ProfilePage />,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: isAuthenticated() ? '/dashboard' : '/login' })
  },
})

// ─── Router ───────────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  appRoute.addChildren([dashboardRoute, budgetNewRoute, profileRoute]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
