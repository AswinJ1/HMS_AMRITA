"use client"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { theme, setTheme } = useTheme()
  return (
    <div className="min-h-screen bg-background relative">
        <button 
          className="absolute top-4 right-4 p-2 z-50 "
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      {children}
    </div>
  )
}