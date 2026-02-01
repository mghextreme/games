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
export interface GameDefinition<TState = unknown, TMove = unknown> {
  id: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  component: () => Promise<{ default: unknown }>
  createInitialState: (playerIds: string[]) => TState
  validateMove: (state: TState, move: TMove, playerId: string) => boolean
  applyMove: (state: TState, move: TMove, playerId: string) => TState
  checkWinner: (state: TState) => string | null
  checkDraw: (state: TState) => boolean
}

// Guest types
export interface GuestState {
  guestId: string
  displayName: string
}
