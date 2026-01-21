<script setup lang="ts">
import { useToast } from '~/composables/useToast'
import { X } from 'lucide-vue-next'

const { toasts, removeToast } = useToast()
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg',
          toast.type === 'error' ? 'border-red-200 bg-red-50 text-red-900' : '',
          toast.type === 'success' ? 'border-green-200 bg-green-50 text-green-900' : '',
          toast.type === 'info' ? 'border-blue-200 bg-blue-50 text-blue-900' : '',
        ]"
      >
        <span class="text-sm">{{ toast.message }}</span>
        <button
          class="ml-2 rounded-sm opacity-70 hover:opacity-100"
          @click="removeToast(toast.id)"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
