import type { ReversiState, ReversiMove, ReversiScore, ReversiSettings } from './types'
import type { PlayerScores } from '~/lib/types'

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
] as const

export function defaultSettings(playerIds: string[]): ReversiSettings {
  const p1 = playerIds[0]!
  const p2 = playerIds[1]!
  return {
    playerSettings: {
      [p1]: { color: '#1a1a2e' },
      [p2]: { color: '#f0f0f0' },
    },
    startingPlayerId: p1,
    boardSize: 8,
  }
}

export function setupGame(playerIds: string[], settings: ReversiSettings): ReversiState {
  if (playerIds.length !== 2) {
    throw new Error('Reversi requires exactly 2 players')
  }

  const size = settings.boardSize
  const board: (string | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  )

  // Place initial 4 pieces in the center
  const mid = size / 2
  // Standard Reversi opening: second player top-left & bottom-right of center,
  // first player top-right & bottom-left of center
  // (First player = startingPlayerId, traditionally "dark")
  const startingPlayer = settings.startingPlayerId
  const otherPlayer = playerIds.find((id) => id !== startingPlayer)!

  board[mid - 1]![mid - 1] = otherPlayer
  board[mid - 1]![mid] = startingPlayer
  board[mid]![mid - 1] = startingPlayer
  board[mid]![mid] = otherPlayer

  return {
    board,
    boardSize: size,
    currentTurn: settings.startingPlayerId,
    winner: null,
    isDraw: false,
    lastMoveWasPass: false,
    lastMove: null,
    flippedCells: [],
    players: playerIds.map((id) => ({
      id,
      color: settings.playerSettings[id]!.color,
    })),
  }
}

/**
 * Get cells that would be flipped in a single direction from (row, col) for playerId.
 */
function getFlipsInDirection(
  board: (string | null)[][],
  row: number,
  col: number,
  dr: number,
  dc: number,
  playerId: string,
  boardSize: number
): { row: number; col: number }[] {
  const flips: { row: number; col: number }[] = []
  let r = row + dr
  let c = col + dc

  // Walk in the direction, collecting opponent pieces
  while (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
    const cell = board[r]![c]
    if (cell === null) {
      // Empty cell - no flips in this direction
      return []
    }
    if (cell === playerId) {
      // Found our own piece - return collected flips
      return flips
    }
    // Opponent piece - collect it
    flips.push({ row: r, col: c })
    r += dr
    c += dc
  }

  // Reached board edge without finding our piece
  return []
}

/**
 * Get all cells that would be flipped by placing a disc at (row, col) for playerId.
 */
function getAllFlips(
  board: (string | null)[][],
  row: number,
  col: number,
  playerId: string,
  boardSize: number
): { row: number; col: number }[] {
  const allFlips: { row: number; col: number }[] = []
  for (const [dr, dc] of DIRECTIONS) {
    const flips = getFlipsInDirection(board, row, col, dr, dc, playerId, boardSize)
    allFlips.push(...flips)
  }
  return allFlips
}

/**
 * Get all valid placement positions for a player.
 */
export function getValidMoves(
  state: ReversiState,
  playerId: string
): { row: number; col: number }[] {
  const moves: { row: number; col: number }[] = []
  for (let row = 0; row < state.boardSize; row++) {
    for (let col = 0; col < state.boardSize; col++) {
      if (state.board[row]![col] !== null) continue
      const flips = getAllFlips(state.board, row, col, playerId, state.boardSize)
      if (flips.length > 0) {
        moves.push({ row, col })
      }
    }
  }
  return moves
}

/**
 * Check if a player has any valid moves.
 */
function hasValidMoves(state: ReversiState, playerId: string): boolean {
  for (let row = 0; row < state.boardSize; row++) {
    for (let col = 0; col < state.boardSize; col++) {
      if (state.board[row]![col] !== null) continue
      const flips = getAllFlips(state.board, row, col, playerId, state.boardSize)
      if (flips.length > 0) return true
    }
  }
  return false
}

