"use client"

import { SessionProvider } from "next-auth/react"

export function TRPCReactProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}