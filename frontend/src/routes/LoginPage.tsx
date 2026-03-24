import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useRouter } from '@tanstack/react-router'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useAuth } from '@/hooks/useAuth'
import { api, ApiError } from '@/lib/api'
import { loginSchema, type LoginInput, type AuthResponse } from '@/lib/schemas'
import styles from './AuthPage.module.css'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginInput) {
    setServerError(null)
    try {
      const res = await api.post<AuthResponse>('/auth/login', data)
      login(res.token, res.user)
      router.navigate({ to: '/dashboard' })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setServerError('Invalid username or password.')
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <AuthLayout>
      <div className={styles.header}>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to your account</p>
      </div>

      {serverError && (
        <div className={styles.serverError} role="alert">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
        {/* Username */}
        <div className={styles.field}>
          <label className="field-label" htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            autoFocus
            className={`field ${errors.username ? 'error' : ''}`}
            placeholder="your_username"
            {...register('username')}
          />
          {errors.username && (
            <span className="field-error">{errors.username.message}</span>
          )}
        </div>

        {/* Password */}
        <div className={styles.field}>
          <label className="field-label" htmlFor="password">Password</label>
          <div className={styles.passwordWrap}>
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              className={`field ${styles.passwordInput} ${errors.password ? 'error' : ''}`}
              placeholder="••••••••"
              {...register('password')}
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <span className="field-error">{errors.password.message}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`btn-primary ${styles.submitBtn}`}
        >
          {isSubmitting
            ? <><Loader2 size={15} className="animate-spin" /> Signing in…</>
            : 'Sign in'
          }
        </button>
      </form>

      <p className={styles.switchLink}>
        Don't have an account?{' '}
        <Link to="/register" className={styles.link}>Create one</Link>
      </p>
    </AuthLayout>
  )
}
