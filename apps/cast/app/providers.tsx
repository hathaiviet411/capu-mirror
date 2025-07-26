"use client"

import { SessionProvider } from "next-auth/react"
import { api } from "~/utils/api"

export { api }

export function TRPCReactProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <api.withTRPC>
      <SessionProvider>{children}</SessionProvider>
    </api.withTRPC>
  )
}