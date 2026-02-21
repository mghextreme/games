<script setup lang="ts">
import type { TicTacToeSettings } from '~/lib/games/tic-tac-toe/types'
import type { PlayerWithDetails } from '~/lib/types'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

const props = defineProps<{
  settings: TicTacToeSettings
  players: readonly PlayerWithDetails[]
}>()

const emit = defineEmits<{
  (e: 'update:settings', settings: TicTacToeSettings): void
}>()

const playerX = computed(() => {
  const entry = Object.entries(props.settings.playerSettings).find(([, ps]) => ps.symbol === 'X')
  return entry?.[0] ?? ''
})

const getPlayerName = (playerId: string) => {
  return props.players.find((p) => p.guestId === playerId)?.displayName ?? 'Unknown'
}

const handleSymbolChange = (xPlayerId: string) => {
  const otherPlayerId = props.players.find((p) => p.guestId !== xPlayerId)?.guestId
  if (!otherPlayerId) return

  emit('update:settings', {
    ...props.settings,
    playerSettings: {
      [xPlayerId]: { symbol: 'X' },
      [otherPlayerId]: { symbol: 'O' },
    },
  })
}

const handleStartingPlayerChange = (playerId: string) => {
  emit('update:settings', {
    ...props.settings,
    startingPlayerId: playerId,
  })
}
</script>

<template>
  <div class="space-y-4">
    <!-- Symbol Assignment -->
    <div class="space-y-2">
      <Label>Plays as X</Label>
      <Select
        :model-value="playerX"
        @update:model-value="handleSymbolChange"
      >
        <SelectTrigger>
          <SelectValue>{{ getPlayerName(playerX) }}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="player in players" :key="player.guestId" :value="player.guestId">
            {{ player.displayName }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Starting Player -->
    <div class="space-y-2">
      <Label>Goes first</Label>
      <Select
        :model-value="settings.startingPlayerId"
        @update:model-value="handleStartingPlayerChange"
      >
        <SelectTrigger>
          <SelectValue>{{ getPlayerName(settings.startingPlayerId) }}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="player in players" :key="player.guestId" :value="player.guestId">
            {{ player.displayName }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
