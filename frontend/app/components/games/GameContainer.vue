<script setup lang="ts">
import type { Room, PlayerWithDetails } from '~/lib/types'
import { getGame } from '~/lib/games/registry'
import { Trophy, Minus } from 'lucide-vue-next'

const props = defineProps<{
  room: Room
  players: readonly PlayerWithDetails[]
  currentPlayerId: string
}>()

const emit = defineEmits<{
  (e: 'move', move: unknown): void
}>()

const game = computed(() => getGame(props.room.gameType))
const isHost = computed(() => props.currentPlayerId === props.room.hostGuestId)

const GameComponent = computed(() => {
  if (!game.value) return null
  return defineAsyncComponent(game.value.component)
})

// Get game results for finished state
const gameResults = computed(() => {
  if (!props.room.gameState || !game.value) return null
  
  const scores = game.value.getGameScore(props.room.gameState)
  
  if (!scores) return null
  
  // Find the highest score to determine winner(s)
  let bestPlayerId: string | null = null
  let bestScore: { compareTo(other: unknown): number } | null = null
  let allEqual = true
  const entries = [...scores.entries()]
  
  for (const [playerId, score] of entries) {
    if (bestScore === null || score.compareTo(bestScore) > 0) {
      bestPlayerId = playerId
      bestScore = score
    }
  }
  
  // Check if all scores are equal (draw)
  if (entries.length > 1) {
    const [, firstScore] = entries[0]
    allEqual = entries.every(([, score]) => score.compareTo(firstScore) === 0)
  }
  
  if (allEqual) {
    return {
      type: 'draw' as const,
    }
  }
  
  if (bestPlayerId) {
    const winner = props.players.find(p => p.guestId === bestPlayerId)
    return {
      type: 'winner' as const,
      winner,
      winnerName: winner?.displayName || 'Unknown Player',
      isCurrentUser: bestPlayerId === props.currentPlayerId,
    }
  }
  
  return null
})
</script>

<template>
  <div class="flex flex-col items-center">
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
        <!-- Winner Result -->
        <template v-if="gameResults?.type === 'winner'">
          <div class="mb-4 flex justify-center">
            <div class="rounded-full bg-yellow-100 p-4 dark:bg-yellow-900/30">
              <Trophy class="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p class="text-2xl font-bold">
            <template v-if="gameResults.isCurrentUser">
              <span class="text-green-600 dark:text-green-400">You won!</span>
            </template>
            <template v-else>
              <span class="text-foreground">{{ gameResults.winnerName }}</span>
              <span class="text-muted-foreground"> wins!</span>
            </template>
          </p>
        </template>

        <!-- Draw Result -->
        <template v-else-if="gameResults?.type === 'draw'">
          <div class="mb-4 flex justify-center">
            <div class="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
              <Minus class="h-12 w-12 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          <p class="text-2xl font-bold text-muted-foreground">
            It's a draw!
          </p>
        </template>

        <!-- No result available (fallback) -->
        <template v-else>
          <p class="text-lg text-muted-foreground">
            Game finished!
          </p>
        </template>

        <p class="mt-4 text-sm text-muted-foreground">
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
