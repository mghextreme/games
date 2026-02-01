<script setup lang="ts">
import type { Room } from '~/lib/types'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { getGameList, getGame } from '~/lib/games/registry'
import { Lock, LockOpen } from 'lucide-vue-next'

const props = defineProps<{
  room: Room
}>()

const emit = defineEmits<{
  (e: 'update', data: { name?: string; password?: string; gameType?: string; maxPlayers?: number }): void
}>()

const games = getGameList()

const isEditingName = ref(false)
const editedName = ref('')
const isEditingPassword = ref(false)
const editedPassword = ref('')

const currentGame = computed(() => getGame(props.room.gameType))

const startEditingName = () => {
  editedName.value = props.room.name
  isEditingName.value = true
}

const saveName = () => {
  if (editedName.value.trim() && editedName.value !== props.room.name) {
    emit('update', { name: editedName.value.trim() })
  }
  isEditingName.value = false
}

const startEditingPassword = () => {
  editedPassword.value = ''
  isEditingPassword.value = true
}

const savePassword = () => {
  emit('update', { password: editedPassword.value || '' })
  isEditingPassword.value = false
}

const removePassword = () => {
  emit('update', { password: '' })
}

const handleGameChange = (gameType: string) => {
  const game = getGame(gameType)
  if (game) {
    emit('update', { gameType, maxPlayers: game.maxPlayers })
  }
}
</script>

<template>
  <div class="space-y-4 rounded-lg border bg-card p-4">
    <!-- Game Selection -->
    <div class="space-y-2">
      <Label>Game</Label>
      <Select
        :model-value="room.gameType"
        :disabled="room.status !== 'waiting'"
        @update:model-value="handleGameChange"
      >
        <SelectTrigger>
          <SelectValue>{{ currentGame?.name || room.gameType }}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="game in games" :key="game.id" :value="game.id">
            {{ game.name }} ({{ game.minPlayers }}<template v-if="game?.minPlayers != game?.maxPlayers">-{{ game?.maxPlayers }}</template> players)
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Room Name -->
    <div class="space-y-2">
      <Label>Room Name</Label>
      <div v-if="isEditingName" class="flex gap-2">
        <Input v-model="editedName" maxlength="50" @keyup.enter="saveName" />
        <Button size="sm" @click="saveName">Save</Button>
        <Button size="sm" variant="outline" @click="isEditingName = false">Cancel</Button>
      </div>
      <div v-else class="flex items-center gap-2">
        <span class="text-sm">{{ room.name }}</span>
        <Button size="sm" variant="ghost" :disabled="room.status !== 'waiting'" @click="startEditingName">
          Edit
        </Button>
      </div>
    </div>

    <!-- Password -->
    <div class="space-y-2">
      <Label>Password</Label>
      <div v-if="isEditingPassword" class="flex gap-2">
        <Input v-model="editedPassword" type="password" placeholder="Leave empty to remove" />
        <Button size="sm" @click="savePassword">Save</Button>
        <Button size="sm" variant="outline" @click="isEditingPassword = false">Cancel</Button>
      </div>
      <div v-else class="flex items-center gap-2">
        <div class="flex items-center gap-1 text-sm text-muted-foreground">
          <Lock v-if="room.password" class="h-4 w-4" />
          <LockOpen v-else class="h-4 w-4" />
          <span>{{ room.password ? 'Password protected' : 'No password' }}</span>
        </div>
        <Button size="sm" variant="ghost" @click="startEditingPassword">
          {{ room.password ? 'Change' : 'Set' }}
        </Button>
        <Button v-if="room.password" size="sm" variant="ghost" @click="removePassword">
          Remove
        </Button>
      </div>
    </div>
  </div>
</template>
