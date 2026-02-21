import type { Id } from '../../../convex/_generated/dataModel'

// Room types (Convex)
export interface Room {
  _id: Id<'rooms'>
  _creationTime: number
  name: string
  password?: string
  hostGuestId: string
  hostDisplayName: string
  gameType: string
  status: 'waiting' | 'playing' | 'finished'
  gameState?: unknown
  maxPlayers: number
  lastActivity: number
}

export interface RoomWithDetails extends Room {
  playerCount: number
  playerGuestIds: string[]
  hasPassword: boolean
}

// Player types (Convex)
export interface Player {
  _id: Id<'players'>
  _creationTime: number
  roomId: Id<'rooms'>
  guestId: string
  displayName: string
  isConnected: boolean
  lastSeen: number
}

export interface PlayerWithDetails extends Player {
  isHost: boolean
  isCurrentUser?: boolean
}

// Game types

/** Base interface for a player within a game. Each game extends this with game-specific attributes. */
export interface GamePlayer {
  id: string
}

/** Base interface for game state. Each game extends this with game-specific fields. */
export interface GameState<TPlayer extends GamePlayer = GamePlayer> {
  players: TPlayer[]
}

/** Score values must be sortable via compareTo. Higher = better. */
export interface Comparable<T> {
  compareTo(other: T): number
}

export type PlayerScores<TScore extends Comparable<TScore>> = Map<string, TScore>

export interface GameDefinition<TState = unknown, TMove = unknown, TScore extends Comparable<TScore> = Comparable<unknown>> {
  id: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  component: () => Promise<{ default: unknown }>
  setupGame: (playerIds: string[]) => TState
  validateMove: (state: TState, move: TMove, playerId: string) => boolean
  applyMove: (state: TState, move: TMove, playerId: string) => TState
  getGameScore: (state: TState) => PlayerScores<TScore> | null
}

// Guest types
export interface GuestState {
  guestId: string
  displayName: string
}
