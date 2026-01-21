<script setup lang="ts">
import type { Room, PlayerWithDetails } from '~/lib/types'
import { getGame } from '~/lib/games/registry'

const props = defineProps<{
  room: Room
  players: readonly PlayerWithDetails[]
  currentPlayerId: string
}>()

const emit = defineEmits<{
  (e: 'move', move: unknown): void
}>()

const game = computed(() => getGame(props.room.gameType))

const GameComponent = computed(() => {
  if (!game.value) return null
  return defineAsyncComponent(game.value.component)
})
</script>

<template>
  <div class="flex flex-col items-center">
    <template v-if="room.status === 'waiting'">
      <div class="py-8 text-center">
        <p class="text-lg text-muted-foreground">
          Waiting for the host to start the game...
        </p>
        <p class="mt-2 text-sm text-muted-foreground">
          {{ game?.name }} requires {{ game?.minPlayers }}-{{ game?.maxPlayers }} players
        </p>
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
      <div class="py-8 text-center">
        <p class="text-lg text-muted-foreground">
          Game finished!
        </p>
        <p class="mt-2 text-sm text-muted-foreground">
          The host can start a new game.
        </p>
      </div>
    </template>

    <template v-else>
      <div class="py-8 text-center text-muted-foreground">
        Game state unavailable
      </div>
    </template>
  </div>
</template>
