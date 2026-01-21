# Game Rooms - Architecture & Decisions

This document contains all architectural decisions, conventions, and implementation details for the Game Rooms platform.

**IMPORTANT**: This document must be updated whenever architectural decisions change. Keep it in sync with the actual implementation.

## Overview

A multiplayer game room platform where users can create, search, and join rooms to play various games with others. All users are guests (no authentication required).

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Nuxt 3 (Vue 3, TypeScript) | SSR support, excellent DX, mature ecosystem |
| UI Components | shadcn-vue + Tailwind CSS | Customizable, accessible components |
| Backend/Database | Convex | Real-time by default, TypeScript-first, automatic schema management |
| Real-time | Convex subscriptions | Built-in WebSocket reactivity |
| Deployment | Docker Compose | Self-hosted, local-first setup |
| Package Manager | pnpm | Fast, disk-efficient, strict dependency management |

## Database Schema

### Tables (Convex)

#### `rooms`
- `_id` (Id<"rooms">, auto-generated)
- `_creationTime` (number, auto-generated)
- `name` (string, required, 1-50 chars)
- `password` (string, optional)
- `hostGuestId` (string, required) - Guest ID of the room creator
- `hostDisplayName` (string, required) - Display name of the host
- `gameType` (string, required)
- `status` ("waiting" | "playing" | "finished")
- `gameState` (any, optional) - Flexible JSON for game-specific state
- `maxPlayers` (number, 2-20)
- `lastActivity` (number, timestamp for cleanup)

**Indexes:**
- `by_host` - Query rooms by hostGuestId
- `by_status` - Query rooms by status

#### `players`
- `_id` (Id<"players">, auto-generated)
- `_creationTime` (number, auto-generated)
- `roomId` (Id<"rooms">, required) - Reference to room
- `guestId` (string, required) - Guest ID from localStorage
- `displayName` (string, required, 1-50 chars)
- `isConnected` (boolean)
- `lastSeen` (number, timestamp for reconnection)

**Indexes:**
- `by_room` - Query players in a room
- `by_guest` - Query rooms a guest is in

## Business Rules

### Guest Identity
- Every user is a guest identified by a UUID stored in localStorage
- Guest ID persists across browser sessions (same browser = same identity)
- Display name can be changed anytime, stored in localStorage
- If localStorage is cleared, the user gets a new identity

### Room Constraints
1. **One room per guest**: A guest can only be in ONE room at a time (as host or player)
2. **One hosted room**: A guest can only host ONE active room at a time
3. **Host identification**: Host is identified by `hostGuestId` field
4. **Auto-cleanup**: Rooms auto-delete after 12 hours of no activity

### Player Lifecycle
1. **Join**: Create player record, automatic real-time subscription via Convex
2. **Disconnect**: Set `isConnected = false`, `lastSeen = now`
3. **Reconnect** (within 5 min): Restore connection status
4. **Timeout** (after 5 min disconnected): Auto-remove from room
5. **Kick**: Host deletes player record, client notified via Convex subscription

### Game Lifecycle
1. **Waiting**: Host configures room, players join
2. **Playing**: Game in progress, no new joins, gameState updates
3. **Finished**: Game complete, room returns to "waiting" state automatically

## Screens & Behavior

### Home Page (`/`)
- Header: App title, guest display name (editable)
- "Create Room" button (always available)
- Search input for filtering rooms
- Room list showing: name, host, game type, player count, max players, password indicator
- "Join" button on each room

### Create Room Modal
- Room name (required)
- Password (optional)
- Game selection dropdown
- Validation: Cannot create if already in a room

### Join Room Modal
- If password protected: Password input + Join button
- If not protected: Direct join
- Validation: Cannot join if already in another room

### Room Page (`/room/[id]`)
- Room name (editable by host in waiting status)
- Game type display
- Player list with connection status and host badge
- Host controls: change game, set password, kick players, start game, delete room
- Game area (shows game or waiting message)

## Multi-Game Architecture

### Game Registry
```typescript
interface GameDefinition {
  id: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  component: () => Promise<Component>
  createInitialState: (playerIds: string[]) => GameState
  validateMove: (state: GameState, move: Move, playerId: string) => boolean
  applyMove: (state: GameState, move: Move) => GameState
  checkWinner: (state: GameState) => string | null
  checkDraw: (state: GameState) => boolean
}
```

