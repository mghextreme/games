import { describe, it, expect } from 'vitest'
import {
  setupGame,
  defaultSettings,
  validateMove,
  applyMove,
  getGameScore,
  getPlayerBoard,
  getWallColumnForColor,
} from '~/lib/games/azul/engine'
import type { AzulState, AzulMove, AzulSettings, TileColor } from '~/lib/games/azul/types'
import { TILE_COLORS, WALL_PATTERN } from '~/lib/games/azul/types'

describe('Azul Engine', () => {
  const playerIds2 = ['player1', 'player2']
  const playerIds3 = ['player1', 'player2', 'player3']
  const playerIds4 = ['player1', 'player2', 'player3', 'player4']

  const makeSettings = (playerIds: string[], overrides?: Partial<AzulSettings>): AzulSettings => ({
    ...defaultSettings(playerIds),
    ...overrides,
  })

  describe('setupGame', () => {
    it('should create a valid initial state for 2 players', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))

      expect(state.players).toHaveLength(2)
      expect(state.currentTurn).toBe('player1')
      expect(state.winner).toBeNull()
      expect(state.isDraw).toBe(false)
      expect(state.round).toBe(1)
      expect(state.phase).toBe('pick')
      expect(state.firstPlayerMarkerInCenter).toBe(true)
      expect(state.center).toEqual([])
    })

    it('should create correct number of factories for 2 players', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      // 2 * 2 + 1 = 5 factories
      expect(state.factories).toHaveLength(5)
    })

    it('should create correct number of factories for 3 players', () => {
      const state = setupGame(playerIds3, defaultSettings(playerIds3))
      // 3 * 2 + 1 = 7 factories
      expect(state.factories).toHaveLength(7)
    })

    it('should create correct number of factories for 4 players', () => {
      const state = setupGame(playerIds4, defaultSettings(playerIds4))
      // 4 * 2 + 1 = 9 factories
      expect(state.factories).toHaveLength(9)
    })

    it('should fill each factory with 4 tiles', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      for (const factory of state.factories) {
        expect(factory.tiles).toHaveLength(4)
      }
    })

    it('should have all tiles be valid colors', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      for (const factory of state.factories) {
        for (const tile of factory.tiles) {
          expect(TILE_COLORS).toContain(tile)
        }
      }
    })

    it('should initialize player boards correctly', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      for (const player of state.players) {
        expect(player.board.score).toBe(0)
        expect(player.board.floorLine).toEqual([])
        expect(player.board.hasFirstPlayerMarker).toBe(false)
        expect(player.board.patternLines).toHaveLength(5)
        for (let i = 0; i < 5; i++) {
          expect(player.board.patternLines[i]!.color).toBeNull()
          expect(player.board.patternLines[i]!.count).toBe(0)
        }
        expect(player.board.wall).toHaveLength(5)
        for (const row of player.board.wall) {
          expect(row).toHaveLength(5)
          expect(row.every((cell) => cell === false)).toBe(true)
        }
      }
    })

    it('should use 100 tiles total (20 of each color)', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      const allTiles: TileColor[] = []
      for (const factory of state.factories) {
        allTiles.push(...factory.tiles)
      }
      allTiles.push(...state.bag)
      allTiles.push(...state.discard)
      expect(allTiles).toHaveLength(100)

      const counts = new Map<TileColor, number>()
      for (const tile of allTiles) {
        counts.set(tile, (counts.get(tile) ?? 0) + 1)
      }
      for (const color of TILE_COLORS) {
        expect(counts.get(color)).toBe(20)
      }
    })

    it('should throw error with less than 2 players', () => {
      expect(() => setupGame(['player1'], defaultSettings(['player1']))).toThrow()
    })

    it('should throw error with more than 4 players', () => {
      const ids = ['p1', 'p2', 'p3', 'p4', 'p5']
      expect(() => setupGame(ids, defaultSettings(ids))).toThrow()
    })

    it('should respect custom starting player', () => {
      const settings = makeSettings(playerIds2, { startingPlayerId: 'player2' })
      const state = setupGame(playerIds2, settings)
      expect(state.currentTurn).toBe('player2')
      expect(state.firstPlayerId).toBe('player2')
    })
  })

  describe('getWallColumnForColor', () => {
    it('should return correct column for each color in row 0', () => {
      expect(getWallColumnForColor(0, 'blue')).toBe(0)
      expect(getWallColumnForColor(0, 'yellow')).toBe(1)
      expect(getWallColumnForColor(0, 'red')).toBe(2)
      expect(getWallColumnForColor(0, 'black')).toBe(3)
      expect(getWallColumnForColor(0, 'teal')).toBe(4)
    })

    it('should rotate colors across rows', () => {
      // Row 1 starts with teal
      expect(getWallColumnForColor(1, 'teal')).toBe(0)
      expect(getWallColumnForColor(1, 'blue')).toBe(1)
    })

    it('should have each color appear once per row', () => {
      for (let row = 0; row < 5; row++) {
        const cols = TILE_COLORS.map((c) => getWallColumnForColor(row, c))
        const uniqueCols = new Set(cols)
        expect(uniqueCols.size).toBe(5)
      }
    })
  })

  describe('validateMove', () => {
    it('should validate picking from a factory to a pattern line', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      const firstColor = state.factories[0]!.tiles[0]!

      const move: AzulMove = {
        sourceIndex: 0,
        color: firstColor,
        patternLineIndex: 0,
      }

      expect(validateMove(state, move, 'player1')).toBe(true)
    })

    it('should reject move when not player turn', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      const firstColor = state.factories[0]!.tiles[0]!

      const move: AzulMove = {
        sourceIndex: 0,
        color: firstColor,
        patternLineIndex: 0,
      }

      expect(validateMove(state, move, 'player2')).toBe(false)
    })

    it('should reject move when game is over', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      state.winner = 'player1'
      const firstColor = state.factories[0]!.tiles[0]!

      expect(validateMove(state, { sourceIndex: 0, color: firstColor, patternLineIndex: 0 }, 'player1')).toBe(false)
    })

    it('should reject picking a color not present in the source', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      // Find a color not in factory 0
      const factoryColors = new Set(state.factories[0]!.tiles)
      const missingColor = TILE_COLORS.find((c) => !factoryColors.has(c))

      if (missingColor) {
        const move: AzulMove = {
          sourceIndex: 0,
          color: missingColor,
          patternLineIndex: 0,
        }
        expect(validateMove(state, move, 'player1')).toBe(false)
      }
    })

    it('should reject invalid source index', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      const move: AzulMove = {
        sourceIndex: 99,
        color: 'blue',
        patternLineIndex: 0,
      }

      expect(validateMove(state, move, 'player1')).toBe(false)
    })

    it('should reject invalid pattern line index', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      const firstColor = state.factories[0]!.tiles[0]!

      expect(validateMove(state, { sourceIndex: 0, color: firstColor, patternLineIndex: 5 }, 'player1')).toBe(false)
    })

    it('should allow placing directly on floor', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      const firstColor = state.factories[0]!.tiles[0]!

      const move: AzulMove = {
        sourceIndex: 0,
        color: firstColor,
        patternLineIndex: -1,
      }

      expect(validateMove(state, move, 'player1')).toBe(true)
    })

    it('should reject placing on a pattern line with a different color', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      const player = state.players.find((p) => p.id === 'player1')!

      // Manually set a pattern line to have a color
      player.board.patternLines[2]!.color = 'blue'
      player.board.patternLines[2]!.count = 1

      // Try to place a different color
      // First, ensure factory 0 has 'red'
      state.factories[0]!.tiles = ['red', 'red', 'blue', 'blue']

      const move: AzulMove = {
        sourceIndex: 0,
        color: 'red',
        patternLineIndex: 2,
      }

      expect(validateMove(state, move, 'player1')).toBe(false)
    })

    it('should reject placing on a full pattern line', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      const player = state.players.find((p) => p.id === 'player1')!

      // Fill pattern line 0 (size 1)
      player.board.patternLines[0]!.color = 'blue'
      player.board.patternLines[0]!.count = 1

      state.factories[0]!.tiles = ['blue', 'red', 'red', 'red']

      const move: AzulMove = {
        sourceIndex: 0,
        color: 'blue',
        patternLineIndex: 0,
      }

      expect(validateMove(state, move, 'player1')).toBe(false)
    })

    it('should reject placing color already on wall in that row', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      const player = state.players.find((p) => p.id === 'player1')!

      // Place blue on wall at row 0 (blue goes to col 0)
      player.board.wall[0]![0] = true

      state.factories[0]!.tiles = ['blue', 'blue', 'red', 'red']

      const move: AzulMove = {
        sourceIndex: 0,
        color: 'blue',
        patternLineIndex: 0,
      }

      expect(validateMove(state, move, 'player1')).toBe(false)
    })
  })

  describe('applyMove', () => {
    it('should pick tiles from factory and place on pattern line', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      // Set up factory 0 with known tiles
      state.factories[0]!.tiles = ['blue', 'blue', 'red', 'yellow']

      const move: AzulMove = {
        sourceIndex: 0,
        color: 'blue',
        patternLineIndex: 1, // row 1, size 2
      }

      const newState = applyMove(state, move, 'player1')
      const player = newState.players.find((p) => p.id === 'player1')!

      // 2 blue tiles placed on pattern line 1
      expect(player.board.patternLines[1]!.color).toBe('blue')
      expect(player.board.patternLines[1]!.count).toBe(2)

      // Factory should be empty
      expect(newState.factories[0]!.tiles).toEqual([])

      // Remaining tiles go to center
      expect(newState.center).toContain('red')
      expect(newState.center).toContain('yellow')
    })

    it('should move remaining tiles from factory to center', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      state.factories[0]!.tiles = ['blue', 'red', 'red', 'yellow']

      const move: AzulMove = {
        sourceIndex: 0,
        color: 'blue',
        patternLineIndex: 0,
      }

      const newState = applyMove(state, move, 'player1')

      // Center should have the non-blue tiles
      expect(newState.center.filter((t) => t === 'red')).toHaveLength(2)
      expect(newState.center.filter((t) => t === 'yellow')).toHaveLength(1)
    })

    it('should overflow tiles to floor line', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      state.factories[0]!.tiles = ['blue', 'blue', 'blue', 'red']

      // Place 3 blue tiles on pattern line 0 (size 1) - only 1 fits, 2 overflow
      const move: AzulMove = {
        sourceIndex: 0,
        color: 'blue',
        patternLineIndex: 0,
      }

      const newState = applyMove(state, move, 'player1')
      const player = newState.players.find((p) => p.id === 'player1')!

      expect(player.board.patternLines[0]!.count).toBe(1)
      expect(player.board.floorLine).toHaveLength(2)
    })

    it('should place all tiles on floor when patternLineIndex is -1', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      state.factories[0]!.tiles = ['blue', 'blue', 'red', 'red']

      const move: AzulMove = {
        sourceIndex: 0,
        color: 'blue',
        patternLineIndex: -1,
      }

      const newState = applyMove(state, move, 'player1')
      const player = newState.players.find((p) => p.id === 'player1')!

      expect(player.board.floorLine.filter((t) => t === 'blue')).toHaveLength(2)
    })

    it('should give first player marker when taking from center first time', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      state.center = ['blue', 'red']
      state.firstPlayerMarkerInCenter = true

      const move: AzulMove = {
        sourceIndex: -1,
        color: 'blue',
        patternLineIndex: 0,
      }

      const newState = applyMove(state, move, 'player1')
      const player = newState.players.find((p) => p.id === 'player1')!

      expect(player.board.hasFirstPlayerMarker).toBe(true)
      expect(newState.firstPlayerMarkerInCenter).toBe(false)
      expect(newState.firstPlayerId).toBe('player1')
    })

    it('should switch turns after a move', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      const firstColor = state.factories[0]!.tiles[0]!

      const move: AzulMove = {
        sourceIndex: 0,
        color: firstColor,
        patternLineIndex: 0,
      }

      const newState = applyMove(state, move, 'player1')
      expect(newState.currentTurn).toBe('player2')
    })

    it('should cycle turns correctly for 3 players', () => {
      const state = setupGame(playerIds3, defaultSettings(playerIds3))

      let current = state
      for (let i = 0; i < 3; i++) {
        const turnPlayer = current.currentTurn!
        const firstColor = current.factories[0]!.tiles[0]!
        current = applyMove(current, {
          sourceIndex: 0,
          color: firstColor,
          patternLineIndex: -1,
        }, turnPlayer)
      }

      // After 3 moves, should be back to player1
      expect(current.currentTurn).toBe('player1')
    })

    it('should not mutate original state', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      const originalFactory = [...state.factories[0]!.tiles]
      const firstColor = state.factories[0]!.tiles[0]!

      applyMove(state, {
        sourceIndex: 0,
        color: firstColor,
        patternLineIndex: 0,
      }, 'player1')

      expect(state.factories[0]!.tiles).toEqual(originalFactory)
      expect(state.center).toEqual([])
    })
  })

  describe('scoring', () => {
    it('should score 1 point for a tile with no adjacencies', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      // Manually set up: player1 has pattern line 0 full with blue
      const player = state.players.find((p) => p.id === 'player1')!
      player.board.patternLines[0]!.color = 'blue'
      player.board.patternLines[0]!.count = 1

      // Empty everything to trigger round end
      state.factories = state.factories.map(() => ({ tiles: [] }))
      state.center = ['red'] // one tile left for someone to pick
      state.bag = []

      // Player1 picks the last tile from center
      const newState = applyMove(state, {
        sourceIndex: -1,
        color: 'red',
        patternLineIndex: -1,
      }, 'player1')

      // Round should have scored. Player1 should have blue on wall row 0 col 0
      const p1 = newState.players.find((p) => p.id === 'player1')!
      expect(p1.board.wall[0]![0]).toBe(true) // blue in row 0 = col 0
      // Score = 1 (isolated tile) - 1 (floor penalty for red) = 0 (min 0)
      // But also first player marker penalty adds 1 more floor entry
      // hasFirstPlayerMarker = true, floor has 1 red tile + marker = 2 floor items
      // Penalty for 2 items = -1 + -1 = -2
      // Score = 1 - 2 = -1 -> clamped to 0
      expect(p1.board.score).toBe(0)
    })

    it('should score adjacency bonuses for connected tiles', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      const player = state.players.find((p) => p.id === 'player1')!

      // Place a tile on wall already: blue at (0,0)
      player.board.wall[0]![0] = true
      player.board.score = 1

      // Now set up pattern line 1 with teal (row 1, col 0 = teal per WALL_PATTERN)
      player.board.patternLines[1]!.color = 'teal'
      player.board.patternLines[1]!.count = 2

      // Trigger round end
      state.factories = state.factories.map(() => ({ tiles: [] }))
      state.center = ['yellow']
      state.bag = []

      const newState = applyMove(state, {
        sourceIndex: -1,
        color: 'yellow',
        patternLineIndex: -1,
      }, 'player1')

      const p1 = newState.players.find((p) => p.id === 'player1')!
      // Teal on (1,0): vertically adjacent to (0,0) = 2 points vertical
      // No horizontal adjacencies = just the vertical score
      // Previous score was 1
      // Floor: 1 yellow tile + first player marker = 2 items, penalty = -2
      // New score = 1 + 2 - 2 = 1
      expect(p1.board.wall[1]![0]).toBe(true)
      expect(p1.board.score).toBe(1)
    })
  })

  describe('getGameScore', () => {
    it('should return scores for all players', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      state.players[0]!.board.score = 15
      state.players[1]!.board.score = 10

      const scores = getGameScore(state)

      expect(scores.get('player1')!.value).toBe(15)
      expect(scores.get('player2')!.value).toBe(10)
    })

    it('should sort correctly via compareTo', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      state.players[0]!.board.score = 20
      state.players[1]!.board.score = 15

      const scores = getGameScore(state)
      const s1 = scores.get('player1')!
      const s2 = scores.get('player2')!

      expect(s1.compareTo(s2)).toBeGreaterThan(0)
      expect(s2.compareTo(s1)).toBeLessThan(0)
    })

    it('should return 0 compareTo for equal scores', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      state.players[0]!.board.score = 10
      state.players[1]!.board.score = 10

      const scores = getGameScore(state)
      const s1 = scores.get('player1')!
      const s2 = scores.get('player2')!

      expect(s1.compareTo(s2)).toBe(0)
    })
  })

  describe('getPlayerBoard', () => {
    it('should return the board for a known player', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      const board = getPlayerBoard(state, 'player1')
      expect(board).not.toBeNull()
      expect(board!.score).toBe(0)
    })

    it('should return null for unknown player', () => {
      const state = setupGame(playerIds2, defaultSettings(playerIds2))
      expect(getPlayerBoard(state, 'unknown')).toBeNull()
    })
  })

  describe('game flow', () => {
    it('should play multiple turns without error', () => {
      let state = setupGame(playerIds2, defaultSettings(playerIds2))

      // Play several turns
      for (let i = 0; i < 10; i++) {
        const currentPlayer = state.currentTurn!
        if (!currentPlayer || state.winner || state.isDraw) break

        // Find a valid move
        let moved = false
        // Try factories first
        for (let fi = 0; fi < state.factories.length && !moved; fi++) {
          const tiles = state.factories[fi]!.tiles
          if (tiles.length === 0) continue

          const color = tiles[0]!
          // Try each pattern line
          for (let pl = 0; pl < 5 && !moved; pl++) {
            const move: AzulMove = { sourceIndex: fi, color, patternLineIndex: pl }
            if (validateMove(state, move, currentPlayer)) {
              state = applyMove(state, move, currentPlayer)
              moved = true
            }
          }
          if (!moved) {
            // Try floor
            const move: AzulMove = { sourceIndex: fi, color, patternLineIndex: -1 }
            if (validateMove(state, move, currentPlayer)) {
              state = applyMove(state, move, currentPlayer)
              moved = true
            }
          }
        }

        // Try center
        if (!moved && state.center.length > 0) {
          const color = state.center[0]!
          const move: AzulMove = { sourceIndex: -1, color, patternLineIndex: -1 }
          if (validateMove(state, move, currentPlayer)) {
            state = applyMove(state, move, currentPlayer)
            moved = true
          }
        }

        // If no move was possible, something is wrong
        if (!moved && state.phase === 'pick') {
          throw new Error(`No valid move found for ${currentPlayer} on turn ${i}`)
        }
      }

      // After playing, state should still be valid
      expect(state.players).toHaveLength(2)
      expect(state.round).toBeGreaterThanOrEqual(1)
    })

    it('should start a new round when all tiles are taken', () => {
      let state = setupGame(playerIds2, defaultSettings(playerIds2))
      const initialRound = state.round

      // Play until round changes (drain all factories and center)
      let moves = 0
      while (state.round === initialRound && moves < 200) {
        const currentPlayer = state.currentTurn!
        if (!currentPlayer || state.winner || state.isDraw) break

        // Find first valid move
        let moved = false
        for (let fi = 0; fi < state.factories.length && !moved; fi++) {
          if (state.factories[fi]!.tiles.length === 0) continue
          const color = state.factories[fi]!.tiles[0]!
          const move: AzulMove = { sourceIndex: fi, color, patternLineIndex: -1 }
          if (validateMove(state, move, currentPlayer)) {
            state = applyMove(state, move, currentPlayer)
            moved = true
          }
        }
        if (!moved && state.center.length > 0) {
          const color = state.center[0]!
          const move: AzulMove = { sourceIndex: -1, color, patternLineIndex: -1 }
          if (validateMove(state, move, currentPlayer)) {
            state = applyMove(state, move, currentPlayer)
            moved = true
          }
        }
        if (!moved) break
        moves++
      }

      // Round should have advanced (unless game ended)
      if (!state.winner && !state.isDraw) {
        expect(state.round).toBe(initialRound + 1)
        // New round should have full factories again
        for (const factory of state.factories) {
          expect(factory.tiles.length).toBeLessThanOrEqual(4)
        }
      }
    })
  })

  describe('wall pattern', () => {
    it('should have each color appear exactly once per row', () => {
      for (let row = 0; row < 5; row++) {
        const colors = new Set(WALL_PATTERN[row]!)
        expect(colors.size).toBe(5)
        for (const color of TILE_COLORS) {
          expect(colors.has(color)).toBe(true)
        }
      }
    })

    it('should have each color appear exactly once per column', () => {
      for (let col = 0; col < 5; col++) {
        const colors = new Set<TileColor>()
        for (let row = 0; row < 5; row++) {
          colors.add(WALL_PATTERN[row]![col]!)
        }
        expect(colors.size).toBe(5)
      }
    })
  })
})
