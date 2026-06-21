// ============================================================
// PROFILE STORE — Simplified for guest mode
// ============================================================
import { create } from 'zustand';

interface ProfileState {
  initialize: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>(() => ({
  initialize: async () => { /* noop — guest mode, no profile selection */ },
}));
