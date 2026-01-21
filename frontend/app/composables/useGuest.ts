import { api } from '../../../convex/_generated/api'

const GUEST_ID_KEY = 'game_rooms_guest_id'
const GUEST_NAME_KEY = 'game_rooms_guest_name'

function generateGuestId(): string {
  return Math.random().toString(36).substring(2, 10)
}

function generateGuestName(): string {
  const adjectives = ['Swift', 'Clever', 'Bold', 'Mighty', 'Wise', 'Quick', 'Brave', 'Lucky']
  const nouns = ['Fox', 'Wolf', 'Bear', 'Eagle', 'Lion', 'Tiger', 'Hawk', 'Owl']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 100)
  return `${adj}${noun}${num}`
}

export function useGuest() {
  const guestId = ref<string>('')
  const displayName = ref<string>('')

  const { useMutation } = useConvex()
  const updateDisplayNameMutation = useMutation(api.players.updateDisplayName)

  const initGuest = () => {
    if (!import.meta.client) return

    // Get or create guest ID
    let storedId = localStorage.getItem(GUEST_ID_KEY)
    if (!storedId) {
      storedId = generateGuestId()
      localStorage.setItem(GUEST_ID_KEY, storedId)
    }
    guestId.value = storedId

    // Get or create guest name
    let storedName = localStorage.getItem(GUEST_NAME_KEY)
    if (!storedName) {
      storedName = generateGuestName()
      localStorage.setItem(GUEST_NAME_KEY, storedName)
    }
    displayName.value = storedName
  }

  const setDisplayName = async (name: string) => {
    if (!import.meta.client) return
    displayName.value = name
    localStorage.setItem(GUEST_NAME_KEY, name)

    // Sync display name to Convex if user is in a room
    if (guestId.value) {
      try {
        await updateDisplayNameMutation.mutate({
          guestId: guestId.value,
          displayName: name,
        })
      } catch (err) {
        // Silently ignore - user might not be in a room
        console.debug('Failed to sync display name to Convex:', err)
      }
    }
  }

  const regenerateName = () => {
    const newName = generateGuestName()
    setDisplayName(newName)
    return newName
  }

  // Initialize on first use
  if (import.meta.client) {
    initGuest()
  }

  return {
    guestId: readonly(guestId),
    displayName,
    setDisplayName,
    regenerateName,
    initGuest,
  }
}
