import { create } from 'zustand';

interface ToastState {
  message: string;
  visible: boolean;
  show: (message: string) => void;
  hide: () => void;
}

let timeout: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  message: '',
  visible: false,

  show: (message) => {
    if (timeout) clearTimeout(timeout);
    set({ message, visible: true });
    timeout = setTimeout(() => {
      set({ visible: false });
      timeout = null;
    }, 2500);
  },

  hide: () => {
    if (timeout) clearTimeout(timeout);
    timeout = null;
    set({ visible: false });
  },
}));
