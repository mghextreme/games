import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// List all players in a room
export const listByRoom = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Get the room to identify the host
    const room = await ctx.db.get(args.roomId);

    return players.map((player) => ({
      ...player,
      isHost: room?.hostGuestId === player.guestId,
    }));
  },
});

// Get a player by guest ID
export const getByGuestId = query({
  args: {
    guestId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_guest", (q) => q.eq("guestId", args.guestId))
      .first();
  },
});

// Join a room
export const join = mutation({
  args: {
    roomId: v.id("rooms"),
    guestId: v.string(),
    displayName: v.string(),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Check room status
    if (room.status !== "waiting") {
      throw new Error("Cannot join a game in progress");
    }

    // Check password if required
    if (room.password && room.password !== args.password) {
      throw new Error("Incorrect password");
    }

    // Check if guest is already in another room
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_guest", (q) => q.eq("guestId", args.guestId))
      .first();

    if (existingPlayer) {
      if (existingPlayer.roomId === args.roomId) {
        // Already in this room, update connection status
        await ctx.db.patch(existingPlayer._id, {
          isConnected: true,
          lastSeen: Date.now(),
          displayName: args.displayName,
        });
        return existingPlayer._id;
      }
      throw new Error("You are already in another room");
    }

    // Check if guest hosts another room
    const hostedRoom = await ctx.db
      .query("rooms")
      .withIndex("by_host", (q) => q.eq("hostGuestId", args.guestId))
      .first();

    if (hostedRoom && hostedRoom._id !== args.roomId) {
      throw new Error("You are already hosting another room");
    }

    // Check max players
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    if (players.length >= room.maxPlayers) {
      throw new Error("Room is full");
    }

    // Validate display name
    if (args.displayName.trim().length === 0 || args.displayName.length > 50) {
      throw new Error("Display name must be 1-50 characters");
    }

    // Add player to room
    const playerId = await ctx.db.insert("players", {
      roomId: args.roomId,
      guestId: args.guestId,
      displayName: args.displayName.trim(),
      isConnected: true,
      lastSeen: Date.now(),
    });

    // Update room activity
    await ctx.db.patch(args.roomId, {
      lastActivity: Date.now(),
    });

    return playerId;
  },
});

// Leave a room
export const leave = mutation({
  args: {
    roomId: v.id("rooms"),
    guestId: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Find the player
    const player = await ctx.db
      .query("players")
      .withIndex("by_guest", (q) => q.eq("guestId", args.guestId))
      .first();

    if (!player || player.roomId !== args.roomId) {
      throw new Error("You are not in this room");
    }

    // If host leaves, delete the room and all players
    if (room.hostGuestId === args.guestId) {
      const allPlayers = await ctx.db
        .query("players")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
        .collect();

      for (const p of allPlayers) {
        await ctx.db.delete(p._id);
      }

      await ctx.db.delete(args.roomId);
      return { roomDeleted: true };
    }

    // Otherwise just remove the player
    await ctx.db.delete(player._id);

    // Update room activity
    await ctx.db.patch(args.roomId, {
      lastActivity: Date.now(),
    });

    return { roomDeleted: false };
  },
});

// Kick a player (host only)
export const kick = mutation({
  args: {
    roomId: v.id("rooms"),
    hostGuestId: v.string(),
    playerGuestId: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.hostGuestId !== args.hostGuestId) {
      throw new Error("Only the host can kick players");
    }

    if (args.hostGuestId === args.playerGuestId) {
      throw new Error("Cannot kick yourself");
    }

    // Find the player to kick
    const player = await ctx.db
      .query("players")
      .withIndex("by_guest", (q) => q.eq("guestId", args.playerGuestId))
      .first();

    if (!player || player.roomId !== args.roomId) {
      throw new Error("Player not in this room");
    }

    await ctx.db.delete(player._id);

    // Update room activity
    await ctx.db.patch(args.roomId, {
      lastActivity: Date.now(),
    });
  },
});

// Update player connection status (for heartbeat)
export const updateConnection = mutation({
  args: {
    guestId: v.string(),
    isConnected: v.boolean(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_guest", (q) => q.eq("guestId", args.guestId))
      .first();

    if (player) {
      await ctx.db.patch(player._id, {
        isConnected: args.isConnected,
        lastSeen: Date.now(),
      });
    }
  },
});

// Update display name
export const updateDisplayName = mutation({
  args: {
    guestId: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.displayName.trim().length === 0 || args.displayName.length > 50) {
      throw new Error("Display name must be 1-50 characters");
    }

    const player = await ctx.db
      .query("players")
      .withIndex("by_guest", (q) => q.eq("guestId", args.guestId))
      .first();

    if (player) {
      await ctx.db.patch(player._id, {
        displayName: args.displayName.trim(),
      });
    }

    // Also update host display name if this guest is a host
    const hostedRoom = await ctx.db
      .query("rooms")
      .withIndex("by_host", (q) => q.eq("hostGuestId", args.guestId))
      .first();

    if (hostedRoom) {
      await ctx.db.patch(hostedRoom._id, {
        hostDisplayName: args.displayName.trim(),
      });
    }
  },
});
