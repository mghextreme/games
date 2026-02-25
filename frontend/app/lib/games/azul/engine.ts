import type {
  AzulState,
  AzulMove,
  AzulScore,
  AzulSettings,
  AzulPlayer,
  AzulPlayerBoard,
  TileColor,
  PatternLine,
  FactoryDisplay,
} from './types'
import { TILE_COLORS, WALL_PATTERN, FLOOR_PENALTIES } from './types'
import type { PlayerScores } from '~/lib/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Deterministic seeded random number generator (mulberry32). */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Shuffle an array in place using the provided RNG. */
function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

function createEmptyBoard(): AzulPlayerBoard {
  return {
    patternLines: Array.from({ length: 5 }, (): PatternLine => ({
      color: null,
      count: 0,
    })),
    wall: Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => false)),
    floorLine: [],
    hasFirstPlayerMarker: false,
    score: 0,
  }
}

function createTileBag(rng: () => number): TileColor[] {
  const bag: TileColor[] = []
  for (const color of TILE_COLORS) {
    for (let i = 0; i < 20; i++) {
      bag.push(color)
    }
  }
  shuffle(bag, rng)
  return bag
}

/** Draw n tiles from bag, refilling from discard if needed. Mutates bag and discard. */
function drawTiles(
  bag: TileColor[],
  discard: TileColor[],
  n: number,
  rng: () => number
): TileColor[] {
  const drawn: TileColor[] = []
  for (let i = 0; i < n; i++) {
    if (bag.length === 0) {
      // Refill bag from discard
      bag.push(...discard)
      discard.length = 0
      shuffle(bag, rng)
    }
    if (bag.length === 0) break // No tiles left anywhere
    drawn.push(bag.pop()!)
  }
  return drawn
}

function getFactoryCount(playerCount: number): number {
  return playerCount * 2 + 1
}

/** Fill all factories from the bag. Mutates bag and discard. */
function fillFactories(
  factoryCount: number,
  bag: TileColor[],
  discard: TileColor[],
  rng: () => number
): FactoryDisplay[] {
  const factories: FactoryDisplay[] = []
  for (let i = 0; i < factoryCount; i++) {
    const tiles = drawTiles(bag, discard, 4, rng)
    factories.push({ tiles })
  }
  return factories
}

/** Get the column index on the wall where a given color goes for a given row. */
export function getWallColumnForColor(row: number, color: TileColor): number {
  return WALL_PATTERN[row]!.indexOf(color)
}

/** Check if a color is already placed on the wall in a given row. */
function isColorOnWall(board: AzulPlayerBoard, row: number, color: TileColor): boolean {
  const col = getWallColumnForColor(row, color)
  return board.wall[row]![col]!
}

/** Score a newly placed tile on the wall at (row, col). */
function scoreTilePlacement(wall: boolean[][], row: number, col: number): number {
  let score = 0
  let hasAdjacent = false

  // Count contiguous tiles horizontally
  let hCount = 1
  // Left
  for (let c = col - 1; c >= 0; c--) {
    if (!wall[row]![c]) break
    hCount++
  }
  // Right
  for (let c = col + 1; c < 5; c++) {
    if (!wall[row]![c]) break
    hCount++
  }
  if (hCount > 1) {
    score += hCount
    hasAdjacent = true
  }

  // Count contiguous tiles vertically
  let vCount = 1
  // Up
  for (let r = row - 1; r >= 0; r--) {
    if (!wall[r]![col]) break
    vCount++
  }
  // Down
  for (let r = row + 1; r < 5; r++) {
    if (!wall[r]![col]) break
    vCount++
  }
  if (vCount > 1) {
    score += vCount
    hasAdjacent = true
  }

  // If no adjacent tiles, the tile scores 1 point by itself
  if (!hasAdjacent) {
    score = 1
  }

  return score
}

/** Calculate floor penalty. */
function calculateFloorPenalty(floorCount: number): number {
  let penalty = 0
  for (let i = 0; i < Math.min(floorCount, FLOOR_PENALTIES.length); i++) {
    penalty += FLOOR_PENALTIES[i]!
  }
  return penalty
}

/** Check if any player has a completed row (triggers end of game). */
function hasCompletedRow(player: AzulPlayer): boolean {
  for (let row = 0; row < 5; row++) {
    if (player.board.wall[row]!.every(Boolean)) {
      return true
    }
  }
  return false
}

/** Calculate end-of-game bonus scoring. */
function calculateBonusScore(board: AzulPlayerBoard): number {
  let bonus = 0

  // Complete rows: +2 each
  for (let row = 0; row < 5; row++) {
    if (board.wall[row]!.every(Boolean)) {
      bonus += 2
    }
  }

  // Complete columns: +7 each
  for (let col = 0; col < 5; col++) {
    let complete = true
    for (let row = 0; row < 5; row++) {
      if (!board.wall[row]![col]) {
        complete = false
        break
      }
    }
    if (complete) bonus += 7
  }

  // Complete color sets: +10 each
  for (const color of TILE_COLORS) {
    let complete = true
    for (let row = 0; row < 5; row++) {
      const col = getWallColumnForColor(row, color)
      if (!board.wall[row]![col]) {
        complete = false
        break
      }
    }
    if (complete) bonus += 10
  }

  return bonus
}

