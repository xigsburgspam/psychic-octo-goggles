/**
 * Addagle Global State (Zustand)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set, get) => ({
      // User preferences
      nickname: '',
      interests: [],
      chatMode: 'text',       // 'text' | 'video'
      language: 'en',
      theme: 'dark',

      // Session
      sessionId: null,
      isAnonymous: true,

      // Stats
      onlineCount: 0,

      setNickname: (nickname) => set({ nickname }),
      setInterests: (interests) => set({ interests }),
      setChatMode: (chatMode) => set({ chatMode }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setSessionId: (sessionId) => set({ sessionId }),
      setOnlineCount: (onlineCount) => set({ onlineCount }),

      // Generate a nickname if not set
      ensureNickname: () => {
        if (!get().nickname) {
          const id = Math.random().toString(36).slice(2, 6).toUpperCase();
          set({ nickname: `User_${id}` });
        }
      },
    }),
    {
      name: 'addagle-prefs',
      partialize: (state) => ({
        nickname: state.nickname,
        interests: state.interests,
        chatMode: state.chatMode,
        language: state.language,
        theme: state.theme,
      }),
    }
  )
);

// Chat session state (not persisted)
export const useChatStore = create((set) => ({
  status: 'idle',        // 'idle' | 'searching' | 'connected' | 'disconnected'
  partnerNickname: '',
  sharedInterests: [],
  isInitiator: false,
  pairId: null,
  messages: [],
  isPartnerTyping: false,
  connectionState: null, // WebRTC connection state

  setStatus: (status) => set({ status }),
  setPartner: ({ partnerNickname, sharedInterests, isInitiator, pairId }) =>
    set({ partnerNickname, sharedInterests, isInitiator, pairId }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  setPartnerTyping: (isPartnerTyping) => set({ isPartnerTyping }),
  setConnectionState: (connectionState) => set({ connectionState }),
  reset: () =>
    set({
      status: 'idle',
      partnerNickname: '',
      sharedInterests: [],
      isInitiator: false,
      pairId: null,
      messages: [],
      isPartnerTyping: false,
      connectionState: null,
    }),
}));
