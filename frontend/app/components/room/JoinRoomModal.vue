<script setup lang="ts">
import type { RoomWithDetails } from '~/lib/types'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

const props = defineProps<{
  open: boolean
  room: RoomWithDetails | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'join', password?: string): void
}>()

const password = ref('')
const error = ref('')

const handleSubmit = () => {
  error.value = ''
  emit('join', password.value || undefined)
}

watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    password.value = ''
    error.value = ''
  }
})
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Join Room</DialogTitle>
        <DialogDescription>
          Enter the password to join "{{ room?.name }}".
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {{ error }}
        </div>

        <div class="space-y-2">
          <Label for="joinPassword">Password</Label>
          <Input
            id="joinPassword"
            v-model="password"
            type="password"
            placeholder="Enter room password"
            required
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="emit('update:open', false)">
            Cancel
          </Button>
          <Button type="submit">
            Join
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
