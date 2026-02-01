<script setup lang="ts">
import { Button } from '~/components/ui/button'
import SettingsModal from '~/components/room/SettingsModal.vue'
import { Cog } from 'lucide-vue-next'

const { displayName } = useGuest()

const settingsModalOpen = ref(false)
</script>

<template>
  <header class="border-b bg-background">
    <div class="container mx-auto flex h-16 items-center justify-between px-4">
      <div v-if="$slots.default" class="card-content">
        <slot />
      </div>
      <div v-else class="text-lg">Welcome, <span class="font-bold">{{displayName}}</span></div>

      <div class="flex justify-between items-center gap-2">
        <slot name="buttons"></slot>
        <Button variant="outline" size="icon" @click="settingsModalOpen = true" title="User Options">
          <Cog class="h-4 w-4" />
        </Button>
        <SettingsModal :open="settingsModalOpen" @update:open="settingsModalOpen = $event"></SettingsModal>
      </div>
    </div>
  </header>
</template>
