<script setup lang="ts">
import { cn } from '~/lib/utils'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  type?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  maxlength?: number | string
  modelValue?: string | number
}>(), {
  type: 'text',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const inputClasses = computed(() => cn(
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
  'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
  'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
))
</script>

<template>
  <input
    :class="inputClasses"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :required="required"
    :maxlength="maxlength"
    :value="modelValue"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
