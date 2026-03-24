import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useRouter } from '@tanstack/react-router'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useAuth } from '@/hooks/useAuth'
import { api, ApiError } from '@/lib/api'
import { registerSchema, type RegisterInput, type AuthResponse } from '@/lib/schemas'
import styles from './AuthPage.module.css'

export default function RegisterPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: RegisterInput) {
    setServerError(null)
    try {
      const { confirmPassword: _, ...payload } = data
      const res = await api.post<AuthResponse>('/auth/register', payload)
      login(res.token, res.user)
      router.navigate({ to: '/dashboard' })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setServerError('Username is already taken. Please choose another.')
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <AuthLayout>
      <div className={styles.header}>
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>Start managing your budget today</p>
      </div>

      {serverError && (
        <div className={styles.serverError} role="alert">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
        {/* Name row */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label className="field-label" htmlFor="firstName">First name</label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              autoFocus
              className={`field ${errors.firstName ? 'error' : ''}`}
              placeholder="Jane"
              {...register('firstName')}
            />
            {errors.firstName && (
              <span className="field-error">{errors.firstName.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className="field-label" htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              className={`field ${errors.lastName ? 'error' : ''}`}
              placeholder="Doe"
              {...register('lastName')}
            />
            {errors.lastName && (
              <span className="field-error">{errors.lastName.message}</span>
            )}
          </div>
        </div>

        {/* Username */}
        <div className={styles.field}>
          <label className="field-label" htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            className={`field ${errors.username ? 'error' : ''}`}
            placeholder="janedoe123"
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
              autoComplete="new-password"
              className={`field ${styles.passwordInput} ${errors.password ? 'error' : ''}`}
              placeholder="At least 8 characters"
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

        {/* Confirm password */}
        <div className={styles.field}>
          <label className="field-label" htmlFor="confirmPassword">Confirm password</label>
          <div className={styles.passwordWrap}>
            <input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              className={`field ${styles.passwordInput} ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="••••••••"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="field-error">{errors.confirmPassword.message}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`btn-primary ${styles.submitBtn}`}
        >
          {isSubmitting
            ? <><Loader2 size={15} className="animate-spin" /> Creating account…</>
            : 'Create account'
          }
        </button>
      </form>

      <p className={styles.switchLink}>
        Already have an account?{' '}
        <Link to="/login" className={styles.link}>Sign in</Link>
      </p>
    </AuthLayout>
  )
}
