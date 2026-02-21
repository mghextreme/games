import type { Comparable, GamePlayer, GameState, GameSettings, PlayerSettings } from '~/lib/types'

export interface ReversiPlayer extends GamePlayer {
  color: string // hex color from preset palette
}

export interface ReversiState extends GameState<ReversiPlayer> {
  board: (string | null)[][] // NxN grid, playerId or null
  boardSize: number // 6, 8, or 10
  currentTurn?: string // playerId
  winner: string | null
  isDraw: boolean
  lastMoveWasPass: boolean
  lastMove: { row: number; col: number } | null // for highlighting the last placed disc
  flippedCells: { row: number; col: number }[] // cells flipped by the last move (for animation)
}

export interface ReversiMove {
  row: number
  col: number
  pass: boolean // true when player has no valid placements
}

export interface ReversiScore extends Comparable<ReversiScore> {
  value: number // disc count
}

export interface ReversiPlayerSettings extends PlayerSettings {
  color: string // hex color from preset palette
}

export interface ReversiSettings extends GameSettings {
  playerSettings: Record<string, ReversiPlayerSettings>
  /** Player ID of who goes first */
  startingPlayerId: string
  /** Board size: 6, 8, or 10 */
  boardSize: number
}

/** Preset color palette for Reversi discs */
export const REVERSI_COLORS = [
  { name: 'Black', hex: '#1a1a2e' },
  { name: 'White', hex: '#f0f0f0' },
  { name: 'Red', hex: '#e74c3c' },
  { name: 'Blue', hex: '#3498db' },
  { name: 'Orange', hex: '#e67e22' },
  { name: 'Purple', hex: '#9b59b6' },
  { name: 'Pink', hex: '#e84393' },
  { name: 'Yellow', hex: '#f1c40f' },
  { name: 'Green', hex: '#2ecc71' },
  { name: 'Teal', hex: '#1abc9c' },
] as const
