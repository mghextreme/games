<script setup lang="ts">
import { cn } from '~/lib/utils'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>(), {
  variant: 'default',
  size: 'default',
  type: 'button',
})

const buttonClasses = computed(() => cn(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  'disabled:pointer-events-none disabled:opacity-50',
  {
    'bg-primary text-primary-foreground hover:bg-primary/90': props.variant === 'default',
    'border border-input bg-background hover:bg-accent hover:text-accent-foreground': props.variant === 'outline',
    'hover:bg-accent hover:text-accent-foreground': props.variant === 'ghost',
    'bg-destructive text-destructive-foreground hover:bg-destructive/90': props.variant === 'destructive',
  },
  {
    'h-10 px-4 py-2': props.size === 'default',
    'h-9 px-3 text-sm': props.size === 'sm',
    'h-11 px-8': props.size === 'lg',
    'h-10 w-10': props.size === 'icon',
  }
))
</script>

<template>
  <button :class="buttonClasses" :type="type" :disabled="disabled">
    <slot />
  </button>
</template>
