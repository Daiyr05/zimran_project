import { Camera, Globe, LogOut, Moon, Sun, SunMoon, Trash2, Users } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { useLogout, useMe } from '@/api/hooks'
import { uploadPhoto, useDeleteAccount, useUpdateMe } from '@/api/social'
import type { Visibility } from '@/api/types'
import { getTheme, setTheme, type Theme } from '@/app/theme'
import { Avatar, Button, Card, Dialog, Field, Input, Skeleton } from '@/design'
import { cn } from '@/lib/cn'
import { checkPhoto, shrinkPhoto } from '@/lib/image'

/** Profile, visibility, theme, sign out, delete account (FR-AUTH-3, 5, 7; FR-SOCIAL-4). */
export default function SettingsPage() {
  const { data: me, isLoading } = useMe()
  if (isLoading || !me) return <Skeleton className="mx-auto h-[32rem] max-w-2xl" />
  return <Settings key={me.id} me={me} />
}

function Settings({ me }: { me: NonNullable<ReturnType<typeof useMe>['data']> }) {
  const navigate = useNavigate()
  const update = useUpdateMe()
  const del = useDeleteAccount()
  const logout = useLogout()
  const [form, setForm] = useState({ name: me.name, username: me.username, homeCity: me.homeCity })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})
  const [photoBusy, setPhotoBusy] = useState(false)
  const [theme, setThemeState] = useState<Theme>(getTheme())
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const dirty = form.name !== me.name || form.username !== me.username || form.homeCity !== me.homeCity

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!form.name.trim()) errs.name = 'Enter your name'
    if (!/^[a-z0-9._]{3,20}$/.test(form.username.trim().toLowerCase())) errs.username = '3–20 letters, numbers, dots or underscores'
    if (!form.homeCity.trim()) errs.homeCity = 'Enter your city'
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      await update.mutateAsync({ name: form.name.trim(), username: form.username.trim().toLowerCase(), homeCity: form.homeCity.trim() })
      toast.success('Profile saved')
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields as typeof errors)
        toast.error(err.message)
      }
    }
  }

  const changePhoto = async (file: File) => {
    const problem = checkPhoto(file)
    if (problem) return toast.error(problem)
    setPhotoBusy(true)
    try {
      const url = await uploadPhoto(await shrinkPhoto(file, 512), 'avatar.jpg')
      await update.mutateAsync({ photoUrl: url })
      toast.success('Photo updated')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not upload the photo.')
    } finally {
      setPhotoBusy(false)
    }
  }

  const setVisibility = async (visibility: Visibility) => {
    if (visibility === me.visibility) return
    try {
      await update.mutateAsync({ visibility })
      toast.success(visibility === 'PUBLIC' ? 'Your profile is public' : 'Only friends see your Moments')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save.')
    }
  }

  const signOut = () => {
    logout()
    navigate('/', { replace: true })
  }

  const deleteAccount = async () => {
    try {
      await del.mutateAsync()
      logout()
      toast.success('Your account and Moments were deleted')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not delete the account.')
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="text-4xl font-extrabold md:text-5xl">Settings</h1>

      <Card className="flex flex-col gap-5 p-6">
        <h2 className="font-display text-xl font-bold">Profile</h2>
        <div className="flex items-center gap-4">
          <Avatar name={me.name} src={me.photoUrl} size="lg" />
          <Button variant="secondary" size="sm" loading={photoBusy} icon={<Camera className="size-4" aria-hidden />} onClick={() => fileRef.current?.click()}>
            Change photo
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) changePhoto(f)
              e.target.value = ''
            }}
          />
        </div>
        <form onSubmit={saveProfile} className="flex flex-col gap-4" noValidate>
          <Field label="Name" htmlFor="s-name" error={errors.name}>
            <Input id="s-name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Username" htmlFor="s-username" error={errors.username} hint="Friends find you by this. Your invite link uses it too.">
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted">@</span>
              <Input id="s-username" autoCapitalize="none" spellCheck={false} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="pl-8" />
            </div>
          </Field>
          <Field label="Home city" htmlFor="s-city" error={errors.homeCity}>
            <Input id="s-city" autoComplete="address-level2" value={form.homeCity} onChange={(e) => setForm({ ...form, homeCity: e.target.value })} />
          </Field>
          <p className="text-sm text-muted">Email: {me.email}. Only you see it.</p>
          <Button type="submit" className="self-start" disabled={!dirty} loading={update.isPending && dirty}>
            Save profile
          </Button>
        </form>
      </Card>

      <Card className="flex flex-col gap-4 p-6">
        <h2 className="font-display text-xl font-bold">Who can see your Moments</h2>
        <div role="radiogroup" aria-label="Profile visibility" className="grid gap-2 sm:grid-cols-2">
          <Option selected={me.visibility === 'FRIENDS'} onClick={() => setVisibility('FRIENDS')} icon={<Users className="size-5" aria-hidden />} title="Friends only" text="Recommended. Only accepted friends see your profile Moments." />
          <Option selected={me.visibility === 'PUBLIC'} onClick={() => setVisibility('PUBLIC')} icon={<Globe className="size-5" aria-hidden />} title="Public" text="Anyone signed in can see your profile and Moments." />
        </div>
        <p className="text-sm text-muted">Moments you share to a place page are visible there either way.</p>
      </Card>

      <Card className="flex flex-col gap-4 p-6">
        <h2 className="font-display text-xl font-bold">Appearance</h2>
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
          {(
            [
              ['light', 'Light', Sun],
              ['dark', 'Dark', Moon],
              ['system', 'System', SunMoon],
            ] as const
          ).map(([v, label, Icon]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={theme === v}
              onClick={() => {
                setTheme(v)
                setThemeState(v)
              }}
              className={cn('flex h-12 items-center justify-center gap-2 rounded-2xl border text-sm font-semibold', theme === v ? 'border-brand bg-brand-soft' : 'border-line')}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-6">
        <Button variant="secondary" className="self-start" icon={<LogOut className="size-4" aria-hidden />} onClick={signOut}>
          Sign out
        </Button>
        <hr className="border-line" />
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold text-bad">Delete account</h2>
          <p className="text-sm text-muted">Removes your account, your Moments and your photos. This can't be undone.</p>
          <Button variant="ghost" className="self-start text-bad" icon={<Trash2 className="size-4" aria-hidden />} onClick={() => setDeleting(true)}>
            Delete my account
          </Button>
        </div>
      </Card>

      <Dialog open={deleting} onClose={() => setDeleting(false)} title="Delete your account?">
        <p className="text-muted">Your profile, Moments, photos, friends and saved plans will be gone for good.</p>
        <Field label='Type "DELETE" to confirm' htmlFor="del-confirm">
          <Input id="del-confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoCapitalize="characters" />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(false)}>
            Cancel
          </Button>
          <Button className="bg-bad text-white" disabled={confirmText !== 'DELETE'} loading={del.isPending} onClick={deleteAccount}>
            Delete forever
          </Button>
        </div>
      </Dialog>
    </div>
  )
}

function Option({ selected, onClick, icon, title, text }: { selected: boolean; onClick: () => void; icon: React.ReactNode; title: string; text: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn('flex flex-col gap-1 rounded-2xl border p-4 text-left transition', selected ? 'border-brand bg-brand-soft' : 'border-line hover:bg-surface-2')}
    >
      <span className="flex items-center gap-2 font-semibold">
        {icon}
        {title}
      </span>
      <span className="text-sm text-muted">{text}</span>
    </button>
  )
}
