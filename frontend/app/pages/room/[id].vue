<script setup lang="ts">
import Header from '~/components/layout/Header.vue'
import PlayerList from '~/components/room/PlayerList.vue'
import GameOptions from '~/components/room/GameOptions.vue'
import GameContainer from '~/components/games/GameContainer.vue'
import JoinRoomModal from '~/components/room/JoinRoomModal.vue'
import { Toaster } from '~/components/ui/sonner'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '~/components/ui/drawer'
import { ArrowLeft, Lock, Users, Trash, ChessQueen } from 'lucide-vue-next'
import { getGame } from '~/lib/games/registry'
import type { GameSettings } from '~/lib/types'

const route = useRoute()
const router = useRouter()
const { guestId } = useGuest()

const roomId = route.params.id as string
const {
  room,
  players,
  currentPlayer,
  isLoading,
  isJoining,
  isHost,
  canStartGame,
  joinRoom,
  leaveRoom,
  kickPlayer,
  updateRoom,
  startGame,
  makeMove,
  resetGame,
  deleteRoom,
} = useRoom(roomId)

const showPasswordModal = ref(false)
const playersOpen = ref(false)
const gameControlsOpen = ref(false)
const gameSettings = ref<GameSettings>({ playerSettings: {} })

const game = computed(() => room.value ? getGame(room.value.gameType) : null)

const handleJoin = async (password?: string) => {
  const result = await joinRoom(password)
  if (result.needsPassword) {
    showPasswordModal.value = true
  } else if (result.success) {
    showPasswordModal.value = false
  }
}

const handleLeave = async () => {
  await leaveRoom()
  router.push('/')
}

const handleDelete = async () => {
  await deleteRoom()
  router.push('/')
}

const handleMove = (move: unknown) => {
  makeMove(move)
}

const handleKick = (playerGuestId: string) => {
  kickPlayer(playerGuestId)
}

// If room doesn't exist after loading, redirect
watch([room, isLoading], ([newRoom, loading]) => {
  if (!loading && !newRoom) {
    router.push('/')
  }
})

// Watch for being kicked (player disappears from list)
watch(currentPlayer, (player, oldPlayer) => {
  if (oldPlayer && !player && !isLoading.value) {
    router.push('/')
  }
})

