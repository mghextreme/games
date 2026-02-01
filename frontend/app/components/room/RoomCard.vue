<script setup lang="ts">
import type { RoomWithDetails } from '~/lib/types'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Lock, Users } from 'lucide-vue-next'
import { getGame } from '~/lib/games/registry'

const props = defineProps<{
  room: RoomWithDetails
  currentGuestId?: string
}>()

const emit = defineEmits<{
  (e: 'join', roomId: string): void
}>()

const game = computed(() => getGame(props.room.gameType))

const isCurrentUserInRoom = computed(() => {
  if (!props.currentGuestId) return false
  return props.room.playerGuestIds?.includes(props.currentGuestId)
})

const isRoomFull = computed(() => {
  return props.room.playerCount >= props.room.maxPlayers
})

const statusVariant = computed(() => {
  switch (props.room.status) {
    case 'waiting':
      return 'success'
    case 'playing':
      return 'warning'
    default:
      return 'secondary'
  }
})

const buttonText = computed(() => {
  if (isCurrentUserInRoom.value) return 'Rejoin'
  if (props.room.status === 'playing') return 'Game in Progress'
  if (isRoomFull.value) return 'Room Full'
  return 'Join Room'
})

const isButtonDisabled = computed(() => {
  // Can always rejoin if you're a player
  if (isCurrentUserInRoom.value) return false
  // Disable if game in progress or room is full
  return props.room.status === 'playing' || isRoomFull.value
})
</script>

<template>
  <Card class="flex flex-col">
    <CardHeader class="pb-2">
      <div class="flex items-start justify-between gap-2">
        <CardTitle class="text-lg">
          {{ room.name }}
        </CardTitle>
        <div class="flex items-center gap-2">
          <Lock v-if="room.hasPassword" class="h-4 w-4 text-muted-foreground" />
          <Badge :variant="statusVariant">
            {{ room.status }}
          </Badge>
        </div>
      </div>
    </CardHeader>
    <CardContent class="flex-1 space-y-2 pb-2">
      <p class="text-sm text-muted-foreground">
        Host: <span class="font-medium text-foreground">{{ room.hostDisplayName }}</span>
      </p>
      <p class="text-sm text-muted-foreground">
        Game: <span class="font-medium text-foreground">{{ game?.name || room.gameType }}</span>
      </p>
      <div class="flex items-center gap-1 text-sm text-muted-foreground">
        <Users class="h-4 w-4" />
        <span>{{ room.playerCount }} / {{ room.maxPlayers }}</span>
      </div>
    </CardContent>
    <CardFooter>
      <Button
        class="w-full"
        :disabled="isButtonDisabled"
        @click="emit('join', room._id as string)"
      >
        {{ buttonText }}
      </Button>
    </CardFooter>
  </Card>
</template>
