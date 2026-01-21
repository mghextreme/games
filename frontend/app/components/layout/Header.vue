<script setup lang="ts">
import Button from '~/components/ui/button/Button.vue'
import Input from '~/components/ui/input/Input.vue'
import { Edit2, Check, X, Sun, Moon } from 'lucide-vue-next'

const { displayName, setDisplayName } = useGuest()
const { isDark, toggleColorMode } = useColorMode()

const isEditing = ref(false)
const editedName = ref('')

const startEditing = () => {
  editedName.value = displayName.value
  isEditing.value = true
}

const saveName = () => {
  if (editedName.value.trim()) {
    setDisplayName(editedName.value.trim())
  }
  isEditing.value = false
}

const cancelEdit = () => {
  isEditing.value = false
}
</script>

<template>
  <header class="border-b bg-background">
    <div class="container mx-auto flex h-16 items-center justify-between px-4">
      <NuxtLink to="/" class="text-xl font-bold">
        Game Rooms
      </NuxtLink>

      <div class="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          @click="toggleColorMode()"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <Sun v-if="isDark" class="h-4 w-4" />
          <Moon v-else class="h-4 w-4" />
        </Button>

        <div class="flex items-center gap-2">
          <template v-if="isEditing">
            <Input
              v-model="editedName"
              class="h-8 w-40"
              maxlength="50"
              @keyup.enter="saveName"
              @keyup.escape="cancelEdit"
            />
            <Button variant="ghost" size="icon" class="h-8 w-8" @click="saveName">
              <Check class="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" class="h-8 w-8" @click="cancelEdit">
              <X class="h-4 w-4" />
            </Button>
          </template>
          <template v-else>
            <span class="text-sm text-muted-foreground">
              {{ displayName }}
            </span>
            <Button variant="ghost" size="icon" class="h-8 w-8" @click="startEditing">
              <Edit2 class="h-4 w-4" />
            </Button>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>
