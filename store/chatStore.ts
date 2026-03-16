import { create } from 'zustand'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  formData?: EnsaioFormData
  attachments?: File[]
}

export interface EnsaioFormData {
  titulo: string
  slug: string
  categoria: string
  descricao: string
  totalFotos: number
  capaUrl: string
}

export interface UploadedPhoto {
  id: string
  url_publica: string
  url_thumb: string
  storage_path: string
}

interface ChatStore {
  messages: Message[]
  isLoading: boolean
  currentEnsaio: Partial<EnsaioFormData> | null
  chatPhase: 'idle' | 'collecting' | 'confirming' | 'publishing'
  uploadedPhotos: UploadedPhoto[]
  addMessage: (msg: Message) => void
  updateLastMessage: (contentOrUpdater: string | ((prev: string) => string), extras?: Partial<Message>) => void
  setLoading: (v: boolean) => void
  updateEnsaio: (data: Partial<EnsaioFormData>) => void
  addUploadedPhotos: (photos: UploadedPhoto[]) => void
  removeUploadedPhoto: (id: string) => void
  clearUploadedPhotos: () => void
  resetChat: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,
  currentEnsaio: null,
  chatPhase: 'idle',
  uploadedPhotos: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  updateLastMessage: (contentOrUpdater, extras) => set((state) => {
    if (state.messages.length === 0) return state
    const newMessages = [...state.messages]
    const lastIdx = newMessages.length - 1
    const lastMsg = newMessages[lastIdx]
    const newContent = typeof contentOrUpdater === 'function' ? contentOrUpdater(lastMsg.content) : contentOrUpdater
    
    newMessages[lastIdx] = { ...lastMsg, content: newContent, ...extras }
    return { messages: newMessages }
  }),
  setLoading: (v) => set({ isLoading: v }),
  updateEnsaio: (data) => set((state) => ({ 
    currentEnsaio: state.currentEnsaio ? { ...state.currentEnsaio, ...data } : data 
  })),
  addUploadedPhotos: (photos) => set((state) => ({ uploadedPhotos: [...state.uploadedPhotos, ...photos] })),
  removeUploadedPhoto: (id) => set((state) => ({ uploadedPhotos: state.uploadedPhotos.filter(p => p.id !== id) })),
  clearUploadedPhotos: () => set({ uploadedPhotos: [] }),
  resetChat: () => set({ messages: [], currentEnsaio: null, chatPhase: 'idle', uploadedPhotos: [] }),
}))
