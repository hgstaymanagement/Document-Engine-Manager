/** Synthetic Auth email for a client login ID. Never shown in the UI. */
export const LOGIN_EMAIL_DOMAIN = 'liga-bulan.example.com'

export function loginIdToEmail(loginId: string): string {
  return `${loginId.trim().toLowerCase()}@${LOGIN_EMAIL_DOMAIN}`
}