export function validateMove(
  state: ReversiState,
  move: ReversiMove,
  playerId: string
): boolean {
  // Game must not be over
  if (state.winner || state.isDraw) return false

  // Must be this player's turn
  if (state.currentTurn !== playerId) return false

  if (move.pass) {
    // Pass is only valid when the player has no valid placements
    return !hasValidMoves(state, playerId)
  }

  // Check bounds
  if (move.row < 0 || move.row >= state.boardSize || move.col < 0 || move.col >= state.boardSize) {
    return false
  }

  // Cell must be empty
  if (state.board[move.row]![move.col] !== null) return false

  // Must flip at least one disc
  const flips = getAllFlips(state.board, move.row, move.col, playerId, state.boardSize)
  return flips.length > 0
}

export function applyMove(
  state: ReversiState,
  move: ReversiMove,
  playerId: string
): ReversiState {
  // Deep copy state
  const newState: ReversiState = {
    ...state,
    board: state.board.map((row) => [...row]),
    players: [...state.players],
    flippedCells: [],
    lastMove: null,
  }

  const otherPlayerId = newState.players.find((p) => p.id !== playerId)!.id

  if (move.pass) {
    if (state.lastMoveWasPass) {
      // Both players passed consecutively - game over
      finishGame(newState)
    } else {
      newState.lastMoveWasPass = true
      newState.currentTurn = otherPlayerId
    }
    return newState
  }

  // Place the disc
  newState.board[move.row]![move.col] = playerId
  newState.lastMove = { row: move.row, col: move.col }
  newState.lastMoveWasPass = false

  // Flip captured discs
  const flips = getAllFlips(state.board, move.row, move.col, playerId, state.boardSize)
  for (const flip of flips) {
    newState.board[flip.row]![flip.col] = playerId
  }
  newState.flippedCells = flips

  // Check if game is over (board full)
  if (isBoardFull(newState)) {
    finishGame(newState)
    return newState
  }

  // Switch turns - but auto-skip if opponent has no valid moves
  if (hasValidMoves(newState, otherPlayerId)) {
    newState.currentTurn = otherPlayerId
  } else if (hasValidMoves(newState, playerId)) {
    // Opponent has no moves, current player goes again
    newState.currentTurn = playerId
  } else {
    // Neither player has moves - game over
    finishGame(newState)
  }

  return newState
}

function isBoardFull(state: ReversiState): boolean {
  for (let row = 0; row < state.boardSize; row++) {
    for (let col = 0; col < state.boardSize; col++) {
      if (state.board[row]![col] === null) return false
    }
  }
  return true
}

function finishGame(state: ReversiState): void {
  const counts = getDiscCounts(state)
  const player1 = state.players[0]!
  const player2 = state.players[1]!
  const count1 = counts.get(player1.id) ?? 0
  const count2 = counts.get(player2.id) ?? 0

  if (count1 > count2) {
    state.winner = player1.id
  } else if (count2 > count1) {
    state.winner = player2.id
  } else {
    state.isDraw = true
  }
  state.currentTurn = undefined
}

/**
 * Count discs for each player.
 */
export function getDiscCounts(state: ReversiState): Map<string, number> {
  const counts = new Map<string, number>()
  for (const player of state.players) {
    counts.set(player.id, 0)
  }
  for (let row = 0; row < state.boardSize; row++) {
    for (let col = 0; col < state.boardSize; col++) {
      const cell = state.board[row]![col] as string | null
      if (cell !== null) {
        counts.set(cell, (counts.get(cell) ?? 0) + 1)
      }
    }
  }
  return counts
}

/**
 * Returns the score for each player. Always returns scores (disc counts),
 * even during an in-progress game. This enables live score displays.
 */
export function getGameScore(state: ReversiState): PlayerScores<ReversiScore> {
  const counts = getDiscCounts(state)
  const scores: PlayerScores<ReversiScore> = new Map()

  for (const player of state.players) {
    const value = counts.get(player.id) ?? 0
    scores.set(player.id, {
      value,
      compareTo(other: ReversiScore) {
        return this.value - other.value
      },
    })
  }

  return scores
}

/**
 * Get the color for a player.
 */
export function getPlayerColor(state: ReversiState, playerId: string): string | null {
  const player = state.players.find((p) => p.id === playerId)
  return player?.color ?? null
}
