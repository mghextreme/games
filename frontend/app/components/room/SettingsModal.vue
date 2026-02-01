<script setup lang="ts">
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Sun, Moon } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'updated'): void
}>()

const { displayName, setDisplayName } = useGuest()
const { mode: colorMode } = useColorMode()

const editedName = ref(displayName.value)
const error = ref('')

const resetForm = () => {
  editedName.value = displayName.value
  error.value = ''
}

const handleSubmit = async () => {
  error.value = ''

  const newName = editedName.value.trim()
  if (newName.length < 2) {
    error.value = "Display name must have at least 2 characters"
    return
  }

  setDisplayName(newName)
  emit('update:open', false)
  emit('updated')
  resetForm()
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
        <DialogTitle>User settings</DialogTitle>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {{ error }}
        </div>

        <div class="space-y-2">
          <Label>Theme</Label>
          <Tabs v-model="colorMode" class="w-full">
            <TabsList class="grid w-full grid-cols-2">
              <TabsTrigger value="light" class="gap-2">
                <Sun class="h-4 w-4" />
                Light
              </TabsTrigger>
              <TabsTrigger value="dark" class="gap-2">
                <Moon class="h-4 w-4" />
                Dark
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div class="space-y-2">
          <Label for="roomName">Display Name</Label>
          <Input
            id="displayName"
            v-model="editedName"
            placeholder="Display name"
            maxlength="20"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="emit('update:open', false)">
            Cancel
          </Button>
          <Button type="submit">
            Save
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
