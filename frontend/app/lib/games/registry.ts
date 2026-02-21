import type { GameDefinition } from '~/lib/types'
import type { TicTacToeState, TicTacToeMove, TicTacToeSettings } from './tic-tac-toe/types'
import type { ReversiState, ReversiMove, ReversiSettings } from './reversi/types'
import * as ticTacToeEngine from './tic-tac-toe/engine'
import * as reversiEngine from './reversi/engine'

export const gameRegistry: Record<string, GameDefinition<unknown, unknown>> = {
  'tic-tac-toe': {
    id: 'tic-tac-toe',
    name: 'Tic Tac Toe',
    description: 'Classic 3x3 grid game. Get three in a row to win!',
    minPlayers: 2,
    maxPlayers: 2,
    component: () => import('~/components/games/tic-tac-toe/Board.vue'),
    resultsComponent: () => import('~/components/games/tic-tac-toe/Results.vue'),
    settingsComponent: () => import('~/components/games/tic-tac-toe/Settings.vue'),
    defaultSettings: (playerIds: string[]) =>
      ticTacToeEngine.defaultSettings(playerIds),
    setupGame: (playerIds: string[], settings: unknown) =>
      ticTacToeEngine.setupGame(playerIds, settings as TicTacToeSettings) as unknown,
    validateMove: (state: unknown, move: unknown, playerId: string) =>
      ticTacToeEngine.validateMove(
        state as TicTacToeState,
        move as TicTacToeMove,
        playerId
      ),
    applyMove: (state: unknown, move: unknown, playerId: string) =>
      ticTacToeEngine.applyMove(
        state as TicTacToeState,
        move as TicTacToeMove,
        playerId
      ) as unknown,
    getGameScore: (state: unknown) =>
      ticTacToeEngine.getGameScore(state as TicTacToeState),
  } as GameDefinition<unknown, unknown>,

  'reversi': {
    id: 'reversi',
    name: 'Reversi',
    description: 'Classic strategy game. Outflank your opponent to capture their discs!',
    minPlayers: 2,
    maxPlayers: 2,
    component: () => import('~/components/games/reversi/Board.vue'),
    resultsComponent: () => import('~/components/games/reversi/Results.vue'),
    settingsComponent: () => import('~/components/games/reversi/Settings.vue'),
    defaultSettings: (playerIds: string[]) =>
      reversiEngine.defaultSettings(playerIds),
    setupGame: (playerIds: string[], settings: unknown) =>
      reversiEngine.setupGame(playerIds, settings as ReversiSettings) as unknown,
    validateMove: (state: unknown, move: unknown, playerId: string) =>
      reversiEngine.validateMove(
        state as ReversiState,
        move as ReversiMove,
        playerId
      ),
    applyMove: (state: unknown, move: unknown, playerId: string) =>
      reversiEngine.applyMove(
        state as ReversiState,
        move as ReversiMove,
        playerId
      ) as unknown,
    getGameScore: (state: unknown) =>
      reversiEngine.getGameScore(state as ReversiState),
  } as GameDefinition<unknown, unknown>,
}

export function getGame(gameType: string): GameDefinition<unknown, unknown> | undefined {
  return gameRegistry[gameType]
}

export function getGameList(): GameDefinition<unknown, unknown>[] {
  return Object.values(gameRegistry)
}

export function getDefaultGame(): GameDefinition<unknown, unknown> {
  return gameRegistry['tic-tac-toe']!
}
