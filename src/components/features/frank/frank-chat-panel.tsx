"use client"

import { useState, useTransition } from "react"
import { Brain, Loader2, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type FrankChatMessage = {
  id: string
  role: "user" | "assistant" | "system"
  message: string
  createdAtIso: string
}

type FrankChatResponse = {
  threadId: string
  answer: string
  messages: FrankChatMessage[]
  mode: "gemini" | "deterministic" | "gemini_fallback"
}

export function FrankChatPanel() {
  const [question, setQuestion] = useState("")
  const [threadId, setThreadId] = useState<string>()
  const [messages, setMessages] = useState<FrankChatMessage[]>([
    {
      id: "frank-welcome",
      role: "assistant",
      message:
        "Ask me about revenue, flagged money-in, or outgoing requests. I will answer from Cline records.",
      createdAtIso: new Date().toISOString(),
    },
  ])
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function submitQuestion(nextQuestion?: string) {
    const trimmedQuestion = (nextQuestion ?? question).trim()

    if (!trimmedQuestion || isPending) {
      return
    }

    setError("")
    setQuestion("")
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `local-${Date.now()}`,
        role: "user",
        message: trimmedQuestion,
        createdAtIso: new Date().toISOString(),
      },
    ])

    startTransition(async () => {
      try {
        const response = await fetch("/api/frank/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: trimmedQuestion,
            threadId,
          }),
        })

        if (!response.ok) {
          throw new Error("Frank request failed.")
        }

        const payload = (await response.json()) as FrankChatResponse
        setThreadId(payload.threadId)
        setMessages(payload.messages)
      } catch {
        setError("Frank could not answer from the current records.")
      }
    })
  }

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="size-4 text-primary" />
              Ask Frank
            </CardTitle>
            <CardDescription>
              Structured finance answers from live Cline records.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid max-h-[360px] gap-3 overflow-y-auto pr-1">
          {messages.map((message) => (
            <div
              className={cn(
                "rounded-lg border px-3 py-2 text-sm leading-6",
                message.role === "user"
                  ? "ml-6 border-primary/20 bg-primary text-primary-foreground"
                  : "mr-6 border-border bg-background text-muted-foreground",
              )}
              key={message.id}
            >
              {message.message}
            </div>
          ))}
          {isPending ? (
            <div className="mr-6 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Frank is checking the records
            </div>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Textarea
            className="min-h-20 resize-none bg-background"
            maxLength={700}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                submitQuestion()
              }
            }}
            placeholder="Ask about revenue, mismatches, or approval risk"
            value={question}
          />
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-destructive">{error}</div>
            <Button
              disabled={!question.trim() || isPending}
              onClick={() => submitQuestion()}
              type="button"
            >
              <Send data-icon="inline-start" />
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
