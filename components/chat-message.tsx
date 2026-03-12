"use client"

import { cn } from "@/lib/utils"
import { Cloud, User } from "lucide-react"

interface ChatMessageProps {
  role: "user" | "assistant" | "error"
  content: string
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user"
  const isError = role === "error"
  const isAssistant = role === "assistant"
  
  return (
    isAssistant ? ( content ?
    <div
      className={cn(
        "flex items-start gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : isError
              ? "bg-destructive/10 text-destructive"
              : "bg-accent text-accent-foreground"
        )}
        aria-hidden="true"
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Cloud className="h-4 w-4" />
        )}
      </div>

      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : isError
              ? "bg-destructive/10 text-destructive rounded-tl-sm"
              : "bg-card text-card-foreground border border-border rounded-tl-sm shadow-sm"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>
      </div>
    </div> : <></>) : <div
      className={cn(
        "flex items-start gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : isError
              ? "bg-destructive/10 text-destructive"
              : "bg-accent text-accent-foreground"
        )}
        aria-hidden="true"
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Cloud className="h-4 w-4" />
        )}
      </div>

      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : isError
              ? "bg-destructive/10 text-destructive rounded-tl-sm"
              : "bg-card text-card-foreground border border-border rounded-tl-sm shadow-sm"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>
      </div>
    </div>
  )
}
