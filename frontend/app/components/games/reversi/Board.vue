<script setup lang="ts">
import type { ReversiState, ReversiMove } from '~/lib/games/reversi/types'
import { getValidMoves, getPlayerColor, getDiscCounts } from '~/lib/games/reversi/engine'
import type { PlayerWithDetails } from '~/lib/types'
import { Button } from '~/components/ui/button'

const props = defineProps<{
  gameState: ReversiState
  currentPlayerId: string // guestId
  players: readonly PlayerWithDetails[]
}>()

const emit = defineEmits<{
  (e: 'move', move: ReversiMove): void
}>()

const isMyTurn = computed(() => props.gameState.currentTurn === props.currentPlayerId)
const isGameOver = computed(() => props.gameState.winner !== null || props.gameState.isDraw)

const currentTurnPlayer = computed(() => {
  return props.players.find((p) => p.guestId === props.gameState.currentTurn)
})

const winnerPlayer = computed(() => {
  if (!props.gameState.winner) return null
  return props.players.find((p) => p.guestId === props.gameState.winner)
})

const myColor = computed(() => getPlayerColor(props.gameState, props.currentPlayerId))

const validMoves = computed(() => {
  if (!isMyTurn.value || isGameOver.value) return []
  return getValidMoves(props.gameState, props.currentPlayerId)
})

const validMoveSet = computed(() => {
  return new Set(validMoves.value.map((m) => `${m.row},${m.col}`))
})

const mustPass = computed(() => {
  return isMyTurn.value && !isGameOver.value && validMoves.value.length === 0
})

const discCounts = computed(() => getDiscCounts(props.gameState))

// Track flipped cells for animation
const flippedCellSet = ref(new Set<string>())
const lastPlacedCell = ref<string | null>(null)

watch(
  () => props.gameState,
  (newState, oldState) => {
    // Reset animation state
    flippedCellSet.value = new Set<string>()
    lastPlacedCell.value = null

    if (newState.flippedCells && newState.flippedCells.length > 0) {
      flippedCellSet.value = new Set(
        newState.flippedCells.map((c) => `${c.row},${c.col}`)
      )
    }
    if (newState.lastMove) {
      lastPlacedCell.value = `${newState.lastMove.row},${newState.lastMove.col}`
    }

    // Clear animation classes after animation completes
    if (flippedCellSet.value.size > 0 || lastPlacedCell.value) {
      setTimeout(() => {
        flippedCellSet.value = new Set<string>()
        lastPlacedCell.value = null
      }, 600)
    }
  },
)

const getPlayerDetails = (playerId: string) => {
  return props.players.find((p) => p.guestId === playerId)
}

const handleCellClick = (row: number, col: number) => {
  if (!isMyTurn.value || isGameOver.value) return
  if (props.gameState.board[row]![col] !== null) return
  if (!validMoveSet.value.has(`${row},${col}`)) return

  emit('move', { row, col, pass: false })
}

const handlePass = () => {
  if (!mustPass.value) return
  emit('move', { row: -1, col: -1, pass: true })
}

const gridColsStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.gameState.boardSize}, minmax(0, 1fr))`,
}))

const getCellValue = (row: number, col: number): string | null => {
  return props.gameState.board[row]?.[col] ?? null
}
</script>

<template>
  <div class="flex w-full flex-col items-center gap-4">
    <!-- Game Status -->
    <div class="text-center">
      <template v-if="gameState.winner">
        <p class="text-xl font-bold text-green-600">
          {{ winnerPlayer?.displayName || 'Unknown' }} wins!
        </p>
      </template>
      <template v-else-if="gameState.isDraw">
        <p class="text-xl font-bold text-yellow-600">It's a draw!</p>
      </template>
      <template v-else>
        <p class="text-lg">
          <span v-if="isMyTurn && !mustPass" class="font-bold text-green-600">Your turn</span>
          <span v-else-if="mustPass" class="font-bold text-yellow-600">No moves available</span>
          <span v-else class="text-muted-foreground">
            Waiting for {{ currentTurnPlayer?.displayName || 'opponent' }}...
          </span>
        </p>
      </template>
    </div>

    <!-- Player Info with disc counts -->
    <div class="flex gap-6 text-sm">
      <div
        v-for="player in gameState.players"
        :key="player.id"
        class="flex items-center gap-2"
      >
        <span
          class="inline-block h-5 w-5 rounded-full border-2 border-white shadow-sm ring-1 ring-border"
          :style="{ backgroundColor: player.color }"
        />
        <span :class="{ 'font-bold': player.id === currentPlayerId }">
          {{ getPlayerDetails(player.id)?.displayName || 'Player' }}
        </span>
        <span class="font-mono text-muted-foreground">
          {{ discCounts.get(player.id) ?? 0 }}
        </span>
      </div>
    </div>

    <!-- Board -->
    <div
      class="grid w-full max-w-[600px] gap-[2px] rounded-lg bg-emerald-900 p-1 shadow-lg sm:gap-0.5 sm:p-1.5 dark:bg-emerald-950"
      :style="gridColsStyle"
    >
      <template v-for="row in gameState.boardSize" :key="`row-${row}`">
        <button
          v-for="col in gameState.boardSize"
          :key="`${row}-${col}`"
          :class="[
            'relative flex aspect-square items-center justify-center rounded-sm bg-emerald-700 transition-colors dark:bg-emerald-800',
            validMoveSet.has(`${row - 1},${col - 1}`) ? 'cursor-pointer hover:bg-emerald-600 dark:hover:bg-emerald-700' : '',
            getCellValue(row - 1, col - 1) === null && !validMoveSet.has(`${row - 1},${col - 1}`) ? 'cursor-default' : '',
          ]"
          :disabled="isGameOver"
          @click="handleCellClick(row - 1, col - 1)"
        >
          <!-- Disc -->
          <span
            v-if="getCellValue(row - 1, col - 1) !== null"
            :class="[
              'disc-size rounded-full border-2 border-white/80 shadow-md',
              flippedCellSet.has(`${row - 1},${col - 1}`) ? 'animate-disc-flip' : '',
              lastPlacedCell === `${row - 1},${col - 1}` ? 'animate-disc-place' : '',
            ]"
            :style="{ backgroundColor: getPlayerColor(gameState, getCellValue(row - 1, col - 1)!) ?? undefined }"
          />

          <!-- Valid move hint -->
          <span
            v-else-if="validMoveSet.has(`${row - 1},${col - 1}`)"
            class="hint-size rounded-full"
            :style="{ backgroundColor: myColor ? myColor + '55' : 'rgba(255,255,255,0.2)' }"
          />
        </button>
      </template>
    </div>

    <!-- Pass Button -->
    <Button
      v-if="mustPass"
      variant="secondary"
      @click="handlePass"
    >
      No moves available — Pass
    </Button>

    <!-- Your Color -->
    <p v-if="myColor && !isGameOver" class="flex items-center gap-2 text-sm text-muted-foreground">
      You are playing as
      <span
        class="inline-block h-4 w-4 rounded-full border-2 border-white shadow-sm ring-1 ring-border"
        :style="{ backgroundColor: myColor }"
      />
    </p>
  </div>
</template>

<style scoped>
@keyframes disc-flip {
  0% {
    transform: scaleX(1);
  }
  50% {
    transform: scaleX(0);
  }
  100% {
    transform: scaleX(1);
  }
}

@keyframes disc-place {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.15);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-disc-flip {
  animation: disc-flip 0.5s ease-in-out;
}

.animate-disc-place {
  animation: disc-place 0.35s ease-out;
}

.disc-size {
  width: 75%;
  height: 75%;
}

.hint-size {
  width: 25%;
  height: 25%;
}
</style>
