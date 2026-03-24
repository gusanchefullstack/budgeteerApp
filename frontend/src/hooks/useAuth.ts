import { createContext, useContext } from 'react'
import type { User } from '@/lib/schemas'

export interface AuthContext {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: boolean
}

export const AuthCtx = createContext<AuthContext | null>(null)

export function useAuth(): AuthContext {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
