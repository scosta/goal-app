import { create } from 'zustand';

type UserState = {
    user: { uid: string; email: string } | null;
    setUser: (user: UserState['user']) => void;
  };

export const useUserStore = create<UserState>((set) => ({
    user: null,
    setUser: (user) => set({ user: user ?? null }),
}));