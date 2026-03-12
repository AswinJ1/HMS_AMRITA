"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const avatars = [
  "/avatars/avatar-1.png",
  "/avatars/avatar-2.png",
  "/avatars/avatar-3.png",
  "/avatars/avatar-4.png",
  "/avatars/avatar-5.png",
  "/avatars/avatar-6.png",
]

interface AvatarSelectorProps {
  value?: string
  onChange: (url: string) => void
}

export function AvatarSelector({ value, onChange }: AvatarSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {avatars.map((url) => (
        <button
          key={url}
          type="button"
          onClick={() => onChange(url)}
          className={cn(
            "p-0.5 border-2 transition-colors",
            value === url ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
          )}
        >
          <Avatar className="size-10">
            <AvatarImage src={url} />
            <AvatarFallback className="text-xs">AV</AvatarFallback>
          </Avatar>
        </button>
      ))}
    </div>
  )
}
