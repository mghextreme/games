import { api } from '../../../convex/_generated/api'
import { getDefaultGame, getGame } from '~/lib/games/registry'

export function useCreateRoom() {
  const { useMutation, query } = useConvex()
  const { guestId, displayName } = useGuest()
  const { error: showError, success: showSuccess } = useToast()

  const isCreating = ref(false)

  const createRoomMutation = useMutation(api.rooms.create)

  const checkCanCreateRoom = async (): Promise<{ canCreate: boolean; error?: string }> => {
    if (!guestId.value) {
      return { canCreate: false, error: 'Guest ID not initialized' }
    }

    try {
      // Check if guest is already in a room (via Convex query)
      const existingRoom = await query(api.rooms.getByGuestId, {
        guestId: guestId.value,
      })

      if (existingRoom) {
        return { canCreate: false, error: 'You are already in a room' }
      }

      return { canCreate: true }
    } catch (err) {
      console.error('Failed to check room status:', err)
      return { canCreate: false, error: 'Failed to verify room status' }
    }
  }

  const createRoom = async (
    name: string,
    password?: string,
    gameType?: string
  ): Promise<{ success: boolean; roomId?: string; error?: string }> => {
    const canCreateResult = await checkCanCreateRoom()
    if (!canCreateResult.canCreate) {
      showError(canCreateResult.error!)
      return { success: false, error: canCreateResult.error }
    }

    isCreating.value = true

    try {
      const game = gameType ? getGame(gameType) : getDefaultGame()

      if (!game) {
        showError('Invalid game type')
        return { success: false, error: 'Invalid game type' }
      }

      const roomId = await createRoomMutation.mutate({
        name: name.trim(),
        password: password?.trim() || undefined,
        guestId: guestId.value,
        displayName: displayName.value,
        gameType: game.id,
        maxPlayers: game.maxPlayers,
      })

      showSuccess('Room created successfully')
      return { success: true, roomId: roomId as string }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create room'
      showError(message)
      return { success: false, error: message }
    } finally {
      isCreating.value = false
    }
  }

  return {
    isCreating: readonly(isCreating),
    checkCanCreateRoom,
    createRoom,
  }
}
