<script setup lang="ts">
import type { TicTacToeState, TicTacToeMove } from '~/lib/games/tic-tac-toe/types'
import { getCellSymbol, getPlayerSymbol } from '~/lib/games/tic-tac-toe/engine'
import type { PlayerWithDetails } from '~/lib/types'

const props = defineProps<{
  gameState: TicTacToeState
  currentPlayerId: string // This is now guestId
  players: readonly PlayerWithDetails[]
}>()

const emit = defineEmits<{
  (e: 'move', move: TicTacToeMove): void
}>()

const isMyTurn = computed(() => props.gameState.currentTurn === props.currentPlayerId)

const mySymbol = computed(() => getPlayerSymbol(props.gameState, props.currentPlayerId))

const currentTurnPlayer = computed(() => {
  return props.players.find((p) => p.guestId === props.gameState.currentTurn)
})

const winnerPlayer = computed(() => {
  if (!props.gameState.winner) return null
  return props.players.find((p) => p.guestId === props.gameState.winner)
})

const getPlayerBySymbol = (symbol: 'X' | 'O') => {
  const statePlayer = props.gameState.players.find((p) => p.symbol === symbol)
  if (!statePlayer) return null
  return props.players.find((p) => p.guestId === statePlayer.id)
}

const handleCellClick = (row: number, col: number) => {
  if (!isMyTurn.value) return
  if (props.gameState.board[row][col] !== null) return
  if (props.gameState.winner || props.gameState.isDraw) return

  emit('move', { row, col })
}

const getCellClass = (row: number, col: number) => {
  const symbol = getCellSymbol(props.gameState, row, col)
  const isEmpty = symbol === null
  const canClick = isEmpty && isMyTurn.value && !props.gameState.winner && !props.gameState.isDraw

  return [
    'flex h-20 w-20 items-center justify-center border-2 text-4xl font-bold transition-colors sm:h-24 sm:w-24',
    symbol === 'X' ? 'text-blue-600' : symbol === 'O' ? 'text-red-600' : '',
    canClick ? 'cursor-pointer hover:bg-muted' : '',
    !canClick && isEmpty ? 'cursor-not-allowed' : '',
  ]
}
</script>

<template>
  <div class="flex flex-col items-center gap-6">
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
          <span v-if="isMyTurn" class="font-bold text-green-600">Your turn</span>
          <span v-else class="text-muted-foreground">
            Waiting for {{ currentTurnPlayer?.displayName || 'opponent' }}...
          </span>
        </p>
      </template>
    </div>

    <!-- Player Info -->
    <div class="flex gap-8 text-sm">
      <div class="flex items-center gap-2">
        <span class="text-2xl font-bold text-blue-600">X</span>
        <span :class="{ 'font-bold': gameState.players[0]?.id === currentPlayerId }">
          {{ getPlayerBySymbol('X')?.displayName || 'Player 1' }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-2xl font-bold text-red-600">O</span>
        <span :class="{ 'font-bold': gameState.players[1]?.id === currentPlayerId }">
          {{ getPlayerBySymbol('O')?.displayName || 'Player 2' }}
        </span>
      </div>
    </div>

    <!-- Board -->
    <div class="grid grid-cols-3 gap-1 rounded-lg bg-border p-1">
      <template v-for="row in 3" :key="row">
        <button
          v-for="col in 3"
          :key="`${row}-${col}`"
          :class="getCellClass(row - 1, col - 1)"
          class="bg-background"
          :disabled="!isMyTurn || gameState.winner !== null || gameState.isDraw"
          @click="handleCellClick(row - 1, col - 1)"
        >
          {{ getCellSymbol(gameState, row - 1, col - 1) || '' }}
        </button>
      </template>
    </div>

    <!-- Your Symbol -->
    <p v-if="mySymbol" class="text-sm text-muted-foreground">
      You are playing as
      <span :class="mySymbol === 'X' ? 'font-bold text-blue-600' : 'font-bold text-red-600'">
        {{ mySymbol }}
      </span>
    </p>
  </div>
</template>
