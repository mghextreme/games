<script setup lang="ts">
import type { RoomWithDetails } from '~/lib/types'
import Card from '~/components/ui/card/Card.vue'
import CardContent from '~/components/ui/card/CardContent.vue'
import CardFooter from '~/components/ui/card/CardFooter.vue'
import CardHeader from '~/components/ui/card/CardHeader.vue'
import CardTitle from '~/components/ui/card/CardTitle.vue'
import Badge from '~/components/ui/badge/Badge.vue'
import Button from '~/components/ui/button/Button.vue'
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
  return 'Join Room'
})

const isButtonDisabled = computed(() => {
  // Can always rejoin if you're a player
  if (isCurrentUserInRoom.value) return false
  return props.room.status === 'playing'
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
