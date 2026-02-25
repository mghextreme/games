<script setup lang="ts">
import type { AzulState, AzulMove, TileColor } from '~/lib/games/azul/types'
import { TILE_HEX, WALL_PATTERN, TILE_COLORS, FLOOR_PENALTIES } from '~/lib/games/azul/types'
import { getWallColumnForColor } from '~/lib/games/azul/engine'
import type { PlayerWithDetails } from '~/lib/types'
import { Badge } from '~/components/ui/badge'

const props = defineProps<{
  gameState: AzulState
  currentPlayerId: string
  players: readonly PlayerWithDetails[]
}>()

const emit = defineEmits<{
  (e: 'move', move: AzulMove): void
}>()

const isMyTurn = computed(() => props.gameState.currentTurn === props.currentPlayerId)
const isGameOver = computed(() => props.gameState.winner !== null || props.gameState.isDraw)

const currentTurnPlayer = computed(() =>
  props.players.find((p) => p.guestId === props.gameState.currentTurn)
)

const myPlayer = computed(() =>
  props.gameState.players.find((p) => p.id === props.currentPlayerId)
)

// Selection state
const selectedSource = ref<{ sourceIndex: number; color: TileColor } | null>(null)

const getPlayerDetails = (playerId: string) =>
  props.players.find((p) => p.guestId === playerId)

/** Count tiles of a color in a source. */
function countColor(sourceIndex: number, color: TileColor): number {
  const tiles = sourceIndex === -1
    ? props.gameState.center
    : props.gameState.factories[sourceIndex]?.tiles ?? []
  return tiles.filter((t) => t === color).length
}

/** Center tiles sorted by the canonical TILE_COLORS order. */
const sortedCenter = computed(() => {
  return [...props.gameState.center].sort(
    (a, b) => TILE_COLORS.indexOf(a) - TILE_COLORS.indexOf(b)
  )
})

/** Check if a pattern line is a valid target for the selected tiles. */
function canPlaceOnLine(lineIndex: number): boolean {
  if (!selectedSource.value || !myPlayer.value) return false
  const { color } = selectedSource.value
  const board = myPlayer.value.board
  const line = board.patternLines[lineIndex]!
  const lineSize = lineIndex + 1

  // Line must not be full
  if (line.count >= lineSize) return false

  // Line must be empty or same color
  if (line.color !== null && line.color !== color) return false

  // Color must not already be on the wall in that row
  const col = getWallColumnForColor(lineIndex, color)
  if (board.wall[lineIndex]![col]) return false

  return true
}

function selectSource(sourceIndex: number, color: TileColor) {
  if (!isMyTurn.value || isGameOver.value) return

  // Toggle off if same selection
  if (selectedSource.value?.sourceIndex === sourceIndex && selectedSource.value?.color === color) {
    selectedSource.value = null
    return
  }

  selectedSource.value = { sourceIndex, color }
}

function placeOnLine(patternLineIndex: number) {
  if (!selectedSource.value) return

  const move: AzulMove = {
    sourceIndex: selectedSource.value.sourceIndex,
    color: selectedSource.value.color,
    patternLineIndex,
  }

  emit('move', move)
  selectedSource.value = null
}

function placeOnFloor() {
  if (!selectedSource.value) return

  const move: AzulMove = {
    sourceIndex: selectedSource.value.sourceIndex,
    color: selectedSource.value.color,
    patternLineIndex: -1,
  }

  emit('move', move)
  selectedSource.value = null
}

/** Get tile hex color. */
function tileHex(color: TileColor): string {
  return TILE_HEX[color]
}

/** Get floor penalty for a given floor position (0-indexed). */
function getFloorPenalty(index: number): number {
  if (index < FLOOR_PENALTIES.length) return FLOOR_PENALTIES[index]!
  return FLOOR_PENALTIES[FLOOR_PENALTIES.length - 1]!
}

/**
 * Build the floor items list: first player marker (if held) always comes first,
 * then the actual floor tiles.
 */
function getFloorItems(player: typeof props.gameState.players[number]) {
  const items: { type: 'marker' | 'tile'; color?: TileColor }[] = []
  if (player.board.hasFirstPlayerMarker) {
    items.push({ type: 'marker' })
  }
  for (const tile of player.board.floorLine) {
    items.push({ type: 'tile', color: tile })
  }
  return items
}

const selectedCount = computed(() => {
  if (!selectedSource.value) return 0
  return countColor(selectedSource.value.sourceIndex, selectedSource.value.color)
})

// Players ordered so current user is always shown first/most prominent
const orderedPlayers = computed(() => {
  const me = props.gameState.players.find((p) => p.id === props.currentPlayerId)
  const others = props.gameState.players.filter((p) => p.id !== props.currentPlayerId)
  return me ? [me, ...others] : [...props.gameState.players]
})
</script>

