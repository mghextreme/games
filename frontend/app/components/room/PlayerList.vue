<script setup lang="ts">
import type { PlayerWithDetails } from '~/lib/types'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Crown, Wifi, WifiOff, X } from 'lucide-vue-next'

const props = defineProps<{
  players: readonly PlayerWithDetails[]
  isHost: boolean
  currentGuestId?: string
}>()

const emit = defineEmits<{
  (e: 'kick', playerGuestId: string): void
}>()
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="player in players"
      :key="player._id"
      class="flex items-center justify-between rounded-lg border bg-card p-3"
    >
      <div class="flex items-center gap-3">
        <div
          :class="[
            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
            player.guestId === currentGuestId ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
          ]"
        >
          {{ player.displayName.charAt(0).toUpperCase() }}
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ player.displayName }}</span>
            <Badge v-if="player.isHost" variant="secondary" class="gap-1">
              <Crown class="h-3 w-3" />
              Host
            </Badge>
            <Badge v-if="player.guestId === currentGuestId" variant="outline">
              You
            </Badge>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div
          :class="[
            'flex items-center gap-1 text-xs',
            player.isConnected ? 'text-green-600' : 'text-muted-foreground',
          ]"
        >
          <Wifi v-if="player.isConnected" class="h-3 w-3" />
          <WifiOff v-else class="h-3 w-3" />
        </div>
        <Button
          v-if="isHost && !player.isHost && player.guestId !== currentGuestId"
          variant="ghost"
          size="icon"
          class="h-8 w-8 text-destructive hover:bg-destructive/10"
          @click="emit('kick', player.guestId)"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
