import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rooms: defineTable({
    name: v.string(),
    password: v.optional(v.string()),
    hostGuestId: v.string(),
    hostDisplayName: v.string(),
    gameType: v.string(),
    status: v.union(
      v.literal("waiting"),
      v.literal("playing"),
      v.literal("finished")
    ),
    gameState: v.optional(v.any()),
    maxPlayers: v.number(),
    lastActivity: v.number(),
  })
    .index("by_host", ["hostGuestId"])
    .index("by_status", ["status"])
    .index("by_last_activity", ["lastActivity"]),

  players: defineTable({
    roomId: v.id("rooms"),
    guestId: v.string(),
    displayName: v.string(),
    isConnected: v.boolean(),
    lastSeen: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_guest", ["guestId"]),
});
