export interface TicTacToePlayer {
  id: string
  symbol: 'X' | 'O'
}

export interface TicTacToeState {
  board: (string | null)[][] // 3x3, playerId or null
  currentTurn: string // playerId
  winner: string | null
  isDraw: boolean
  players: TicTacToePlayer[]
}

export interface TicTacToeMove {
  row: number
  col: number
}
