import { create } from 'zustand'

interface User {
  id: string
  email?: string
  user_metadata?: any
}

interface AuthStore {
  user: User | null
  role: 'admin' | 'cliente' | null
  clienteId: string | null
  siteVinculado: string | null
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  role: null,
  clienteId: null,
  siteVinculado: null,
  setUser: (user) => set({ 
    user, 
    role: user?.user_metadata?.role || null,
    clienteId: user?.user_metadata?.cliente_id || null, // Se vier no claim
    siteVinculado: user?.user_metadata?.url_site || null
  }),
  logout: () => set({ user: null, role: null, clienteId: null, siteVinculado: null }),
}))
