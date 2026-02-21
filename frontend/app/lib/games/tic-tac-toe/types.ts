import type { Comparable, GamePlayer, GameState } from '~/lib/types'

export interface TicTacToePlayer extends GamePlayer {
  symbol: 'X' | 'O'
}

export interface TicTacToeState extends GameState<TicTacToePlayer> {
  board: (string | null)[][] // 3x3, playerId or null
  currentTurn?: string // playerId
  winner: string | null
  isDraw: boolean
}

export interface TicTacToeMove {
  row: number
  col: number
}

export interface TicTacToeScore extends Comparable<TicTacToeScore> {
  value: number
}
