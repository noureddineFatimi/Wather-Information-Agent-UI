"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ChatMessage } from "@/components/chat-message"
import { ChatInput } from "@/components/chat-input"
import { TypingIndicator } from "@/components/typing-indicator"
import { CloudSun } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
interface Message {
  role: "user" | "assistant" | "error"
  content: string
}

const MODELS = [
  { id: "qwen", label: "Qwen-3.5" },
  { id: "gpt-oss", label: "GPT-oss" },
  { id: "gemini", label: "Gemini-2.5-flash" }
]

interface ConversationEntry {
  role: string
  content: string
}

export function ChatContainerStream() {
  const [model, setModel] = useState<string>("qwen")
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<ConversationEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

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

    // Initialize abort controller for this request
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch("http://127.0.0.1:5000/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_input: userInput,
          conversation: conversation,
          model: model
        }),
        signal: abortControllerRef.current.signal,
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

      // Handle streaming response
      if (!response.body) {
        setMessages((prev) => [
          ...prev,
          { role: "error", content: "Response is Empty" },
        ])
        setIsLoading(false)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ""

      // Add empty assistant message placeholder
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "" },
      ])
      let firstChunk = true
      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          if (chunk.includes("[ERROR:CONNECTION_LOST]")) {
            setMessages((prev) => [
            ...prev,
            { role: "error", content: "Internal nework error"},
          ])
          setIsLoading(false)
          return
          }
          assistantMessage += chunk
          if (firstChunk) {
            setIsLoading(false)
            firstChunk = false
          }
          // Update the last message with streamed content
          setMessages((prev) => {
            const updated = [...prev]
            if (updated[updated.length - 1].role === "assistant") {
              updated[updated.length - 1] = {
                role: "assistant",
                content: assistantMessage,
              }
            }
            return updated
          })
        }
      } finally {
        reader.releaseLock()
      }

      // Update conversation history with both user and assistant messages
      setConversation((prev) => [
        ...prev,
        { role: "user", content: userInput },
        { role: "assistant", content: assistantMessage },
      ])
    }
    catch {
      setMessages((prev) => [
          ...prev,
          { role: "error", content: "Error during sending Request, Please try again or check your connection internet" },
        ])
    }
    finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CloudSun className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Weather AI</h1>
            <p className="text-xs text-muted-foreground">Ask me about weather anywhere</p>
          </div>
        </div>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODELS.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
