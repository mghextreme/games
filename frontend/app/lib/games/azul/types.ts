import type { Comparable, GamePlayer, GameState, GameSettings, PlayerSettings } from '~/lib/types'

/** The 5 tile colors in Azul */
export type TileColor = 'blue' | 'yellow' | 'red' | 'black' | 'teal'
export const TILE_COLORS: TileColor[] = ['blue', 'yellow', 'red', 'black', 'teal']

/** Display hex colors for each tile */
export const TILE_HEX: Record<TileColor, string> = {
  blue: '#2980b9',
  yellow: '#f1c40f',
  red: '#e74c3c',
  black: '#2c3e50',
  teal: '#1abc9c',
}

/**
 * The standard Azul wall pattern. Each row is shifted by one position.
 * wall[row][col] = TileColor
 */
export const WALL_PATTERN: TileColor[][] = [
  ['blue', 'yellow', 'red', 'black', 'teal'],
  ['teal', 'blue', 'yellow', 'red', 'black'],
  ['black', 'teal', 'blue', 'yellow', 'red'],
  ['red', 'black', 'teal', 'blue', 'yellow'],
  ['yellow', 'red', 'black', 'teal', 'blue'],
]

/** Floor line penalty values per position (1-indexed by index) */
export const FLOOR_PENALTIES = [-1, -1, -2, -2, -2, -3, -3]

/** A single factory display with up to 4 tiles */
export interface FactoryDisplay {
  tiles: TileColor[]
}

/** A pattern line on a player's board (row index 0 = size 1, row index 4 = size 5) */
export interface PatternLine {
  color: TileColor | null // null if empty
  count: number // how many tiles placed (0 to rowSize)
}

/** A player's board state */
export interface AzulPlayerBoard {
  /** 5 pattern lines (staging area). Index 0 holds 1 tile max, index 4 holds 5 max. */
  patternLines: PatternLine[]
  /** 5x5 wall grid. true = tile placed, false = empty. */
  wall: boolean[][]
  /** Floor line: tiles that incur penalties */
  floorLine: TileColor[]
  /** Whether this player has the first player marker for the floor penalty */
  hasFirstPlayerMarker: boolean
  /** Running score (updated each round) */
  score: number
}

export interface AzulPlayer extends GamePlayer {
  board: AzulPlayerBoard
}

export interface AzulState extends GameState<AzulPlayer> {
  /** Factory displays (not including center) */
  factories: FactoryDisplay[]
  /** Center pool of tiles */
  center: TileColor[]
  /** Whether the first player marker is still in the center (unclaimed this round) */
  firstPlayerMarkerInCenter: boolean
  /** The tile bag: tiles available to draw */
  bag: TileColor[]
  /** Discarded tiles (go back to bag when bag is empty) */
  discard: TileColor[]
  /** Current turn player ID */
  currentTurn?: string
  /** Player who has the first player marker (goes first next round) */
  firstPlayerId: string
  /** Current round number (1-based) */
  round: number
  /** Phase: 'pick' = picking tiles, 'done' = round scored, game may continue or end */
  phase: 'pick' | 'done'
  winner: string | null
  isDraw: boolean
}

/**
 * A move in Azul: pick all tiles of a color from a source, place on a pattern line.
 * sourceIndex: -1 for center, 0+ for factory index
 * color: which color to pick
 * patternLineIndex: 0-4 for pattern lines, -1 for floor (discard directly)
 */
export interface AzulMove {
  sourceIndex: number
  color: TileColor
  patternLineIndex: number
}

export interface AzulScore extends Comparable<AzulScore> {
  value: number
}

export interface AzulPlayerSettings extends PlayerSettings {
  // No per-player customization for Azul currently
}

export interface AzulSettings extends GameSettings {
  playerSettings: Record<string, AzulPlayerSettings>
  /** Player ID of who goes first in round 1 */
  startingPlayerId: string
}
