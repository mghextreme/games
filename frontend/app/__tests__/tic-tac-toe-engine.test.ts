import { describe, it, expect } from 'vitest'
import { 
  createInitialState, 
  validateMove, 
  applyMove, 
  checkWinner,
  checkDraw 
} from '~/lib/games/tic-tac-toe/engine'
import type { TicTacToeState, TicTacToeMove } from '~/lib/games/tic-tac-toe/types'

describe('Tic Tac Toe Engine', () => {
  const playerIds = ['player1', 'player2']

  describe('createInitialState', () => {
    it('should create a valid initial state', () => {
      const state = createInitialState(playerIds)
      
      expect(state.board).toHaveLength(3)
      expect(state.board[0]).toHaveLength(3)
      expect(state.board.flat().every(cell => cell === null)).toBe(true)
      expect(state.currentTurn).toBe('player1')
      expect(state.winner).toBeNull()
      expect(state.isDraw).toBe(false)
      expect(state.players).toHaveLength(2)
      expect(state.players[0].symbol).toBe('X')
      expect(state.players[1].symbol).toBe('O')
    })

    it('should throw error with wrong number of players', () => {
      expect(() => createInitialState(['player1'])).toThrow()
      expect(() => createInitialState(['player1', 'player2', 'player3'])).toThrow()
    })
  })

  describe('validateMove', () => {
    it('should validate a legal move', () => {
      const state = createInitialState(playerIds)
      const move: TicTacToeMove = { row: 0, col: 0 }
      
      expect(validateMove(state, move, 'player1')).toBe(true)
    })

    it('should reject move on occupied cell', () => {
      const state = createInitialState(playerIds)
      state.board[0][0] = 'player1'
      const move: TicTacToeMove = { row: 0, col: 0 }
      
      expect(validateMove(state, move, 'player2')).toBe(false)
    })

    it('should reject move when not player turn', () => {
      const state = createInitialState(playerIds)
      const move: TicTacToeMove = { row: 0, col: 0 }
      
      expect(validateMove(state, move, 'player2')).toBe(false)
    })

    it('should reject move out of bounds', () => {
      const state = createInitialState(playerIds)
      const move: TicTacToeMove = { row: 3, col: 0 }
      
      expect(validateMove(state, move, 'player1')).toBe(false)
    })

    it('should reject move when game is over', () => {
      const state = createInitialState(playerIds)
      state.winner = 'player1'
      const move: TicTacToeMove = { row: 0, col: 0 }
      
      expect(validateMove(state, move, 'player1')).toBe(false)
    })
  })

  describe('applyMove', () => {
    it('should apply a valid move and switch turns', () => {
      const state = createInitialState(playerIds)
      const move: TicTacToeMove = { row: 0, col: 0 }
      
      const newState = applyMove(state, move, 'player1')
      
      expect(newState.board[0][0]).toBe('player1')
      expect(newState.currentTurn).toBe('player2')
      // Original state should not be modified
      expect(state.board[0][0]).toBeNull()
    })

    it('should not mutate original state', () => {
      const state = createInitialState(playerIds)
      const originalBoard = state.board.map(row => [...row])
      const move: TicTacToeMove = { row: 1, col: 1 }
      
      applyMove(state, move, 'player1')
      
      expect(state.board).toEqual(originalBoard)
    })
  })

  describe('checkWinner', () => {
    it('should detect horizontal win', () => {
      const state = createInitialState(playerIds)
      state.board = [
        ['player1', 'player1', 'player1'],
        [null, null, null],
        [null, null, null],
      ]
      
      expect(checkWinner(state)).toBe('player1')
    })

    it('should detect vertical win', () => {
      const state = createInitialState(playerIds)
      state.board = [
        ['player1', null, null],
        ['player1', null, null],
        ['player1', null, null],
      ]
      
      expect(checkWinner(state)).toBe('player1')
    })

    it('should detect diagonal win (top-left to bottom-right)', () => {
      const state = createInitialState(playerIds)
      state.board = [
        ['player2', null, null],
        [null, 'player2', null],
        [null, null, 'player2'],
      ]
      
      expect(checkWinner(state)).toBe('player2')
    })

    it('should detect diagonal win (top-right to bottom-left)', () => {
      const state = createInitialState(playerIds)
      state.board = [
        [null, null, 'player2'],
        [null, 'player2', null],
        ['player2', null, null],
      ]
      
      expect(checkWinner(state)).toBe('player2')
    })

    it('should return null when no winner', () => {
      const state = createInitialState(playerIds)
      state.board = [
        ['player1', 'player2', null],
        [null, null, null],
        [null, null, null],
      ]
      
      expect(checkWinner(state)).toBeNull()
    })
  })

  describe('checkDraw', () => {
    it('should detect a draw when board is full with no winner', () => {
      const state = createInitialState(playerIds)
      state.board = [
        ['player1', 'player2', 'player1'],
        ['player1', 'player2', 'player2'],
        ['player2', 'player1', 'player1'],
      ]
      state.winner = null
      
      expect(checkDraw(state)).toBe(true)
    })

    it('should return false when board is not full', () => {
      const state = createInitialState(playerIds)
      state.board = [
        ['player1', 'player2', null],
        [null, null, null],
        [null, null, null],
      ]
      
      expect(checkDraw(state)).toBe(false)
    })

    it('should return false when there is a winner', () => {
      const state = createInitialState(playerIds)
      state.board = [
        ['player1', 'player1', 'player1'],
        ['player2', 'player2', null],
        [null, null, null],
      ]
      state.winner = 'player1'
      
      expect(checkDraw(state)).toBe(false)
    })
  })

  describe('Game Flow', () => {
    it('should play a complete game to player 1 victory', () => {
      let state = createInitialState(playerIds)
      
      // Player 1 moves
      state = applyMove(state, { row: 0, col: 0 }, 'player1')
      expect(state.currentTurn).toBe('player2')
      
      // Player 2 moves
      state = applyMove(state, { row: 1, col: 0 }, 'player2')
      expect(state.currentTurn).toBe('player1')
      
      // Player 1 moves
      state = applyMove(state, { row: 0, col: 1 }, 'player1')
      
      // Player 2 moves
      state = applyMove(state, { row: 1, col: 1 }, 'player2')
      
      // Player 1 wins
      state = applyMove(state, { row: 0, col: 2 }, 'player1')
      
      expect(state.winner).toBe('player1')
      expect(checkWinner(state)).toBe('player1')
    })

    it('should play a complete game to a draw', () => {
      let state = createInitialState(playerIds)
      
      // Create a draw pattern:
      // X | O | X
      // X | O | O
      // O | X | X
      const moves: TicTacToeMove[] = [
        { row: 0, col: 0 }, // X
        { row: 0, col: 1 }, // O
        { row: 0, col: 2 }, // X
        { row: 1, col: 2 }, // O
        { row: 1, col: 0 }, // X
        { row: 2, col: 0 }, // O
        { row: 2, col: 1 }, // X
        { row: 1, col: 1 }, // O
        { row: 2, col: 2 }, // X
      ]
      
      moves.forEach((move, index) => {
        const playerId = index % 2 === 0 ? 'player1' : 'player2'
        state = applyMove(state, move, playerId)
      })
      
      expect(state.isDraw).toBe(true)
      expect(state.winner).toBeNull()
    })
  })
})
