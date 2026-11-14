import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import { useLogin, useRegister } from '@/api/hooks'
import { Logo } from '@/app/Logo'
import { Button, Card, Field, Input } from '@/design'
import { GoogleButton } from '@/features/auth/GoogleButton'

const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
})

const signupSchema = loginSchema.extend({
  name: z.string().trim().min(1, 'Enter your name'),
  homeCity: z.string().trim().min(1, 'Enter your city'),
})

type SignupValues = z.infer<typeof signupSchema>

/** Sign in and sign up share one page (FR-AUTH-1, FR-AUTH-2). */
export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const isSignup = mode === 'signup'
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const login = useLogin()
  const register = useRegister()

  const form = useForm<SignupValues>({
    resolver: zodResolver(isSignup ? signupSchema : loginSchema) as never,
    defaultValues: { name: '', email: '', password: '', homeCity: '' },
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isSignup) await register.mutateAsync(values)
      else await login.mutateAsync({ email: values.email, password: values.password })
      navigate(params.get('next') ?? '/plan', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        Object.entries(err.fields).forEach(([name, message]) =>
          form.setError(name as keyof SignupValues, { message }),
        )
        toast.error(err.message)
      }
    }
  })

  const busy = login.isPending || register.isPending

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
      <Logo />
      <Card className="w-full max-w-sm p-6">
        <h1 className="mb-1 text-2xl font-bold">{isSignup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mb-6 text-sm text-muted">
          {isSignup ? 'Your first 3 plans every month are free.' : 'Sign in to plan your next outing.'}
        </p>
        <GoogleButton onSignedIn={() => navigate(params.get('next') ?? '/plan', { replace: true })} />
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4" noValidate>
          {isSignup && (
            <Field label="Name" htmlFor="name" error={errors.name?.message}>
              <Input id="name" autoComplete="name" {...form.register('name')} />
            </Field>
          )}
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          </Field>
          <Field label="Password" htmlFor="password" error={errors.password?.message}>
            <Input
              id="password"
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              {...form.register('password')}
            />
          </Field>
          {isSignup && (
            <Field label="Home city" htmlFor="homeCity" error={errors.homeCity?.message}>
              <Input id="homeCity" autoComplete="address-level2" {...form.register('homeCity')} />
            </Field>
          )}
          <Button type="submit" loading={busy} className="mt-2 w-full">
            {isSignup ? 'Create account' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          {isSignup ? 'Already have an account? ' : 'New here? '}
          <Link
            to={isSignup ? '/login' : '/signup'}
            className="font-semibold text-brand dark:text-ink"
          >
            {isSignup ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </Card>
    </div>
  )
}
