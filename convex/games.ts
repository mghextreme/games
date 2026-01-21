import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Game logic is kept on the frontend for flexibility
// These mutations handle game state transitions and storage

// Start a game (host only)
export const start = mutation({
  args: {
    roomId: v.id("rooms"),
    guestId: v.string(),
    initialState: v.any(), // Game-specific initial state from frontend
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.hostGuestId !== args.guestId) {
      throw new Error("Only the host can start the game");
    }

    if (room.status !== "waiting") {
      throw new Error("Game has already started");
    }

    // Get player count
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    if (players.length < 2) {
      throw new Error("Need at least 2 players to start");
    }

    await ctx.db.patch(args.roomId, {
      status: "playing",
      gameState: args.initialState,
      lastActivity: Date.now(),
    });
  },
});

// Make a move in the game
export const makeMove = mutation({
  args: {
    roomId: v.id("rooms"),
    guestId: v.string(),
    newState: v.any(), // New game state computed by frontend
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.status !== "playing") {
      throw new Error("Game is not in progress");
    }

    // Verify player is in the room
    const player = await ctx.db
      .query("players")
      .withIndex("by_guest", (q) => q.eq("guestId", args.guestId))
      .first();

    if (!player || player.roomId !== args.roomId) {
      throw new Error("You are not in this room");
    }

    // Update game state
    await ctx.db.patch(args.roomId, {
      gameState: args.newState,
      lastActivity: Date.now(),
    });

    // Check if game is finished (winner or draw)
    if (args.newState.winner || args.newState.isDraw) {
      await ctx.db.patch(args.roomId, {
        status: "finished",
      });
    }
  },
});

// End/reset game back to waiting (host only)
export const reset = mutation({
  args: {
    roomId: v.id("rooms"),
    guestId: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.hostGuestId !== args.guestId) {
      throw new Error("Only the host can reset the game");
    }

    await ctx.db.patch(args.roomId, {
      status: "waiting",
      gameState: undefined,
      lastActivity: Date.now(),
    });
  },
});

// Get current game state
export const getState = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return null;
    }

    return {
      status: room.status,
      gameState: room.gameState,
      gameType: room.gameType,
    };
  },
});
