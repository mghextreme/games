import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// List all rooms (optionally filtered by search query)
export const list = query({
  args: {
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let rooms = await ctx.db
      .query("rooms")
      .filter((q) => q.neq(q.field("status"), "finished"))
      .order("desc")
      .collect();

    // Filter by search query if provided
    if (args.searchQuery && args.searchQuery.trim() !== "") {
      const search = args.searchQuery.toLowerCase();
      rooms = rooms.filter(
        (room) =>
          room.name.toLowerCase().includes(search) ||
          room.hostDisplayName.toLowerCase().includes(search)
      );
    }

    // Get player counts and guestIds for each room
    const roomsWithCounts = await Promise.all(
      rooms.map(async (room) => {
        const players = await ctx.db
          .query("players")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .collect();
        return {
          ...room,
          playerCount: players.length,
          playerGuestIds: players.map((p) => p.guestId),
          hasPassword: !!room.password,
        };
      })
    );

    return roomsWithCounts;
  },
});

// Get a single room by ID
export const get = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();

    return {
      ...room,
      playerCount: players.length,
      hasPassword: !!room.password,
    };
  },
});

// Get room by guest's current room (check if guest is in any room)
export const getByGuestId = query({
  args: {
    guestId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if guest is a player in any room
    const player = await ctx.db
      .query("players")
      .withIndex("by_guest", (q) => q.eq("guestId", args.guestId))
      .first();

    if (player) {
      return await ctx.db.get(player.roomId);
    }

    // Check if guest is a host
    const hostedRoom = await ctx.db
      .query("rooms")
      .withIndex("by_host", (q) => q.eq("hostGuestId", args.guestId))
      .first();

    return hostedRoom || null;
  },
});

// Create a new room
export const create = mutation({
  args: {
    name: v.string(),
    password: v.optional(v.string()),
    guestId: v.string(),
    displayName: v.string(),
    gameType: v.string(),
    maxPlayers: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Validate room name
    if (args.name.trim().length === 0 || args.name.length > 50) {
      throw new Error("Room name must be 1-50 characters");
    }

    // Check if guest is already in a room
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_guest", (q) => q.eq("guestId", args.guestId))
      .first();

    if (existingPlayer) {
      throw new Error("You are already in a room");
    }

    // Check if guest already hosts a room
    const existingRoom = await ctx.db
      .query("rooms")
      .withIndex("by_host", (q) => q.eq("hostGuestId", args.guestId))
      .first();

    if (existingRoom) {
      throw new Error("You already have an active room");
    }

    // Create the room
    const roomId = await ctx.db.insert("rooms", {
      name: args.name.trim(),
      password: args.password || undefined,
      hostGuestId: args.guestId,
      hostDisplayName: args.displayName,
      gameType: args.gameType,
      status: "waiting",
      maxPlayers: args.maxPlayers || 10,
      lastActivity: Date.now(),
    });

    // Add host as a player
    await ctx.db.insert("players", {
      roomId,
      guestId: args.guestId,
      displayName: args.displayName,
      isConnected: true,
      lastSeen: Date.now(),
    });

    return roomId;
  },
});

// Update room settings (host only)
export const update = mutation({
  args: {
    roomId: v.id("rooms"),
    guestId: v.string(),
    name: v.optional(v.string()),
    password: v.optional(v.string()),
    gameType: v.optional(v.string()),
    maxPlayers: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.hostGuestId !== args.guestId) {
      throw new Error("Only the host can update room settings");
    }

    if (room.status !== "waiting") {
      throw new Error("Cannot update room while game is in progress");
    }

    const updates: Partial<typeof room> = {
      lastActivity: Date.now(),
    };

    if (args.name !== undefined) {
      if (args.name.trim().length === 0 || args.name.length > 50) {
        throw new Error("Room name must be 1-50 characters");
      }
      updates.name = args.name.trim();
    }

    if (args.password !== undefined) {
      updates.password = args.password || undefined;
    }

    if (args.gameType !== undefined) {
      updates.gameType = args.gameType;
    }

    if (args.maxPlayers !== undefined) {
      if (args.maxPlayers < 2 || args.maxPlayers > 20) {
        throw new Error("Max players must be between 2 and 20");
      }
      updates.maxPlayers = args.maxPlayers;
    }

    await ctx.db.patch(args.roomId, updates);
  },
});

// Delete a room (host only)
export const remove = mutation({
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
      throw new Error("Only the host can delete the room");
    }

    // Delete all players in the room
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    for (const player of players) {
      await ctx.db.delete(player._id);
    }

    // Delete the room
    await ctx.db.delete(args.roomId);
  },
});

// Verify room password
export const verifyPassword = query({
  args: {
    roomId: v.id("rooms"),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return false;
    }
    return room.password === args.password;
  },
});
