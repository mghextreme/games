<script setup lang="ts">
import { Toaster } from '~/components/ui/sonner'

// Initialize color mode on app mount to prevent flash
useColorMode()
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
    <Toaster rich-colors position="bottom-center" />
  </div>
</template>
