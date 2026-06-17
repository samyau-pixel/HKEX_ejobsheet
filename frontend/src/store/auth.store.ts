'use client';

import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Manager' | 'OperatorLeader' | 'Operator';
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setUser: (user: User | null) => set({ user }),
  setToken: (token: string | null) => set({ token, isAuthenticated: !!token }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));
