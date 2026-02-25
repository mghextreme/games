<script setup lang="ts">
import type { Room, PlayerWithDetails, GameSettings } from '~/lib/types'
import { getGame } from '~/lib/games/registry'

const props = defineProps<{
  room: Room
  players: readonly PlayerWithDetails[]
  currentPlayerId: string
}>()

const emit = defineEmits<{
  (e: 'move', move: unknown): void
  (e: 'update:settings', settings: GameSettings): void
}>()

const game = computed(() => getGame(props.room.gameType))
const isHost = computed(() => props.currentPlayerId === props.room.hostGuestId)

const GameComponent = computed(() => {
  if (!game.value) return null
  return defineAsyncComponent(game.value.component)
})

const ResultsComponent = computed(() => {
  if (!game.value) return null
  return defineAsyncComponent(game.value.resultsComponent)
})

const SettingsComponent = computed(() => {
  if (!game.value) return null
  return defineAsyncComponent(game.value.settingsComponent)
})

const scores = computed(() => {
  if (!props.room.gameState || !game.value) return null
  return game.value.getGameScore(props.room.gameState)
})

// Settings state - recomputed when players or game change
const playerIds = computed(() => props.players.map((p) => p.guestId))
const settings = ref<GameSettings>({ playerSettings: {} })

watch(
  [game, playerIds],
  ([newGame, newPlayerIds]) => {
    if (newGame && newPlayerIds.length >= newGame.minPlayers) {
      settings.value = newGame.defaultSettings(newPlayerIds)
      emit('update:settings', settings.value)
    }
  },
  { immediate: true }
)

const handleSettingsUpdate = (newSettings: GameSettings) => {
  settings.value = newSettings
  emit('update:settings', newSettings)
}
</script>

<template>
  <div class="flex w-full flex-col items-center">
    <template v-if="room.status === 'waiting'">
      <div class="py-8 text-center">
        <p class="text-lg text-muted-foreground">
          <template v-if="isHost">
            Waiting for you to start the game...
          </template>
          <template v-else>
            Waiting for the host to start the game...
          </template>
        </p>
      </div>

      <!-- Game Settings (host only) -->
      <div v-if="isHost && SettingsComponent && players.length >= (game?.minPlayers ?? 2)" class="w-full max-w-sm">
        <component
          :is="SettingsComponent"
          :settings="settings"
          :players="players"
          @update:settings="handleSettingsUpdate"
        />
      </div>
    </template>

    <template v-else-if="room.status === 'playing' && room.gameState">
      <component
        :is="GameComponent"
        v-if="GameComponent"
        :game-state="room.gameState"
        :current-player-id="currentPlayerId"
        :players="players"
        @move="emit('move', $event)"
      />
      <div v-else class="py-8 text-center text-muted-foreground">
        Game component not found
      </div>
    </template>

    <template v-else-if="room.status === 'finished'">
      <component
        :is="ResultsComponent"
        v-if="ResultsComponent && scores"
        :game-state="room.gameState"
        :current-player-id="currentPlayerId"
        :players="players"
        :scores="scores"
      />
      <div v-else class="py-8 text-center">
        <p class="text-lg text-muted-foreground">
          Game finished!
        </p>
      </div>

      <p class="mt-4 text-sm text-muted-foreground">
        <template v-if="isHost">
          You can start a new game.
        </template>
        <template v-else>
          The host can start a new game.
        </template>
      </p>
    </template>

    <template v-else>
      <div class="py-8 text-center text-muted-foreground">
        Game state unavailable
      </div>
    </template>
  </div>
</template>
