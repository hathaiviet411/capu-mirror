import { getServerSession } from 'next-auth/next'
import { authOptions } from '~/server/auth'
import type { JWT } from 'next-auth/jwt'

export async function getSession() {
  return await getServerSession(authOptions)
}

export function isSessionExpired(token: JWT | null): boolean {
  if (!token || !token.exp) return true
  return token.exp < Date.now() / 1000
}

export function getSessionTimeRemaining(token: JWT | null): number {
  if (!token || !token.exp) return 0
  const remaining = token.exp - Date.now() / 1000
  return Math.max(0, remaining)
}