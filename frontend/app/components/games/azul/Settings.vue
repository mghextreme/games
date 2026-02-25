<script setup lang="ts">
import type { AzulSettings } from '~/lib/games/azul/types'
import type { PlayerWithDetails } from '~/lib/types'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

const props = defineProps<{
  settings: AzulSettings
  players: readonly PlayerWithDetails[]
}>()

const emit = defineEmits<{
  (e: 'update:settings', settings: AzulSettings): void
}>()

const getPlayerName = (playerId: string) =>
  props.players.find((p) => p.guestId === playerId)?.displayName ?? 'Unknown'

const handleStartingPlayerChange = (playerId: string) => {
  emit('update:settings', {
    ...props.settings,
    startingPlayerId: playerId,
  })
}
</script>

<template>
  <div class="space-y-4">
    <!-- Starting Player -->
    <div class="space-y-2">
      <Label>Goes first</Label>
      <Select
        :model-value="settings.startingPlayerId"
        @update:model-value="(v) => handleStartingPlayerChange(String(v))"
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
