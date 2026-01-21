import type { Toast } from '~/lib/types'

const toasts = ref<Toast[]>([])

export function useToast() {
  const addToast = (message: string, type: Toast['type'] = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9)
    const toast: Toast = { id, message, type }
    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message: string, duration?: number) => addToast(message, 'success', duration)
  const error = (message: string, duration?: number) => addToast(message, 'error', duration)
  const info = (message: string, duration?: number) => addToast(message, 'info', duration)

  return {
    toasts: readonly(toasts),
    addToast,
    removeToast,
    success,
    error,
    info,
  }
}
