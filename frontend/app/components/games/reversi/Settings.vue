<script setup lang="ts">
import type { ReversiSettings } from '~/lib/games/reversi/types'
import { REVERSI_COLORS } from '~/lib/games/reversi/types'
import type { PlayerWithDetails } from '~/lib/types'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

const props = defineProps<{
  settings: ReversiSettings
  players: readonly PlayerWithDetails[]
}>()

const emit = defineEmits<{
  (e: 'update:settings', settings: ReversiSettings): void
}>()

const getPlayerName = (playerId: string) => {
  return props.players.find((p) => p.guestId === playerId)?.displayName ?? 'Unknown'
}

const getColorName = (hex: string) => {
  return REVERSI_COLORS.find((c) => c.hex === hex)?.name ?? hex
}

const getPlayerColor = (playerId: string) => {
  return props.settings.playerSettings[playerId]?.color ?? REVERSI_COLORS[0].hex
}

const getOtherPlayerColor = (playerId: string) => {
  const other = props.players.find((p) => p.guestId !== playerId)
  if (!other) return null
  return getPlayerColor(other.guestId)
}

const availableColorsFor = (playerId: string) => {
  const otherColor = getOtherPlayerColor(playerId)
  return REVERSI_COLORS.filter((c) => c.hex !== otherColor)
}

const handleColorChange = (playerId: string, color: string) => {
  emit('update:settings', {
    ...props.settings,
    playerSettings: {
      ...props.settings.playerSettings,
      [playerId]: { color },
    },
  })
}

const handleBoardSizeChange = (size: string) => {
  emit('update:settings', {
    ...props.settings,
    boardSize: Number(size),
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
    <!-- Board Size -->
    <div class="space-y-2">
      <Label>Board Size</Label>
      <Select
        :model-value="String(settings.boardSize)"
        @update:model-value="(v) => handleBoardSizeChange(String(v))"
      >
        <SelectTrigger>
          <SelectValue>{{ settings.boardSize }}x{{ settings.boardSize }}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="6">6x6</SelectItem>
          <SelectItem value="8">8x8 (Standard)</SelectItem>
          <SelectItem value="10">10x10</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Color Assignment per player -->
    <div v-for="player in players" :key="player.guestId" class="space-y-2">
      <Label>{{ player.displayName }} plays as</Label>
      <Select
        :model-value="getPlayerColor(player.guestId)"
        @update:model-value="(v) => handleColorChange(player.guestId, String(v))"
      >
        <SelectTrigger>
          <SelectValue>
            <span class="flex items-center gap-2">
              <span
                class="inline-block h-4 w-4 rounded-full border-2 border-white shadow-sm ring-1 ring-border"
                :style="{ backgroundColor: getPlayerColor(player.guestId) }"
              />
              {{ getColorName(getPlayerColor(player.guestId)) }}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="color in availableColorsFor(player.guestId)"
            :key="color.hex"
            :value="color.hex"
          >
            <span class="flex items-center gap-2">
              <span
                class="inline-block h-4 w-4 rounded-full border-2 border-white shadow-sm ring-1 ring-border"
                :style="{ backgroundColor: color.hex }"
              />
              {{ color.name }}
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

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
