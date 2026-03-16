import { createClient } from 'lucide-react'
import { create } from 'zustand'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  formData?: any
  attachments?: any[]
}

export interface EnsaioFormData {
  titulo: string
  slug: string
  categoria: string
  descricao: string
  totalFotos: number
  capaUrl: string
}

interface ChatStore {
  messages: Message[]
  isLoading: boolean
  currentEnsaio: Partial<EnsaioFormData> | null
  chatPhase: 'idle' | 'collecting' | 'confirming' | 'publishing'
  addMessage: (msg: Message) => void
  setLoading: (v: boolean) => void
  updateEnsaio: (data: Partial<EnsaioFormData>) => void
  resetChat: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,
  currentEnsaio: null,
  chatPhase: 'idle',
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setLoading: (v) => set({ isLoading: v }),
  updateEnsaio: (data) => set((state) => ({ 
    currentEnsaio: state.currentEnsaio ? { ...state.currentEnsaio, ...data } : data 
  })),
  resetChat: () => set({ messages: [], currentEnsaio: null, chatPhase: 'idle' }),
}))
