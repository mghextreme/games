import { describe, it, expect } from 'vitest'
import {
  setupGame,
  defaultSettings,
  validateMove,
  applyMove,
  getGameScore,
  getValidMoves,
  getDiscCounts,
  getPlayerColor,
} from '~/lib/games/reversi/engine'
import type { ReversiState, ReversiMove, ReversiSettings } from '~/lib/games/reversi/types'

describe('Reversi Engine', () => {
  const playerIds = ['player1', 'player2']

  const makeSettings = (overrides?: Partial<ReversiSettings>): ReversiSettings => ({
    ...defaultSettings(playerIds),
    ...overrides,
  })

  describe('setupGame', () => {
    it('should create a valid initial state for 8x8 board', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))

      expect(state.boardSize).toBe(8)
      expect(state.board).toHaveLength(8)
      expect(state.board[0]).toHaveLength(8)
      expect(state.currentTurn).toBe('player1')
      expect(state.winner).toBeNull()
      expect(state.isDraw).toBe(false)
      expect(state.lastMoveWasPass).toBe(false)
      expect(state.lastMove).toBeNull()
      expect(state.flippedCells).toEqual([])
      expect(state.players).toHaveLength(2)
      expect(state.players[0]!.color).toBe('#1a1a2e')
      expect(state.players[1]!.color).toBe('#f0f0f0')
    })

    it('should place 4 center pieces correctly on 8x8', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))

      // Standard opening: player2 at (3,3) and (4,4), player1 at (3,4) and (4,3)
      expect(state.board[3]![3]).toBe('player2')
      expect(state.board[3]![4]).toBe('player1')
      expect(state.board[4]![3]).toBe('player1')
      expect(state.board[4]![4]).toBe('player2')

      // All other cells should be null
      let filledCount = 0
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (state.board[r]![c] !== null) filledCount++
        }
      }
      expect(filledCount).toBe(4)
    })

    it('should create a valid 6x6 board', () => {
      const settings = makeSettings({ boardSize: 6 })
      const state = setupGame(playerIds, settings)

      expect(state.boardSize).toBe(6)
      expect(state.board).toHaveLength(6)
      expect(state.board[0]).toHaveLength(6)
      // Center pieces at (2,2), (2,3), (3,2), (3,3)
      expect(state.board[2]![2]).toBe('player2')
      expect(state.board[2]![3]).toBe('player1')
      expect(state.board[3]![2]).toBe('player1')
      expect(state.board[3]![3]).toBe('player2')
    })

    it('should create a valid 10x10 board', () => {
      const settings = makeSettings({ boardSize: 10 })
      const state = setupGame(playerIds, settings)

      expect(state.boardSize).toBe(10)
      expect(state.board).toHaveLength(10)
      expect(state.board[0]).toHaveLength(10)
      // Center pieces at (4,4), (4,5), (5,4), (5,5)
      expect(state.board[4]![4]).toBe('player2')
      expect(state.board[4]![5]).toBe('player1')
      expect(state.board[5]![4]).toBe('player1')
      expect(state.board[5]![5]).toBe('player2')
    })

    it('should respect custom starting player', () => {
      const settings = makeSettings({ startingPlayerId: 'player2' })
      const state = setupGame(playerIds, settings)

      expect(state.currentTurn).toBe('player2')
      // Starting player gets top-right and bottom-left in center
      expect(state.board[3]![4]).toBe('player2')
      expect(state.board[4]![3]).toBe('player2')
      expect(state.board[3]![3]).toBe('player1')
      expect(state.board[4]![4]).toBe('player1')
    })

    it('should throw error with wrong number of players', () => {
      expect(() => setupGame(['player1'], defaultSettings(['player1']))).toThrow()
      expect(() =>
        setupGame(['p1', 'p2', 'p3'], defaultSettings(['p1', 'p2', 'p3']))
      ).toThrow()
    })
  })

  describe('validateMove', () => {
    it('should validate a legal opening move', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      // On standard 8x8, player1 can play at (2,3) which would flip (3,3)
      const move: ReversiMove = { row: 2, col: 3, pass: false }

      expect(validateMove(state, move, 'player1')).toBe(true)
    })

    it('should reject placement that flips no discs', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      // (0,0) is far from any pieces - no flips possible
      const move: ReversiMove = { row: 0, col: 0, pass: false }

      expect(validateMove(state, move, 'player1')).toBe(false)
    })

    it('should reject move on occupied cell', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      // (3,3) is occupied by player2
      const move: ReversiMove = { row: 3, col: 3, pass: false }

      expect(validateMove(state, move, 'player1')).toBe(false)
    })

    it('should reject move when not player turn', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      const move: ReversiMove = { row: 2, col: 3, pass: false }

      expect(validateMove(state, move, 'player2')).toBe(false)
    })

    it('should reject move out of bounds', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      const move: ReversiMove = { row: 8, col: 0, pass: false }

      expect(validateMove(state, move, 'player1')).toBe(false)
    })

    it('should reject move when game is over', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      state.winner = 'player1'
      const move: ReversiMove = { row: 2, col: 3, pass: false }

      expect(validateMove(state, move, 'player1')).toBe(false)
    })

    it('should allow pass when player has no valid moves', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      // Create a board where player2 cannot make any valid move:
      // player2 has a disc at (0,0), player1 fills everything else,
      // no empty cells at all — player2 must pass
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          state.board[r]![c] = 'player1'
        }
      }
      state.board[0]![0] = 'player2'
      state.currentTurn = 'player2'

      // No empty cells, so player2 has no valid moves
      expect(validateMove(state, { row: 0, col: 0, pass: true }, 'player2')).toBe(true)
    })

    it('should reject pass when player has valid moves', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      // Opening position - player1 has valid moves
      const move: ReversiMove = { row: 0, col: 0, pass: true }

      expect(validateMove(state, move, 'player1')).toBe(false)
    })
  })

  describe('applyMove', () => {
    it('should place disc and flip captured pieces', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      // Player1 plays at (2,3), should flip (3,3) from player2 to player1
      const move: ReversiMove = { row: 2, col: 3, pass: false }

      const newState = applyMove(state, move, 'player1')

      expect(newState.board[2]![3]).toBe('player1')
      expect(newState.board[3]![3]).toBe('player1') // flipped
      expect(newState.lastMove).toEqual({ row: 2, col: 3 })
      expect(newState.flippedCells).toEqual([{ row: 3, col: 3 }])
    })

    it('should switch turns after a move', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      const move: ReversiMove = { row: 2, col: 3, pass: false }

      const newState = applyMove(state, move, 'player1')

      expect(newState.currentTurn).toBe('player2')
    })

    it('should not mutate original state', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      const originalBoard = state.board.map((row) => [...row])
      const move: ReversiMove = { row: 2, col: 3, pass: false }

      applyMove(state, move, 'player1')

      expect(state.board).toEqual(originalBoard)
      expect(state.lastMove).toBeNull()
      expect(state.flippedCells).toEqual([])
    })

    it('should flip multiple pieces in one direction', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      // Set up a line: player1 at col 0, player2 at cols 1-3, empty at col 4
      // Row 0
      state.board[0]![0] = 'player1'
      state.board[0]![1] = 'player2'
      state.board[0]![2] = 'player2'
      state.board[0]![3] = 'player2'
      state.currentTurn = 'player1'

      const move: ReversiMove = { row: 0, col: 4, pass: false }
      const newState = applyMove(state, move, 'player1')

      expect(newState.board[0]![1]).toBe('player1')
      expect(newState.board[0]![2]).toBe('player1')
      expect(newState.board[0]![3]).toBe('player1')
      expect(newState.flippedCells).toHaveLength(3)
    })

    it('should flip pieces in multiple directions', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      // Set up board where a move flips in two directions
      // Clear board first
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          state.board[r]![c] = null
        }
      }

      // Horizontal: player1 at (3,0), player2 at (3,1), empty at (3,2)
      state.board[3]![0] = 'player1'
      state.board[3]![1] = 'player2'
      // Vertical: player1 at (0,2), player2 at (1,2) and (2,2), empty at (3,2)
      state.board[0]![2] = 'player1'
      state.board[1]![2] = 'player2'
      state.board[2]![2] = 'player2'
      state.currentTurn = 'player1'

      const move: ReversiMove = { row: 3, col: 2, pass: false }
      const newState = applyMove(state, move, 'player1')

      // Horizontal flip
      expect(newState.board[3]![1]).toBe('player1')
      // Vertical flips
      expect(newState.board[1]![2]).toBe('player1')
      expect(newState.board[2]![2]).toBe('player1')
      expect(newState.flippedCells).toHaveLength(3)
    })

    it('should handle pass move', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      // Force a situation where player1 must pass
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          state.board[r]![c] = 'player2'
        }
      }
      state.board[0]![0] = 'player1'
      state.board[7]![7] = null
      state.currentTurn = 'player1'

      const newState = applyMove(state, { row: 0, col: 0, pass: true }, 'player1')

      expect(newState.currentTurn).toBe('player2')
      expect(newState.lastMoveWasPass).toBe(true)
      expect(newState.lastMove).toBeNull()
      expect(newState.flippedCells).toEqual([])
    })

    it('should end game on consecutive passes', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      state.lastMoveWasPass = true
      state.currentTurn = 'player1'
      // Set up board so player1 has more discs
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          state.board[r]![c] = r < 5 ? 'player1' : 'player2'
        }
      }

      const newState = applyMove(state, { row: 0, col: 0, pass: true }, 'player1')

      expect(newState.winner).toBe('player1')
    })

    it('should end game when board is full', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      // Fill all but one cell
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          state.board[r]![c] = r < 4 ? 'player1' : 'player2'
        }
      }
      // Leave one empty cell and set up a valid flip
      state.board[7]![7] = null
      state.board[7]![6] = 'player1' // player1 piece to anchor the flip
      state.board[7]![5] = 'player2' // This gets naturally flipped? No...
      // Actually let's set up a simple scenario:
      // player2 at (7,6), player1 at (7,5), empty at (7,7)
      state.board[7]![5] = 'player1'
      state.board[7]![6] = 'player2'
      state.board[7]![7] = null
      state.currentTurn = 'player1'

      // This scenario: player1 plays at (7,7), needs to flip (7,6)
      // But we need player1 piece beyond (7,7) in some direction... that won't work at edge.
      // Let's simplify: set up so the move at (7,7) flips (7,6) because player1 is at (7,5)
      // Direction: left. From (7,7) going left: (7,6) is player2, (7,5) is player1. Valid flip!
      const move: ReversiMove = { row: 7, col: 7, pass: false }
      const newState = applyMove(state, move, 'player1')

      // Board should now be full
      expect(newState.winner).not.toBeNull()
    })

    it('should auto-skip opponent when they have no valid moves', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      // Set up a board where after player1's move, player2 has no valid moves
      // but player1 still does
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          state.board[r]![c] = null
        }
      }
      // Minimal setup: player1 plays, flips, and player2 is boxed out
      state.board[0]![0] = 'player1'
      state.board[0]![1] = 'player2'
      state.board[0]![2] = null // player1 will play here
      state.currentTurn = 'player1'
      // After player1 plays (0,2), board is: p1, p1, p1 in row 0
      // player2 has no pieces and thus no valid moves
      // player1 also has no valid moves (nothing to flip)
      // Game should end

      const move: ReversiMove = { row: 0, col: 2, pass: false }
      const newState = applyMove(state, move, 'player1')

      // Game should end since neither player can move
      expect(newState.winner).toBe('player1')
    })
  })

  describe('getGameScore', () => {
    it('should return disc counts during in-progress game', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      // Opening position has 2 discs each
      const scores = getGameScore(state)

      expect(scores).not.toBeNull()
      expect(scores.get('player1')!.value).toBe(2)
      expect(scores.get('player2')!.value).toBe(2)
    })

    it('should return correct counts after a move', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      const move: ReversiMove = { row: 2, col: 3, pass: false }
      const newState = applyMove(state, move, 'player1')

      const scores = getGameScore(newState)
      // player1 placed 1 disc and flipped 1: 2 + 1 + 1 = 4
      // player2 lost 1: 2 - 1 = 1
      expect(scores.get('player1')!.value).toBe(4)
      expect(scores.get('player2')!.value).toBe(1)
    })

    it('should return equal scores for a draw', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      // Fill board with equal discs
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          state.board[r]![c] = r < 4 ? 'player1' : 'player2'
        }
      }
      state.isDraw = true

      const scores = getGameScore(state)
      expect(scores.get('player1')!.value).toBe(32)
      expect(scores.get('player2')!.value).toBe(32)
      expect(scores.get('player1')!.compareTo(scores.get('player2')!)).toBe(0)
    })

    it('should make higher disc count sort higher via compareTo', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      // Give player1 more discs
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          state.board[r]![c] = r < 5 ? 'player1' : 'player2'
        }
      }

      const scores = getGameScore(state)
      const score1 = scores.get('player1')!
      const score2 = scores.get('player2')!
      expect(score1.compareTo(score2)).toBeGreaterThan(0)
      expect(score2.compareTo(score1)).toBeLessThan(0)
    })
  })

  describe('getValidMoves', () => {
    it('should return valid opening moves for player1 on 8x8', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      const moves = getValidMoves(state, 'player1')

      // Standard opening: player1 can play at 4 positions
      expect(moves).toHaveLength(4)
      // These are the 4 valid opening moves for the starting player
      const moveSet = new Set(moves.map((m) => `${m.row},${m.col}`))
      expect(moveSet.has('2,3')).toBe(true)
      expect(moveSet.has('3,2')).toBe(true)
      expect(moveSet.has('4,5')).toBe(true)
      expect(moveSet.has('5,4')).toBe(true)
    })

    it('should return empty array when player has no valid moves', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      // Fill the entire board — no empty cells means no valid moves for anyone
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          state.board[r]![c] = 'player1'
        }
      }
      state.board[0]![0] = 'player2'

      const moves = getValidMoves(state, 'player2')
      expect(moves).toHaveLength(0)
    })

    it('should not include occupied cells', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      const moves = getValidMoves(state, 'player1')

      for (const move of moves) {
        expect(state.board[move.row]![move.col]).toBeNull()
      }
    })
  })

  describe('getDiscCounts', () => {
    it('should count discs correctly at game start', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      const counts = getDiscCounts(state)

      expect(counts.get('player1')).toBe(2)
      expect(counts.get('player2')).toBe(2)
    })
  })

  describe('getPlayerColor', () => {
    it('should return correct color for each player', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))

      expect(getPlayerColor(state, 'player1')).toBe('#1a1a2e')
      expect(getPlayerColor(state, 'player2')).toBe('#f0f0f0')
    })

    it('should return null for unknown player', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))

      expect(getPlayerColor(state, 'unknown')).toBeNull()
    })
  })

  describe('Game Flow', () => {
    it('should play several opening moves with correct flips', () => {
      let state = setupGame(playerIds, defaultSettings(playerIds))

      // Move 1: Player1 plays (2,3) - flips (3,3)
      state = applyMove(state, { row: 2, col: 3, pass: false }, 'player1')
      expect(state.board[2]![3]).toBe('player1')
      expect(state.board[3]![3]).toBe('player1') // flipped from player2
      expect(state.currentTurn).toBe('player2')

      // Move 2: Player2 plays (2,2) - flips (3,3) back
      state = applyMove(state, { row: 2, col: 2, pass: false }, 'player2')
      expect(state.board[2]![2]).toBe('player2')
      expect(state.board[3]![3]).toBe('player2') // flipped from player1
      expect(state.currentTurn).toBe('player1')

      // Verify disc counts
      const scores = getGameScore(state)
      const p1Count = scores.get('player1')!.value
      const p2Count = scores.get('player2')!.value
      expect(p1Count + p2Count).toBe(6) // 4 initial + 2 placed
    })

    it('should detect game end by mutual inability to move', () => {
      const state = setupGame(playerIds, defaultSettings(playerIds))
      // Create near-end position: almost all player1, player2 has one piece
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          state.board[r]![c] = 'player1'
        }
      }
      state.board[0]![0] = 'player2'
      state.board[0]![1] = null // empty for player1 to play
      state.currentTurn = 'player1'

      // player1 plays (0,1) - but this won't flip (0,0) because there's no player1
      // piece on the other side. Let's fix the setup.
      // Put player1 at (0,2) and player2 at (0,1), empty at (0,0)
      state.board[0]![0] = null
      state.board[0]![1] = 'player2'
      state.board[0]![2] = 'player1'

      const move: ReversiMove = { row: 0, col: 0, pass: false }
      const newState = applyMove(state, move, 'player1')

      // After this move, player2 should have no pieces and no valid moves
      // player1 also has no valid moves (no opponent pieces to flip)
      // Game should end
      expect(newState.winner).toBe('player1')
      expect(newState.isDraw).toBe(false)
    })

    it('should handle a 6x6 game correctly', () => {
      const settings = makeSettings({ boardSize: 6 })
      let state = setupGame(playerIds, settings)

      expect(state.boardSize).toBe(6)

      // Play an opening move
      const moves = getValidMoves(state, 'player1')
      expect(moves.length).toBeGreaterThan(0)

      state = applyMove(state, { ...moves[0]!, pass: false }, 'player1')
      expect(state.currentTurn).toBe('player2')
    })
  })
})
