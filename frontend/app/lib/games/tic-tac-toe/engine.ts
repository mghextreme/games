import type { TicTacToeState, TicTacToeMove, TicTacToeScore } from './types'
import type { PlayerScores } from '~/lib/types'

export function setupGame(playerIds: string[]): TicTacToeState {
  if (playerIds.length !== 2) {
    throw new Error('Tic Tac Toe requires exactly 2 players')
  }

  return {
    board: [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ],
    currentTurn: playerIds[0],
    winner: null,
    isDraw: false,
    players: [
      { id: playerIds[0], symbol: 'X' },
      { id: playerIds[1], symbol: 'O' },
    ],
  }
}

export function validateMove(
  state: TicTacToeState,
  move: TicTacToeMove,
  playerId: string
): boolean {
  // Check if game is already over
  if (state.winner || state.isDraw) {
    return false
  }

  // Check if it's the player's turn
  if (state.currentTurn !== playerId) {
    return false
  }

  // Check if move is within bounds
  if (move.row < 0 || move.row > 2 || move.col < 0 || move.col > 2) {
    return false
  }

  // Check if cell is empty
  if (state.board[move.row][move.col] !== null) {
    return false
  }

  return true
}

export function applyMove(
  state: TicTacToeState,
  move: TicTacToeMove,
  playerId: string
): TicTacToeState {
  // Create deep copy of state
  const newState: TicTacToeState = {
    ...state,
    board: state.board.map((row) => [...row]),
    players: [...state.players],
  }

  // Apply the move
  newState.board[move.row][move.col] = playerId

  // Check for winner
  const winner = checkWinner(newState)
  if (winner) {
    newState.winner = winner
  } else if (checkDraw(newState)) {
    newState.isDraw = true
  } else {
    // Switch turns
    const currentIndex = newState.players.findIndex((p) => p.id === playerId)
    const nextIndex = (currentIndex + 1) % 2
    newState.currentTurn = newState.players[nextIndex].id
  }

  return newState
}

function checkWinner(state: TicTacToeState): string | null {
  const { board } = state

  // Check rows
  for (let row = 0; row < 3; row++) {
    if (board[row][0] && board[row][0] === board[row][1] && board[row][1] === board[row][2]) {
      return board[row][0]
    }
  }

  // Check columns
  for (let col = 0; col < 3; col++) {
    if (board[0][col] && board[0][col] === board[1][col] && board[1][col] === board[2][col]) {
      return board[0][col]
    }
  }

  // Check diagonals
  if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
    return board[0][0]
  }
  if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
    return board[0][2]
  }

  return null
}

function checkDraw(state: TicTacToeState): boolean {
  // If there's a winner, it's not a draw
  if (state.winner) {
    return false
  }

  // Check if all cells are filled
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (state.board[row][col] === null) {
        return false
      }
    }
  }

  return true
}

/**
 * Returns the score for each player, or null if the game is still in progress.
 * Winner gets score 1, loser/draw gets score 0.
 */
export function getGameScore(state: TicTacToeState): PlayerScores<TicTacToeScore> | null {
  const winnerId = checkWinner(state)
  const isDraw = checkDraw(state)

  if (!winnerId && !isDraw) {
    return null
  }

  const scores: PlayerScores<TicTacToeScore> = new Map()

  for (const player of state.players) {
    const value = winnerId === player.id ? 1 : 0
    scores.set(player.id, {
      value,
      compareTo(other: TicTacToeScore) {
        return this.value - other.value
      },
    })
  }

  return scores
}

export function getPlayerSymbol(state: TicTacToeState, playerId: string): 'X' | 'O' | null {
  const player = state.players.find((p) => p.id === playerId)
  return player?.symbol ?? null
}

export function getCellSymbol(state: TicTacToeState, row: number, col: number): 'X' | 'O' | null {
  const playerId = state.board[row][col]
  if (!playerId) return null
  return getPlayerSymbol(state, playerId)
}
