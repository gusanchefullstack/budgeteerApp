import { useState, type ReactNode } from 'react'
import { AuthCtx } from '@/hooks/useAuth'
import { getToken, setToken, clearToken } from '@/lib/auth'
import type { User } from '@/lib/schemas'

interface Props { children: ReactNode }

export function AuthProvider({ children }: Props) {
  const [token, setTokenState] = useState<string | null>(getToken)
  const [user, setUser] = useState<User | null>(null)

  function login(newToken: string, newUser: User) {
    setToken(newToken)
    setTokenState(newToken)
    setUser(newUser)
  }

  function logout() {
    clearToken()
    setTokenState(null)
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthCtx.Provider>
  )
}
