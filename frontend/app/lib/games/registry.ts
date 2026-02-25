import type { GameDefinition } from '~/lib/types'
import type { TicTacToeState, TicTacToeMove, TicTacToeSettings } from './tic-tac-toe/types'
import type { ReversiState, ReversiMove, ReversiSettings } from './reversi/types'
import type { AzulState, AzulMove, AzulSettings } from './azul/types'
import * as ticTacToeEngine from './tic-tac-toe/engine'
import * as reversiEngine from './reversi/engine'
import * as azulEngine from './azul/engine'

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

  'azul': {
    id: 'azul',
    name: 'Azul',
    description: 'Tile-drafting strategy game. Collect tiles and fill your wall to score points!',
    minPlayers: 2,
    maxPlayers: 4,
    component: () => import('~/components/games/azul/Board.vue'),
    resultsComponent: () => import('~/components/games/azul/Results.vue'),
    settingsComponent: () => import('~/components/games/azul/Settings.vue'),
    defaultSettings: (playerIds: string[]) =>
      azulEngine.defaultSettings(playerIds),
    setupGame: (playerIds: string[], settings: unknown) =>
      azulEngine.setupGame(playerIds, settings as AzulSettings) as unknown,
    validateMove: (state: unknown, move: unknown, playerId: string) =>
      azulEngine.validateMove(
        state as AzulState,
        move as AzulMove,
        playerId
      ),
    applyMove: (state: unknown, move: unknown, playerId: string) =>
      azulEngine.applyMove(
        state as AzulState,
        move as AzulMove,
        playerId
      ) as unknown,
    getGameScore: (state: unknown) =>
      azulEngine.getGameScore(state as AzulState),
  } as GameDefinition<unknown, unknown>,
}

export function getGame(gameType: string): GameDefinition<unknown, unknown> | undefined {
  return gameRegistry[gameType]
}

export function getGameList(): GameDefinition<unknown, unknown>[] {
  return Object.values(gameRegistry).sort((a, b) => a.name.localeCompare(b.name))
}

export function getDefaultGame(): GameDefinition<unknown, unknown> {
  return gameRegistry['tic-tac-toe']!
}
