<script setup lang="ts">
import { cn } from '~/lib/utils'
import { computed } from 'vue'

const props = defineProps<{
  for?: string
}>()

const labelClasses = computed(() => cn(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
))
</script>

<template>
  <label :class="labelClasses" :for="for">
    <slot />
  </label>
</template>
