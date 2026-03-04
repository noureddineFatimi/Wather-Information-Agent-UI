"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ChatMessage } from "@/components/chat-message"
import { ChatInput } from "@/components/chat-input"
import { TypingIndicator } from "@/components/typing-indicator"
import { CloudSun } from "lucide-react"

interface Message {
  role: "user" | "assistant" | "error"
  content: string
}

interface ConversationEntry {
  role: string
  content: string 
}

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<ConversationEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  const handleSend = async (userInput: string) => {
    const userMessage: Message = { role: "user", content: userInput }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch("http://127.0.0.1:5000/v1/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_input: userInput,
          conversation: conversation,
        }),
      })

      if (!response.ok) {
        const status = response.status
        let errorText = "Something went wrong. Please try again."

        if (status === 400) {
          errorText = "Bad request. Please try again."
        } else if (status === 500) {
          errorText = "Server error. The weather service is temporarily unavailable."
        } else {
          errorText = `Error (${status}): Something unexpected happened.`
        }

        setMessages((prev) => [
          ...prev,
          { role: "error", content: errorText },
        ])
        setIsLoading(false)
        return
      }

      const data = await response.json()
      const assistantText: string = data.response || ""

      if (assistantText) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: assistantText },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "error", content: "Received an empty response from the assistant." },
        ])
      }

      // Update conversation history with the full response list
      setConversation((prev) => [
        ...prev,
        { role: "user", content: userInput },
        {role: "assistant", content: assistantText},
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          content: "Network error. Please check your connection and try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border bg-card/80 backdrop-blur-sm px-6 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <CloudSun className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-foreground">Weather AI</h1>
          <p className="text-xs text-muted-foreground">Ask me about weather anywhere</p>
        </div>
      </header>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
                <CloudSun className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Weather AI Agent
              </h2>
              <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
                {"Ask me about current weather conditions, forecasts, or climate data for any location around the world."}
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} />
          ))}

          {isLoading && <TypingIndicator />}
        </div>
      </div>

      {/* Input area */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  )
}
