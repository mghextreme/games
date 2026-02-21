import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { Room, Player, PlayerWithDetails } from '~/lib/types'
import { getGame } from '~/lib/games/registry'

export function useRoom(roomId: string) {
  const { useQuery, useMutation } = useConvex()
  const { guestId, displayName: guestDisplayName } = useGuest()
  const { error: showError, success: showSuccess } = useToast()

  const isJoining = ref(false)
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null

  // Convex ID for room
  const convexRoomId = roomId as Id<'rooms'>

  // Real-time subscriptions
  const { data: roomData, isLoading: roomLoading } = useQuery(
    api.rooms.get,
    { roomId: convexRoomId }
  )

  const { data: playersData, isLoading: playersLoading } = useQuery(
    api.players.listByRoom,
    { roomId: convexRoomId }
  )

  // Mutations
  const joinMutation = useMutation(api.players.join)
  const leaveMutation = useMutation(api.players.leave)
  const kickMutation = useMutation(api.players.kick)
  const updateRoomMutation = useMutation(api.rooms.update)
  const deleteRoomMutation = useMutation(api.rooms.remove)
  const startGameMutation = useMutation(api.games.start)
  const makeMoveMutation = useMutation(api.games.makeMove)
  const resetGameMutation = useMutation(api.games.reset)
  const updateConnectionMutation = useMutation(api.players.updateConnection)

  // Computed values
  const room = computed(() => roomData.value as Room | null)
  const isLoading = computed(() => roomLoading.value || playersLoading.value)

  const players = computed<PlayerWithDetails[]>(() => {
    if (!playersData.value) return []
    return (playersData.value as PlayerWithDetails[]).map((p) => ({
      ...p,
      isCurrentUser: p.guestId === guestId.value,
    }))
  })

  const currentPlayer = computed(() => 
    players.value.find((p) => p.isCurrentUser) ?? null
  )

  const isHost = computed(() => {
    if (!room.value) return false
    return room.value.hostGuestId === guestId.value
  })

  const canStartGame = computed(() => {
    if (!room.value || !isHost.value) return false
    if (room.value.status !== 'waiting') return false

    const game = getGame(room.value.gameType)
    if (!game) return false

    return players.value.length >= game.minPlayers && players.value.length <= game.maxPlayers
  })

  const joinRoom = async (password?: string) => {
    isJoining.value = true
    try {
      // Check if room requires password
      if (room.value?.password && !password) {
        isJoining.value = false
        return { success: false, needsPassword: true }
      }

      await joinMutation.mutate({
        roomId: convexRoomId,
        guestId: guestId.value,
        displayName: guestDisplayName.value,
        password: password,
      })

      startHeartbeat()
      showSuccess('Joined room successfully')
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join room'
      showError(message)
      return { success: false, error: message }
    } finally {
      isJoining.value = false
    }
  }

  const leaveRoom = async () => {
    if (!currentPlayer.value) return

    try {
      stopHeartbeat()
      const result = await leaveMutation.mutate({
        roomId: convexRoomId,
        guestId: guestId.value,
      })

      if (result.roomDeleted) {
        showSuccess('Room deleted')
      } else {
        showSuccess('Left room successfully')
      }
    } catch (err) {
      console.error('Failed to leave room:', err)
      showError('Failed to leave room')
    }
  }

  const kickPlayer = async (playerGuestId: string) => {
    if (!isHost.value) return

    try {
      await kickMutation.mutate({
        roomId: convexRoomId,
        hostGuestId: guestId.value,
        playerGuestId,
      })
      showSuccess('Player kicked')
    } catch (err) {
      console.error('Failed to kick player:', err)
      showError('Failed to kick player')
    }
  }

  const updateRoom = async (data: { name?: string; password?: string; gameType?: string; maxPlayers?: number }) => {
    if (!isHost.value || !room.value) return

    try {
      await updateRoomMutation.mutate({
        roomId: convexRoomId,
        guestId: guestId.value,
        ...data,
      })
    } catch (err) {
      console.error('Failed to update room:', err)
      showError('Failed to update room')
    }
  }

  const startGame = async () => {
    if (!canStartGame.value || !room.value) return

    try {
      const game = getGame(room.value.gameType)
      if (!game) {
        showError('Game not found')
        return
      }

      // Use guestIds as player identifiers for the game
      const playerIds = players.value.map((p) => p.guestId)
      const initialState = game.setupGame(playerIds)

      await startGameMutation.mutate({
        roomId: convexRoomId,
        guestId: guestId.value,
        initialState,
      })

      showSuccess('Game started!')
    } catch (err) {
      console.error('Failed to start game:', err)
      showError('Failed to start game')
    }
  }

  const makeMove = async (move: unknown) => {
    if (!room.value || !currentPlayer.value || room.value.status !== 'playing') return

    const game = getGame(room.value.gameType)
    if (!game || !room.value.gameState) return

    // Validate move using guestId
    if (!game.validateMove(room.value.gameState, move, guestId.value)) {
      showError('Invalid move')
      return
    }

    try {
      // Apply move locally first for validation
      const newState = game.applyMove(room.value.gameState, move, guestId.value)

      await makeMoveMutation.mutate({
        roomId: convexRoomId,
        guestId: guestId.value,
        newState,
      })
    } catch (err) {
      console.error('Failed to make move:', err)
      showError('Failed to make move')
    }
  }

  const resetGame = async () => {
    if (!isHost.value || !room.value) return

    try {
      await resetGameMutation.mutate({
        roomId: convexRoomId,
        guestId: guestId.value,
      })
      showSuccess('Game reset')
    } catch (err) {
      console.error('Failed to reset game:', err)
      showError('Failed to reset game')
    }
  }

  const deleteRoom = async () => {
    if (!isHost.value || !room.value) return

    try {
      stopHeartbeat()
      await deleteRoomMutation.mutate({
        roomId: convexRoomId,
        guestId: guestId.value,
      })
      showSuccess('Room deleted')
    } catch (err) {
      console.error('Failed to delete room:', err)
      showError('Failed to delete room')
    }
  }

  const startHeartbeat = () => {
    stopHeartbeat()
    heartbeatInterval = setInterval(async () => {
      if (currentPlayer.value) {
        try {
          await updateConnectionMutation.mutate({
            guestId: guestId.value,
            isConnected: true,
          })
        } catch (err) {
          console.error('Heartbeat failed:', err)
        }
      }
    }, 30000) // Every 30 seconds
  }

  const stopHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
  }

  // Track if we've already updated connection status to avoid loops
  let hasUpdatedConnection = false

  // Auto-start heartbeat if already in room and update connection status
  watch(currentPlayer, async (player, oldPlayer) => {
    if (player) {
      // Only update connection status once when player first appears
      // This avoids infinite loops since updating triggers subscription changes
      if (!hasUpdatedConnection) {
        hasUpdatedConnection = true
        try {
          await updateConnectionMutation.mutate({
            guestId: guestId.value,
            isConnected: true,
          })
        } catch (err) {
          console.error('Failed to update connection status:', err)
        }
      }
      startHeartbeat()
    } else {
      hasUpdatedConnection = false
      stopHeartbeat()
    }
  }, { immediate: true })

  // Cleanup on unmount
  onUnmounted(async () => {
    stopHeartbeat()

    // Mark as disconnected when leaving
    if (currentPlayer.value) {
      try {
        await updateConnectionMutation.mutate({
          guestId: guestId.value,
          isConnected: false,
        })
      } catch {
        // Ignore errors during cleanup
      }
    }
  })

  return {
    room,
    players,
    currentPlayer,
    isLoading,
    isJoining: readonly(isJoining),
    isHost,
    canStartGame,
    joinRoom,
    leaveRoom,
    kickPlayer,
    updateRoom,
    startGame,
    makeMove,
    resetGame,
    deleteRoom,
  }
}
