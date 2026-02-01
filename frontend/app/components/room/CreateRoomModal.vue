<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { getGameList, getDefaultGame } from '~/lib/games/registry'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'created', roomId: string): void
}>()

const { createRoom, isCreating } = useCreateRoom()
const { displayName } = useGuest()

const name = ref('')
const password = ref('')
const gameType = ref(getDefaultGame().id)
const error = ref('')

const games = getGameList()

const defaultRoomName = computed(() => `${displayName.value}'s room`)

const resetForm = () => {
  name.value = ''
  password.value = ''
  gameType.value = getDefaultGame().id
  error.value = ''
}

const handleSubmit = async () => {
  error.value = ''

  const roomName = name.value.trim() || defaultRoomName.value

  const result = await createRoom(roomName, password.value || undefined, gameType.value)

  if (result.success && result.roomId) {
    emit('update:open', false)
    emit('created', result.roomId)
    resetForm()
  } else if (result.error) {
    error.value = result.error
  }
}

watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    resetForm()
  }
})
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Create Room</DialogTitle>
        <DialogDescription>
          Set up a new game room for others to join.
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {{ error }}
        </div>

        <div class="space-y-2">
          <Label for="roomName">Room Name</Label>
          <Input
            id="roomName"
            v-model="name"
            :placeholder="defaultRoomName"
            maxlength="50"
          />
        </div>

        <div class="space-y-2">
          <Label for="roomPassword">Password (optional)</Label>
          <Input
            id="roomPassword"
            v-model="password"
            type="password"
            placeholder="Leave empty for public room"
          />
        </div>

        <div class="space-y-2">
          <Label for="gameType">Game</Label>
          <Select v-model="gameType">
            <SelectTrigger>
              <SelectValue placeholder="Select a game" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="game in games" :key="game.id" :value="game.id">
                {{ game.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="emit('update:open', false)">
            Cancel
          </Button>
          <Button type="submit" :disabled="isCreating">
            {{ isCreating ? 'Creating...' : 'Create Room' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
