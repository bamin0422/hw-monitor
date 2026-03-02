import { create } from 'zustand'
import type { GoogleUser } from '@/types'

interface AuthStore {
  user: GoogleUser | null
  isLoading: boolean
  setUser: (user: GoogleUser | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading })
}))
