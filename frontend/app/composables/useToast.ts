import { toast } from 'vue-sonner'

export function useToast() {
  return {
    success: toast.success,
    error: toast.error,
    info: toast.info,
    warning: toast.warning,
    loading: toast.loading,
    dismiss: toast.dismiss,
    toast, // Expose full API
  }
}
