import { useEffect } from 'react';
import { create } from 'zustand';
import { useAuth, AuthUser } from '../hooks/useAuth';

// This store is kept for backward compatibility
// In practice, you should use useAuth() hook directly
type UserState = {
    user: { uid: string; email: string | null } | null;
    setUser: (user: UserState['user']) => void;
  };

export const useUserStore = create<UserState>((set) => ({
    user: null,
    setUser: (user) => set({ user: user ?? null }),
}));

// Helper hook to sync Firebase auth with Zustand store
export function useAuthSync() {
  const { user } = useAuth();
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    if (user) {
      setUser({
        uid: user.uid,
        email: user.email,
      });
    } else {
      setUser(null);
    }
  }, [user, setUser]);
}

// Re-export useAuth for convenience
export { useAuth, type AuthUser };