<template>
  <div class="flex w-full flex-col items-center gap-4">
    <!-- Game Status -->
    <div class="text-center">
      <template v-if="gameState.winner">
        <p class="text-xl font-bold text-green-600">
          {{ getPlayerDetails(gameState.winner)?.displayName || 'Unknown' }} wins!
        </p>
      </template>
      <template v-else-if="gameState.isDraw">
        <p class="text-xl font-bold text-yellow-600">It's a draw!</p>
      </template>
      <template v-else>
        <p class="text-lg">
          <span v-if="isMyTurn" class="font-bold text-green-600">
            {{ selectedSource ? `Place ${selectedCount} ${selectedSource.color} tile(s)` : 'Your turn — pick tiles' }}
          </span>
          <span v-else class="text-muted-foreground">
            Waiting for {{ currentTurnPlayer?.displayName || 'opponent' }}...
          </span>
        </p>
        <p class="text-xs text-muted-foreground">Round {{ gameState.round }}</p>
      </template>
    </div>

    <!-- Factory Displays -->
    <div class="w-full max-w-[600px]">
      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Factories</p>
      <div class="flex flex-wrap justify-center gap-3">
        <div
          v-for="(factory, fi) in gameState.factories"
          :key="`factory-${fi}`"
          class="flex h-[88px] w-[88px] flex-wrap items-center justify-center gap-1.5 rounded-full border bg-card p-2 shadow-sm sm:h-20 sm:w-20 sm:gap-1"
          :class="[factory.tiles.length === 0 ? 'opacity-30' : '']"
        >
          <button
            v-for="(tile, ti) in factory.tiles"
            :key="`f${fi}-t${ti}`"
            class="tile-size rounded-sm border border-white/40 shadow-sm transition-all"
            :class="[
              isMyTurn && !isGameOver ? 'cursor-pointer hover:scale-110 hover:ring-2 hover:ring-white' : 'cursor-default',
              selectedSource?.sourceIndex === fi && selectedSource?.color === tile ? 'ring-2 ring-yellow-400 scale-110' : '',
            ]"
            :style="{ backgroundColor: tileHex(tile) }"
            :disabled="!isMyTurn || isGameOver"
            @click="selectSource(fi, tile)"
          />
        </div>
      </div>

      <!-- Center Pool -->
      <div class="mt-3">
        <p class="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Center
          <span v-if="gameState.firstPlayerMarkerInCenter" class="ml-1 text-yellow-500">(1st player marker)</span>
        </p>
        <div
          class="flex min-h-[44px] flex-wrap items-center justify-center gap-1.5 rounded-lg border bg-card/50 p-2 sm:gap-1"
        >
          <span v-if="gameState.center.length === 0" class="text-xs text-muted-foreground">Empty</span>
          <button
            v-for="(tile, ti) in sortedCenter"
            :key="`center-${ti}`"
            class="tile-size rounded-sm border border-white/40 shadow-sm transition-all"
            :class="[
              isMyTurn && !isGameOver ? 'cursor-pointer hover:scale-110 hover:ring-2 hover:ring-white' : 'cursor-default',
              selectedSource?.sourceIndex === -1 && selectedSource?.color === tile ? 'ring-2 ring-yellow-400 scale-110' : '',
            ]"
            :style="{ backgroundColor: tileHex(tile) }"
            :disabled="!isMyTurn || isGameOver"
            @click="selectSource(-1, tile)"
          />
        </div>
      </div>
    </div>

    <!-- Player Boards -->
    <div class="w-full max-w-[600px] space-y-6">
      <div
        v-for="player in orderedPlayers"
        :key="player.id"
        class="rounded-lg border p-3 shadow-sm"
        :class="[
          player.id === currentPlayerId ? 'border-primary bg-card' : 'bg-card/50',
          gameState.currentTurn === player.id ? 'ring-2 ring-primary/50' : '',
        ]"
      >
        <!-- Player header -->
        <div class="mb-2 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium" :class="{ 'font-bold': player.id === currentPlayerId }">
              {{ getPlayerDetails(player.id)?.displayName || 'Player' }}
              <span v-if="player.id === currentPlayerId" class="text-xs text-muted-foreground">(you)</span>
            </span>
            <span v-if="player.board.hasFirstPlayerMarker" class="text-xs text-yellow-500">1st</span>
          </div>
          <Badge variant="secondary" class="text-sm font-bold font-mono">{{ player.board.score }}</Badge>
        </div>

        <div class="flex items-start gap-2 sm:gap-3">
          <!-- Left column: Pattern Lines + Send to Floor -->
          <div class="flex flex-col items-end">
            <div class="flex flex-col items-end gap-[3px]">
              <div
                v-for="row in 5"
                :key="`pl-${player.id}-${row}`"
                class="flex items-center gap-[3px]"
              >
                <!-- Empty slots (right-aligned: empty on left, filled on right) -->
                <template v-for="col in row" :key="`pl-${player.id}-${row}-${col}`">
                  <div
                    v-if="col <= row - player.board.patternLines[row - 1]!.count"
                    class="board-tile-size rounded-sm border border-dashed border-muted-foreground/30"
                    :class="[
                      selectedSource && player.id === currentPlayerId && canPlaceOnLine(row - 1)
                        ? 'cursor-pointer border-primary/60 bg-primary/10 hover:bg-primary/20'
                        : '',
                    ]"
                    @click="selectedSource && player.id === currentPlayerId && canPlaceOnLine(row - 1) ? placeOnLine(row - 1) : undefined"
                  />
                  <div
                    v-else
                    class="board-tile-size rounded-sm border border-white/30 shadow-sm"
                    :style="{ backgroundColor: tileHex(player.board.patternLines[row - 1]!.color!) }"
                  />
                </template>
              </div>
            </div>
            <!-- Send to Floor button (below pattern lines, only for current player when tiles selected) -->
            <button
              v-if="selectedSource && isMyTurn && !isGameOver && player.id === currentPlayerId"
              class="mt-2 w-full rounded-md border border-destructive/50 bg-destructive/10 px-2 py-1 text-xs text-destructive hover:bg-destructive/20"
              @click="placeOnFloor"
            >
              Send to floor
            </button>
          </div>

          <!-- Arrow separator -->
          <div class="flex flex-col items-center justify-center gap-[3px] text-muted-foreground/40">
            <div v-for="row in 5" :key="`arrow-${row}`" class="flex board-tile-size items-center justify-center text-xs">
              →
            </div>
          </div>

          <!-- Right column: Wall + Floor Line -->
          <div class="flex flex-col">
            <div class="flex flex-col gap-[3px]">
              <div
                v-for="row in 5"
                :key="`wall-${player.id}-${row}`"
                class="flex gap-[3px]"
              >
                <div
                  v-for="col in 5"
                  :key="`wall-${player.id}-${row}-${col}`"
                  class="board-tile-size rounded-sm border"
                  :class="[
                    player.board.wall[row - 1]![col - 1]
                      ? 'border-white/50 shadow-sm'
                      : 'border-muted-foreground/20 opacity-30',
                  ]"
                  :style="{
                    backgroundColor: player.board.wall[row - 1]![col - 1]
                      ? tileHex(WALL_PATTERN[row - 1]![col - 1]!)
                      : tileHex(WALL_PATTERN[row - 1]![col - 1]!) + '40',
                  }"
                />
              </div>
            </div>
            <!-- Floor Line (below wall) -->
            <div class="mt-2">
              <span class="mb-1 block text-xs text-muted-foreground">Floor:</span>
              <div class="flex items-start gap-1">
                <template v-if="getFloorItems(player).length === 0">
                  <span class="text-xs text-muted-foreground italic">empty</span>
                </template>
                <div
                  v-for="(item, i) in getFloorItems(player)"
                  :key="`floor-${player.id}-${i}`"
                  class="flex flex-col items-center gap-0.5"
                >
                  <div
                    v-if="item.type === 'marker'"
                    class="floor-tile-size rounded-sm border border-yellow-400 bg-yellow-500/30 flex items-center justify-center text-xs font-bold text-yellow-500"
                  >1</div>
                  <div
                    v-else
                    class="floor-tile-size rounded-sm border border-white/30 shadow-sm"
                    :style="{ backgroundColor: tileHex(item.color!) }"
                  />
                  <span class="text-[10px] font-mono text-muted-foreground">{{ getFloorPenalty(i) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<style scoped>
/* Tiles in factories and center: bigger on small screens for touch */
.tile-size {
  width: 2rem;
  height: 2rem;
}
@media (min-width: 640px) {
  .tile-size {
    width: 1.75rem;
    height: 1.75rem;
  }
}

/* Board tiles (pattern lines + wall): slightly bigger on small screens */
.board-tile-size {
  width: 1.75rem;
  height: 1.75rem;
}
@media (min-width: 640px) {
  .board-tile-size {
    width: 1.75rem;
    height: 1.75rem;
  }
}

/* Floor tiles */
.floor-tile-size {
  width: 1.375rem;
  height: 1.375rem;
}
@media (min-width: 640px) {
  .floor-tile-size {
    width: 1.25rem;
    height: 1.25rem;
  }
}
</style>
