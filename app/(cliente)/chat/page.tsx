"use client"

import { useEffect, useRef, useState } from "react"
import { useChatStore, Message } from "@/store/chatStore"
import { MessageBubble } from "@/components/chat/MessageBubble"
import { ChatInput } from "@/components/chat/ChatInput"
import { TypingIndicator } from "@/components/chat/TypingIndicator"
import { EmptyState } from "@/components/ui/EmptyState"
import { MessageSquarePlus } from "lucide-react"

export default function ChatPage() {
  const { messages, isLoading, addMessage, updateLastMessage, setLoading, resetChat } = useChatStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Mock inicialização - se a store estiver vazia, adiciona a saudação (mock)
  useEffect(() => {
    // setIsInitializing setado via timeout para evitar synchronous state transition no render
    const timer = setTimeout(() => {
      setIsInitializing(false)
      if (messages.length === 0) {
        addMessage({
          role: "assistant",
          content: "Olá! O que deseja fazer hoje?\nPara criar um novo ensaio, basta me enviar as fotos ou me descrever os detalhes.",
          timestamp: Date.now(),
        })
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [addMessage, messages.length])

  const handleSendMessage = async (text: string, files: File[]) => {
    // Adiciona a mensagem do usuário
    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: Date.now(),
      attachments: files,
    }
    
    addMessage(userMessage)
    setLoading(true)

    // Adiciona uma mensagem vazia do assistente para o stream
    addMessage({
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    })

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensagens: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
          conversaId: null // TODO: Gerenciar id de conversa real
        }),
      })

      if (!response.ok) throw new Error("Falha na comunicação")
      if (!response.body) throw new Error("Resposta sem corpo")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let done = false

      setLoading(false) // Desliga indicator, pois a msg já está na tela via stream

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6)
              if (dataStr === "[DONE]") break
              
              if (dataStr.trim()) {
                try {
                  const data = JSON.parse(dataStr)
                  if (data.content) {
                    updateLastMessage((prev) => prev + data.content)
                  }
                  if (data.tool_result) {
                     if (data.tool_result.sucesso) {
                        updateLastMessage((prev) => prev + `\n\n✅ **Ensaio publicado com sucesso!**\n[Página do Ensaio](${data.tool_result.url})`)
                     } else {
                        updateLastMessage((prev) => prev + `\n\n❌ **Falha ao publicar ensaio:** ${data.tool_result.error}`)
                     }
                  }
                } catch (e) {
                  // chunk fragmentado ignorado, na próxima passagem ele processa completo se implementado buffer (estamos simplicificando)
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error)
      updateLastMessage((prev) => prev + "\n\n⚠️ Ocorreu um erro na conexão com o assistente.")
    } finally {
      setLoading(false)
    }
  }

  if (isInitializing) {
    return (
      <div className="flex-1 flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-120px)] animate-pulse pt-4">
        <div className="flex-1 space-y-6 px-4 py-6 overflow-y-auto">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex-shrink-0" />
            <div className="w-full max-w-[280px] h-20 rounded-2xl bg-[var(--bg-tertiary)]" />
          </div>
          <div className="flex gap-4 flex-row-reverse">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex-shrink-0" />
            <div className="w-full max-w-[200px] h-12 rounded-2xl bg-[var(--bg-tertiary)]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-145px)] md:h-[calc(100vh-120px)] border border-[var(--photo-border)] rounded-2xl bg-[var(--bg-secondary)] overflow-hidden shadow-sm relative mx-auto w-full max-w-5xl mt-2">
      
      {/* Header do Chat (Opcional - pode mostrar status ou detalhes do ensaio em andamento) */}
      <div className="h-14 border-b border-[var(--photo-border)] bg-[var(--bg-tertiary)]/50 backdrop-blur-md flex items-center px-4 flex-shrink-0 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[var(--success)] shadow-[0_0_8px_var(--success)] animate-pulse" />
          <span className="text-sm font-semibold tracking-wider font-['Playfair_Display'] text-[var(--photo-accent)]">
            Assistente IA
          </span>
        </div>
        <button 
          onClick={resetChat}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-3 py-1.5 border border-transparent hover:border-[var(--photo-border)] hover:bg-[var(--bg-tertiary)] rounded-lg"
        >
          Limpar histórico
        </button>
      </div>

      {/* Container de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState 
              title="Pronto para começar"
              description="Envie fotos ou detalhes para criar um novo ensaio."
              icon={MessageSquarePlus}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} message={msg} />
            ))}
            
            {isLoading && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <TypingIndicator />
              </div>
            )}
            
            {/* Elemento invisível para scroll automático */}
            <div ref={messagesEndRef} className="h-4 w-full flex-shrink-0" />
          </div>
        )}
      </div>

      {/* Input de Chat */}
      <ChatInput onSend={handleSendMessage} isLoading={isLoading} />

    </div>
  )
}