// Try to join room when component mounts
onMounted(async () => {
  // Wait for room data to load
  await nextTick()
  
  // Small delay to let Convex subscription populate
  setTimeout(async () => {
    if (room.value && !currentPlayer.value) {
      await handleJoin()
    }
  }, 500)
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <Header>
      <template #default>
        <div class="flex items-center gap-2">
          <h1 class="text-lg font-bold">{{ room?.name }}</h1>
          <Lock v-if="room?.password" class="h-5 w-5 text-muted-foreground" />
          <div class="space-x-1">
            <Badge variant="outline" class="ml-2">{{ game?.name || room?.gameType }}</Badge>
            <Badge variant="outline" class="ml-2">{{ players.length }} / {{ room?.maxPlayers }}</Badge>
            <Badge
              :variant="room?.status === 'waiting' ? 'outline' : room?.status === 'playing' ? 'default' : 'secondary'"
            >
              {{ room?.status }}
            </Badge>
          </div>
        </div>
      </template>
      <template #buttons>
        <Button v-if="isHost" variant="destructive" size="icon" @click="handleDelete" title="Delete Room">
          <Trash class="h-4 w-4" />
        </Button>
        <Button v-else variant="outline" size="icon" @click="handleLeave" title="Leave Room">
          <ArrowLeft class="h-4 w-4" />
        </Button>

        <Drawer v-model:open="playersOpen">
          <DrawerTrigger as-child>
            <Button variant="outline" size="icon" class="xl:hidden" title="Players">
              <Users class="h-4 w-4" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>
                Players
                <Badge variant="outline" class="ml-2">{{ players.length }}</Badge>
              </DrawerTitle>
            </DrawerHeader>
            <div class="px-4">
              <PlayerList
                :players="players"
                :is-host="isHost"
                :current-guest-id="guestId"
                @kick="handleKick"
              />
            </div>
            <DrawerFooter>
              <DrawerClose>
                <Button variant="outline" class="w-full">
                  Close
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <Drawer v-if="isHost" v-model:open="gameControlsOpen">
          <DrawerTrigger as-child>
            <Button variant="outline" size="icon" class="xl:hidden" title="Game Options">
              <ChessQueen class="h-4 w-4" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Game Options</DrawerTitle>
            </DrawerHeader>
            <div class="px-4">
              <GameOptions
                :room="room"
                :can-start-game="canStartGame"
                @update="updateRoom"
              />
            </div>
            <DrawerFooter>
              <DrawerClose>
                <Button variant="outline" class="w-full">
                  Close
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </template>
    </Header>

    <main class="container mx-auto px-4 py-6">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <p class="text-muted-foreground">Loading room...</p>
      </div>

      <!-- Room Not Found -->
      <div v-else-if="!room" class="flex flex-col items-center justify-center py-12">
        <p class="text-lg text-muted-foreground">Room not found</p>
        <Button variant="link" @click="router.push('/')">
          <ArrowLeft class="mr-2 h-4 w-4" />
          Back to Rooms
        </Button>
      </div>

      <!-- Room Content -->
      <template v-else>
        <!-- Header -->
        <div class="mb-6" v-if="isHost">
          <div class="flex flex-col items-start justify-between gap-4">
            <div class="flex gap-2">
              <Button v-if="room.status === 'waiting'" variant="outline" @click="startGame(gameSettings)">
                Start Game
              </Button>
              <Button v-if="room.status === 'finished'" variant="outline" @click="resetGame">
                Start New Game
              </Button>
            </div>
            <p v-if="room.status === 'waiting' && (!!game && players.length < game?.minPlayers)" class="text-xs text-muted-foreground">
              Need {{ game?.minPlayers || 2 }} players to start
            </p>
          </div>
        </div>

        <!-- Not in Room -->
        <div v-if="!currentPlayer && !isJoining" class="flex flex-col items-center justify-center py-12">
          <p class="mb-4 text-lg text-muted-foreground">You are not in this room</p>
          <Button @click="handleJoin()">
            Join Room
          </Button>
        </div>

        <!-- Joining -->
        <div v-else-if="isJoining" class="flex items-center justify-center py-12">
          <p class="text-muted-foreground">Joining room...</p>
        </div>

        <!-- Room Layout -->
        <div v-else class="grid gap-6 xl:grid-cols-[1fr,320px]">
          <!-- Game Area -->
          <div class="rounded-lg border bg-card p-6">
            <GameContainer
              :room="room"
              :players="players"
              :current-player-id="guestId"
              @move="handleMove"
              @update:settings="gameSettings = $event"
            />
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <div v-if="isHost" class="space-y-2 max-xl:hidden">
              <h3 class="text-sm font-medium text-muted-foreground">
                Host Controls
              </h3>

              <!-- Game Options -->
              <GameOptions
                :room="room"
                @update="updateRoom"
                @start="startGame"
                @delete="handleDelete"
              />
            </div>

            <div class="space-y-2 max-xl:hidden">
              <h3 class="text-sm font-medium text-muted-foreground">
                Players
                <Badge variant="outline" class="ml-2">{{ players.length }}</Badge>
              </h3>

              <!-- Player List -->
              <PlayerList
                :players="players"
                :is-host="isHost"
                :current-guest-id="guestId"
                @kick="handleKick"
              />
            </div>
          </div>
        </div>
      </template>
    </main>

    <JoinRoomModal
      v-model:open="showPasswordModal"
      :room="room as any"
      @join="handleJoin"
    />
    <Toaster />
  </div>
</template>
