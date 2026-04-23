type ToastType = 'info' | 'success' | 'error';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

let toasts: ToastItem[] = [];
let listeners: ((toasts: ToastItem[]) => void)[] = [];

export function showToast(message: string, type: ToastType = 'info', autoClose: boolean = true) {
  const id = Date.now().toString();
  toasts = [...toasts, { id, message, type }];
  listeners.forEach(listener => listener(toasts));

  if (autoClose) {
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }
}

export function removeToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
  listeners.forEach(listener => listener(toasts));
}

export function subscribeToasts(listener: (toasts: ToastItem[]) => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}
