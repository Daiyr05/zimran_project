/** App-wide settings. Values come from .env files (see .env.example). */
export const config = {
  appName: 'Hangout',
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1',
  useMocks: import.meta.env.VITE_USE_MOCKS === 'true',
  /** Time zone of the demo city; all plan times are shown in it (SRS 8.5). */
  timeZone: import.meta.env.VITE_TIME_ZONE ?? 'America/New_York',
  freeSearchesPerMonth: 3,
  plusPriceUsd: 4.99,
  /** Shows "Simulate upgrade" on the Plus page when Stripe is not ready (FR-PAY-3). */
  demoUpgrade: import.meta.env.VITE_DEMO_UPGRADE === 'true',
  /** Google sign-in (FR-AUTH-6). Empty = the button is hidden. */
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
} as const
