import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run cleanup every hour to remove inactive rooms
crons.interval(
  "clean up inactive rooms",
  { minutes: 60 }, // Run every hour
  internal.rooms.cleanupInactiveRooms,
);

export default crons;
