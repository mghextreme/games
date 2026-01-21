<script setup lang="ts">
import Header from '~/components/layout/Header.vue'
import PlayerList from '~/components/room/PlayerList.vue'
import HostControls from '~/components/room/HostControls.vue'
import GameContainer from '~/components/games/GameContainer.vue'
import JoinRoomModal from '~/components/room/JoinRoomModal.vue'
import Toaster from '~/components/ui/toast/Toaster.vue'
import Button from '~/components/ui/button/Button.vue'
import Badge from '~/components/ui/badge/Badge.vue'
import { ArrowLeft, Lock } from 'lucide-vue-next'
import { getGame } from '~/lib/games/registry'

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
    <Header />

    <main class="container mx-auto px-4 py-8">
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
        <div class="mb-6">
          <Button variant="ghost" size="sm" class="mb-4" @click="router.push('/')">
            <ArrowLeft class="mr-2 h-4 w-4" />
            Back to Rooms
          </Button>

          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-2xl font-bold">{{ room.name }}</h1>
                <Lock v-if="room.password" class="h-5 w-5 text-muted-foreground" />
                <Badge
                  :variant="room.status === 'waiting' ? 'success' : room.status === 'playing' ? 'warning' : 'secondary'"
                >
                  {{ room.status }}
                </Badge>
              </div>
              <p class="text-muted-foreground">
                {{ game?.name || room.gameType }} - {{ players.length }} / {{ room.maxPlayers }} players
              </p>
            </div>

            <div class="flex gap-2">
              <Button v-if="currentPlayer && !isHost" variant="outline" @click="handleLeave">
                Leave Room
              </Button>
              <Button v-if="isHost && room.status === 'finished'" variant="outline" @click="resetGame">
                New Game
              </Button>
            </div>
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
        <div v-else class="grid gap-6 lg:grid-cols-[1fr,300px]">
          <!-- Game Area -->
          <div class="rounded-lg border bg-card p-6">
            <GameContainer
              :room="room"
              :players="players"
              :current-player-id="guestId"
              @move="handleMove"
            />
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Player List -->
            <PlayerList
              :players="players"
              :is-host="isHost"
              :current-guest-id="guestId"
              @kick="handleKick"
            />

            <!-- Host Controls -->
            <HostControls
              v-if="isHost"
              :room="room"
              :can-start-game="canStartGame"
              @update="updateRoom"
              @start="startGame"
              @delete="handleDelete"
            />
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
