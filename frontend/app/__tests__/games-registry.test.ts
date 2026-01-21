import { describe, it, expect, beforeEach } from 'vitest'
import { getGameList, getGame, getDefaultGame } from '~/lib/games/registry'

describe('Game Registry', () => {
  describe('getGameList', () => {
    it('should return a list of available games', () => {
      const games = getGameList()
      expect(games).toBeInstanceOf(Array)
      expect(games.length).toBeGreaterThan(0)
    })

    it('should include tic-tac-toe', () => {
      const games = getGameList()
      const ttt = games.find(g => g.id === 'tic-tac-toe')
      expect(ttt).toBeDefined()
      expect(ttt?.name).toBe('Tic Tac Toe')
    })
  })

  describe('getGame', () => {
    it('should return a specific game by id', () => {
      const game = getGame('tic-tac-toe')
      expect(game).toBeDefined()
      expect(game?.id).toBe('tic-tac-toe')
    })

    it('should return undefined for invalid game id', () => {
      const game = getGame('invalid-game')
      expect(game).toBeUndefined()
    })
  })

  describe('getDefaultGame', () => {
    it('should return the default game', () => {
      const game = getDefaultGame()
      expect(game).toBeDefined()
      expect(game.id).toBe('tic-tac-toe')
    })
  })
})
