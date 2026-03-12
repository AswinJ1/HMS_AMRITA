"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"
import { ThemeProvider } from "@/components/providers/theme-provider"

interface Props {
  children: ReactNode
}

export function AuthSessionProvider({ children }: Props) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}