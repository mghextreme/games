<script setup lang="ts">
import type { RoomWithDetails } from '~/lib/types'
import Header from '~/components/layout/Header.vue'
import RoomList from '~/components/room/RoomList.vue'
import CreateRoomModal from '~/components/room/CreateRoomModal.vue'
import JoinRoomModal from '~/components/room/JoinRoomModal.vue'
import { Button } from '~/components/ui/button'
import { Plus } from 'lucide-vue-next'
import { api } from '../../../convex/_generated/api'

const router = useRouter()
const { guestId, displayName } = useGuest()
const { rooms, isLoading, searchQuery } = useRooms()
const { query, useMutation } = useConvex()
const { error: showError } = useToast()

const joinMutation = useMutation(api.players.join)

const isCreateModalOpen = ref(false)
const isJoinModalOpen = ref(false)
const selectedRoom = ref<RoomWithDetails | null>(null)

const handleJoinClick = async (roomId: string) => {
  const room = rooms.value.find((r) => r._id === roomId)
  if (!room) return

  // Check if user is already in another room
  try {
    const existingRoom = await query(api.rooms.getByGuestId, {
      guestId: guestId.value,
    })

    if (existingRoom) {
      if (existingRoom._id === roomId) {
        // Already in this room, navigate to it
        router.push(`/room/${roomId}`)
        return
      } else {
        showError('You are already in another room. Leave that room first.')
        return
      }
    }
  } catch (err) {
    console.error('Failed to check existing player:', err)
  }

  if (room.hasPassword) {
    selectedRoom.value = room
    isJoinModalOpen.value = true
  } else {
    // Join directly
    await joinRoom(room._id as string)
  }
}

const joinRoom = async (roomId: string, password?: string) => {
  try {
    await joinMutation.mutate({
      roomId: roomId as any,
      guestId: guestId.value,
      displayName: displayName.value,
      password,
    })

    isJoinModalOpen.value = false
    selectedRoom.value = null
    router.push(`/room/${roomId}`)
  } catch (err) {
    console.error('Failed to join room:', err)
    const message = err instanceof Error ? err.message : 'Failed to join room'
    showError(message)
  }
}

const handleRoomCreated = (roomId: string) => {
  router.push(`/room/${roomId}`)
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <Header />

    <main class="container mx-auto px-4 py-8">
      <div class="mb-6 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
        <div>
          <h1 class="text-2xl font-bold">Game Rooms</h1>
          <p class="text-muted-foreground">Join a room or create your own to play with friends</p>
        </div>
        <Button class="gap-2" variant="outline" size="icon" @click="isCreateModalOpen = true" title="Create room">
          <Plus class="h-4 w-4" />
        </Button>
      </div>

      <RoomList
        :rooms="rooms"
        :is-loading="isLoading"
        :current-guest-id="guestId"
        :search-query="searchQuery"
        @join="handleJoinClick"
      />
    </main>

    <CreateRoomModal :open="isCreateModalOpen" @update:open="isCreateModalOpen = $event" @created="handleRoomCreated" />
    <JoinRoomModal
      :open="isJoinModalOpen"
      @update:open="isJoinModalOpen = $event"
      :room="selectedRoom"
      @join="joinRoom(selectedRoom?._id as string, $event)"
    />
  </div>
</template>