### Adding New Games
1. Create game directory: `frontend/app/lib/games/{game-id}/`
2. Implement `types.ts` with state and move types
3. Implement `engine.ts` with game logic
4. Create Vue component in `frontend/app/components/games/{game-id}/`
5. Register in `frontend/app/lib/games/registry.ts`

## Tic Tac Toe Implementation

### State Structure
```typescript
interface TicTacToeState {
  board: (string | null)[][]  // 3x3, playerId or null
  currentTurn: string         // playerId
  winner: string | null
  isDraw: boolean
  players: { id: string; symbol: 'X' | 'O' }[]
}
```

### Rules
- Exactly 2 players
- Players alternate turns
- First to 3 in a row wins
- Draw if board full with no winner

## File Structure

```
games/
├── docker-compose.yml
├── AGENTS.md
├── README.md
├── convex/
│   ├── schema.ts              # Database schema
│   ├── rooms.ts               # Room queries and mutations
│   ├── players.ts             # Player queries and mutations
│   ├── games.ts               # Game state mutations
│   └── _generated/            # Auto-generated types
└── frontend/
    ├── Dockerfile
    ├── nuxt.config.ts
    ├── tailwind.config.ts
    ├── app/
    │   ├── app.vue
    │   ├── assets/css/
    │   ├── components/
    │   │   ├── ui/            # shadcn-vue components
    │   │   ├── layout/
    │   │   ├── room/
    │   │   └── games/
    │   ├── composables/
    │   │   ├── useConvex.ts   # Convex client wrapper
    │   │   ├── useGuest.ts    # Guest identity management
    │   │   ├── useRooms.ts    # Room list and search
    │   │   ├── useRoom.ts     # Single room state
    │   │   └── useGame.ts     # Game state management
    │   ├── lib/
    │   │   ├── utils.ts
    │   │   ├── types.ts
    │   │   └── games/
    │   │       ├── registry.ts
    │   │       └── tic-tac-toe/
    │   └── pages/
    │       ├── index.vue
    │       └── room/[id].vue
```

## API Patterns

### Convex Queries (Real-time)
```typescript
// Queries automatically re-run when data changes
const rooms = useQuery(api.rooms.list, { searchQuery: '' })

// Room details with players
const room = useQuery(api.rooms.get, { roomId })
const players = useQuery(api.players.listByRoom, { roomId })
```

### Convex Mutations
```typescript
// Mutations are type-safe and transactional
const createRoom = useMutation(api.rooms.create)
await createRoom({ 
  name: 'My Room',
  guestId: guestId.value,
  displayName: displayName.value,
  gameType: 'tic-tac-toe'
})

// Game moves
const makeMove = useMutation(api.games.makeMove)
await makeMove({ roomId, guestId, move: { row: 0, col: 1 } })
```

### Error Handling
- Use toast notifications for user feedback
- Convex handles reconnection automatically
- Optimistic updates for better UX

## Development

### Running Locally (Self-Hosted Convex)
```bash
# Start all services
docker compose up

# Generate admin key (first time only)
docker compose exec convex-backend ./generate_admin_key.sh

# Create .env.local with the admin key
echo "CONVEX_SELF_HOSTED_URL='http://127.0.0.1:3210'" > .env.local
echo "CONVEX_SELF_HOSTED_ADMIN_KEY='<your-key>'" >> .env.local

# Deploy Convex functions
pnpm convex dev
```

**Services:**
- Frontend: http://localhost:3000
- Convex Backend: http://localhost:3210
- Convex Dashboard: http://localhost:6791

### Schema Changes
Convex automatically handles schema migrations. Just update `convex/schema.ts` and the dev server will push changes:

```bash
pnpm convex dev
```

## Future Considerations (Not Implemented)

### Spectators
- Infrastructure supports adding spectator role to players table
- Would require `isSpectator` boolean field
- Spectators can view but not interact with game

### Additional Games
- Architecture designed for easy game additions
- Each game is self-contained module
- Follow existing Tic Tac Toe pattern

### Rate Limiting
- Consider adding rate limiting based on guest ID
- Prevent spam room creation
- Limit join attempts

### Room Ownership Recovery
- If host loses their guest ID, they lose room ownership
- Could add optional "room secret" for ownership recovery
