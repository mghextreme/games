import { api } from '../../../convex/_generated/api'
import type { RoomWithDetails } from '~/lib/types'

export function useRooms() {
  const { useQuery } = useConvex()
  const { error: showError } = useToast()

  const searchQuery = ref('')
  
  // Reactive query that re-subscribes when searchQuery changes
  const { data: rooms, isLoading, error } = useQuery(
    api.rooms.list,
    () => ({ searchQuery: searchQuery.value })
  )

  // Watch for errors
  watch(error, (err) => {
    if (err) {
      console.error('Failed to fetch rooms:', err)
      showError('Failed to load rooms')
    }
  })

  return {
    rooms: computed(() => (rooms.value ?? []) as RoomWithDetails[]),
    isLoading,
    searchQuery,
  }
}