// ─── Deep copy ──────────────────────────────────────────────────────────────

function deepCopyState(state: AzulState): AzulState {
  return {
    ...state,
    factories: state.factories.map((f) => ({ tiles: [...f.tiles] })),
    center: [...state.center],
    bag: [...state.bag],
    discard: [...state.discard],
    players: state.players.map((p) => ({
      ...p,
      board: {
        ...p.board,
        patternLines: p.board.patternLines.map((pl) => ({ ...pl })),
        wall: p.board.wall.map((row) => [...row]),
        floorLine: [...p.board.floorLine],
      },
    })),
  }
}

// ─── Exported engine functions ──────────────────────────────────────────────

export function defaultSettings(playerIds: string[]): AzulSettings {
  const playerSettings: Record<string, Record<string, never>> = {}
  for (const id of playerIds) {
    playerSettings[id] = {}
  }
  return {
    playerSettings,
    startingPlayerId: playerIds[0]!,
  }
}

export function setupGame(playerIds: string[], settings: AzulSettings): AzulState {
  if (playerIds.length < 2 || playerIds.length > 4) {
    throw new Error('Azul requires 2-4 players')
  }

  const seed = Date.now()
  const rng = mulberry32(seed)
  const bag = createTileBag(rng)
  const discard: TileColor[] = []

  const factoryCount = getFactoryCount(playerIds.length)
  const factories = fillFactories(factoryCount, bag, discard, rng)

  return {
    factories,
    center: [],
    firstPlayerMarkerInCenter: true,
    bag,
    discard,
    currentTurn: settings.startingPlayerId,
    firstPlayerId: settings.startingPlayerId,
    round: 1,
    phase: 'pick',
    winner: null,
    isDraw: false,
    players: playerIds.map((id) => ({
      id,
      board: createEmptyBoard(),
    })),
  }
}

export function validateMove(
  state: AzulState,
  move: AzulMove,
  playerId: string
): boolean {
  // Game must not be over
  if (state.winner || state.isDraw) return false
  if (state.phase !== 'pick') return false

  // Must be this player's turn
  if (state.currentTurn !== playerId) return false

  const { sourceIndex, color, patternLineIndex } = move

  // Validate source
  let availableTiles: TileColor[]
  if (sourceIndex === -1) {
    availableTiles = state.center
  } else if (sourceIndex >= 0 && sourceIndex < state.factories.length) {
    availableTiles = state.factories[sourceIndex]!.tiles
  } else {
    return false
  }

  // Must have at least one tile of the chosen color in the source
  if (!availableTiles.includes(color)) return false

  // Validate target
  if (patternLineIndex === -1) {
    // Placing directly on floor is always valid
    return true
  }

  if (patternLineIndex < 0 || patternLineIndex > 4) return false

  const player = state.players.find((p) => p.id === playerId)
  if (!player) return false

  const line = player.board.patternLines[patternLineIndex]!
  const lineSize = patternLineIndex + 1

  // Line must not be full
  if (line.count >= lineSize) return false

  // Line must be empty or have the same color
  if (line.color !== null && line.color !== color) return false

  // Color must not already be on the wall in that row
  if (isColorOnWall(player.board, patternLineIndex, color)) return false

  return true
}

