<script setup lang="ts">
import type { RoomWithDetails } from '~/lib/types'
import { Input } from '~/components/ui/input'
import RoomCard from './RoomCard.vue'
import { Search } from 'lucide-vue-next'

const props = defineProps<{
  rooms: readonly RoomWithDetails[]
  isLoading: boolean
  searchQuery: string
  currentGuestId?: string
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'join', roomId: string): void
}>()
</script>

<template>
  <div class="space-y-4">
    <div class="relative">
      <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        :model-value="searchQuery"
        placeholder="Search rooms..."
        class="pl-10"
        @update:model-value="emit('update:searchQuery', $event as string)"
      />
    </div>

    <div v-if="isLoading" class="py-8 text-center text-muted-foreground">
      Loading rooms...
    </div>

    <div v-else-if="rooms.length === 0" class="py-8 text-center text-muted-foreground">
      {{ searchQuery ? 'No rooms found matching your search.' : 'No rooms available. Create one to get started!' }}
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RoomCard
        v-for="room in rooms"
        :key="room._id"
        :room="room"
        :current-guest-id="currentGuestId"
        @join="emit('join', $event)"
      />
    </div>
  </div>
</template>
