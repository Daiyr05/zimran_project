const KEY = 'hangout.theme'
export type Theme = 'light' | 'dark' | 'system'

export function getTheme(): Theme {
  try {
    return (localStorage.getItem(KEY) as Theme | null) ?? 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(theme: Theme = getTheme()) {
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* storage blocked: theme lasts for this visit only */
  }
  applyTheme(theme)
}