export function applyMove(
  state: AzulState,
  move: AzulMove,
  playerId: string
): AzulState {
  const newState = deepCopyState(state)
  const { sourceIndex, color, patternLineIndex } = move

  const player = newState.players.find((p) => p.id === playerId)!

  // Collect tiles of the chosen color from source
  let pickedTiles: TileColor[]
  let remainingTiles: TileColor[]

  if (sourceIndex === -1) {
    // Taking from center
    pickedTiles = newState.center.filter((t) => t === color)
    remainingTiles = newState.center.filter((t) => t !== color)
    newState.center = remainingTiles

    // First player marker
    if (newState.firstPlayerMarkerInCenter) {
      player.board.hasFirstPlayerMarker = true
      // Remove marker from any other player
      for (const p of newState.players) {
        if (p.id !== playerId) p.board.hasFirstPlayerMarker = false
      }
      newState.firstPlayerMarkerInCenter = false
      newState.firstPlayerId = playerId
      // First player marker counts as a floor penalty tile (represented as extra floor entry)
      player.board.floorLine.push(color) // placeholder - we'll handle the marker as +1 floor count
      // Actually per Azul rules the first player marker itself goes to floor but is not a tile color.
      // We'll track it via hasFirstPlayerMarker and add 1 to floor count during scoring.
      // Remove the placeholder we just added:
      player.board.floorLine.pop()
    }
  } else {
    // Taking from factory
    const factory = newState.factories[sourceIndex]!
    pickedTiles = factory.tiles.filter((t) => t === color)
    remainingTiles = factory.tiles.filter((t) => t !== color)
    // Remaining tiles go to center
    newState.center.push(...remainingTiles)
    factory.tiles = []
  }

  // Place tiles
  if (patternLineIndex === -1) {
    // All go to floor
    player.board.floorLine.push(...pickedTiles)
  } else {
    const line = player.board.patternLines[patternLineIndex]!
    const lineSize = patternLineIndex + 1
    const spaceAvailable = lineSize - line.count

    line.color = color
    const tilesToPlace = Math.min(pickedTiles.length, spaceAvailable)
    line.count += tilesToPlace

    // Overflow goes to floor line
    const overflow = pickedTiles.length - tilesToPlace
    for (let i = 0; i < overflow; i++) {
      player.board.floorLine.push(color)
    }
  }

  // Check if the round is over (all factories and center are empty)
  const allEmpty =
    newState.factories.every((f) => f.tiles.length === 0) &&
    newState.center.length === 0

  if (allEmpty) {
    // Score the round (wall tiling phase)
    scoreRound(newState)

    // Check end of game: any player completed a row
    const gameEnded = newState.players.some((p) => hasCompletedRow(p))

    if (gameEnded) {
      // Apply end-of-game bonuses
      for (const p of newState.players) {
        p.board.score += calculateBonusScore(p.board)
        // Ensure score doesn't go below 0
        p.board.score = Math.max(0, p.board.score)
      }

      // Determine winner (highest score)
      let bestScore = -1
      let bestPlayerId: string | null = null
      let tie = false
      for (const p of newState.players) {
        if (p.board.score > bestScore) {
          bestScore = p.board.score
          bestPlayerId = p.id
          tie = false
        } else if (p.board.score === bestScore) {
          tie = true
        }
      }

      // Tiebreaker: most complete rows
      if (tie) {
        const tiedPlayers = newState.players.filter((p) => p.board.score === bestScore)
        let mostRows = -1
        bestPlayerId = null
        tie = false
        for (const p of tiedPlayers) {
          const rows = p.board.wall.filter((row) => row.every(Boolean)).length
          if (rows > mostRows) {
            mostRows = rows
            bestPlayerId = p.id
            tie = false
          } else if (rows === mostRows) {
            tie = true
          }
        }
      }

      if (tie) {
        newState.isDraw = true
      } else {
        newState.winner = bestPlayerId
      }
      newState.currentTurn = undefined
      newState.phase = 'done'
    } else {
      // Start new round
      startNewRound(newState)
    }
  } else {
    // Move to next player
    const playerIndex = newState.players.findIndex((p) => p.id === playerId)
    const nextIndex = (playerIndex + 1) % newState.players.length
    newState.currentTurn = newState.players[nextIndex]!.id
  }

  return newState
}

/** Score completed pattern lines, apply floor penalties, clean up for next round. */
function scoreRound(state: AzulState): void {
  for (const player of state.players) {
    const board = player.board

    // Score completed pattern lines
    for (let row = 0; row < 5; row++) {
      const line = board.patternLines[row]!
      const lineSize = row + 1

      if (line.count === lineSize && line.color !== null) {
        // Place tile on wall
        const col = getWallColumnForColor(row, line.color)
        board.wall[row]![col] = true

        // Score the placement
        board.score += scoreTilePlacement(board.wall, row, col)

        // Remaining tiles (count - 1) go to discard
        for (let i = 0; i < line.count - 1; i++) {
          state.discard.push(line.color)
        }

        // Clear pattern line
        line.color = null
        line.count = 0
      }
    }

    // Apply floor penalty
    const floorCount = board.floorLine.length + (board.hasFirstPlayerMarker ? 1 : 0)
    board.score += calculateFloorPenalty(floorCount)
    board.score = Math.max(0, board.score)

    // Floor tiles go to discard
    state.discard.push(...board.floorLine)
    board.floorLine = []
  }
}

/** Set up a new round: refill factories, reset center, update first player. */
function startNewRound(state: AzulState): void {
  state.round++

  // Create a new RNG from current state for deterministic factory fills
  const seed = state.round * 1000000 + state.bag.length * 1000 + state.discard.length
  const rng = mulberry32(seed)

  const factoryCount = getFactoryCount(state.players.length)
  state.factories = fillFactories(factoryCount, state.bag, state.discard, rng)
  state.center = []
  state.firstPlayerMarkerInCenter = true

  // First player marker holder goes first
  state.currentTurn = state.firstPlayerId

  // Reset first player marker on all player boards
  for (const p of state.players) {
    p.board.hasFirstPlayerMarker = false
  }

  state.phase = 'pick'
}

export function getGameScore(state: AzulState): PlayerScores<AzulScore> {
  const scores: PlayerScores<AzulScore> = new Map()

  for (const player of state.players) {
    scores.set(player.id, {
      value: player.board.score,
      compareTo(other: AzulScore) {
        return this.value - other.value
      },
    })
  }

  return scores
}

/** Get the player's board by ID. */
export function getPlayerBoard(state: AzulState, playerId: string): AzulPlayerBoard | null {
  const player = state.players.find((p) => p.id === playerId)
  return player?.board ?? null
}
