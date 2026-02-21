<script setup lang="ts">
import type { ReversiState, ReversiScore } from '~/lib/games/reversi/types'
import type { PlayerWithDetails, PlayerScores } from '~/lib/types'
import { getPlayerColor } from '~/lib/games/reversi/engine'
import { Award, Trophy, Minus } from 'lucide-vue-next'

const props = defineProps<{
  gameState: ReversiState
  currentPlayerId: string
  players: readonly PlayerWithDetails[]
  scores: PlayerScores<ReversiScore>
}>()

const result = computed(() => {
  const entries = [...props.scores.entries()]

  // Find the player with the highest score
  let bestPlayerId: string | null = null
  let bestScore: ReversiScore | null = null

  for (const [playerId, score] of entries) {
    if (bestScore === null || score.compareTo(bestScore) > 0) {
      bestPlayerId = playerId
      bestScore = score
    }
  }

  // Check if all scores are equal (draw)
  if (entries.length > 1) {
    const firstEntry = entries[0]!
    const firstScore = firstEntry[1]
    const allEqual = entries.every(([, score]) => score.compareTo(firstScore) === 0)
    if (allEqual) {
      return { type: 'draw' as const }
    }
  }

  if (bestPlayerId) {
    const winner = props.players.find((p) => p.guestId === bestPlayerId)
    return {
      type: 'winner' as const,
      winnerName: winner?.displayName || 'Unknown Player',
      isCurrentUser: bestPlayerId === props.currentPlayerId,
    }
  }

  return null
})

const getPlayerDetails = (playerId: string) => {
  return props.players.find((p) => p.guestId === playerId)
}
</script>

<template>
  <div class="py-8 text-center">
    <!-- Winner Result -->
    <template v-if="result?.type === 'winner'">
      <div class="mb-4 flex justify-center">
        <template v-if="result.isCurrentUser">
          <div class="rounded-full bg-yellow-100 p-4 dark:bg-yellow-900/30">
            <Trophy class="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
          </div>
        </template>
        <template v-else>
          <div class="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
            <Award class="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </template>
      </div>
      <p class="text-2xl font-bold">
        <template v-if="result.isCurrentUser">
          <span class="text-green-600 dark:text-green-400">You won!</span>
        </template>
        <template v-else>
          <span class="text-foreground">{{ result.winnerName }}</span>
          <span class="text-muted-foreground"> wins!</span>
        </template>
      </p>
    </template>

    <!-- Draw Result -->
    <template v-else-if="result?.type === 'draw'">
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

    <!-- Score breakdown -->
    <div class="mt-6 flex items-center justify-center gap-6">
      <div
        v-for="player in gameState.players"
        :key="player.id"
        class="flex items-center gap-2"
      >
        <span
          class="inline-block h-5 w-5 rounded-full border-2 border-white shadow-sm ring-1 ring-border"
          :style="{ backgroundColor: player.color }"
        />
        <span class="text-sm font-medium">
          {{ getPlayerDetails(player.id)?.displayName || 'Player' }}
        </span>
        <span class="text-lg font-bold font-mono">
          {{ scores.get(player.id)?.value ?? 0 }}
        </span>
      </div>
    </div>
  </div>
</template>
