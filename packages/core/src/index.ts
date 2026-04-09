/**
 * @agent-recall/core — shared business logic for AgentRecall.
 *
 * All types, palace operations, storage utilities, and helper functions
 * are re-exported from this barrel.
 */

// Types & constants
export {
  VERSION,
  SECTION_HEADERS,
  DEFAULT_PALACE_ROOMS,
  setRoot,
  getRoot,
  getLegacyRoot,
} from "./types.js";
export type {
  JournalEntry,
  ProjectInfo,
  SessionState,
  RoomMeta,
  PalaceIndex,
  GraphEdge,
  PalaceGraph,
  Importance,
  Confidence,
  WalkDepth,
} from "./types.js";

// Palace — rooms
export {
  createRoom,
  getRoomMeta,
  updateRoomMeta,
  listRooms,
  roomExists,
  ensurePalaceInitialized,
  recordAccess,
} from "./palace/rooms.js";

// Palace — graph
export {
  readGraph,
  writeGraph,
  addEdge,
  removeEdgesFor,
  getConnectionCount,
  getConnectedRooms,
} from "./palace/graph.js";

// Palace — fan-out
export { fanOut } from "./palace/fan-out.js";
export type { FanOutResult } from "./palace/fan-out.js";

// Palace — awareness
export {
  readAwareness,
  writeAwareness,
  readAwarenessState,
  writeAwarenessState,
  initAwareness,
  addInsight,
  detectCompoundInsights,
  renderAwareness,
} from "./palace/awareness.js";
export type {
  Insight,
  CompoundInsight,
  AwarenessState,
} from "./palace/awareness.js";

// Palace — salience
export {
  computeSalience,
  ARCHIVE_THRESHOLD,
  AUTO_ARCHIVE_THRESHOLD,
} from "./palace/salience.js";

// Palace — insights index
export {
  readInsightsIndex,
  writeInsightsIndex,
  addIndexedInsight,
  recallInsights,
} from "./palace/insights-index.js";
export type {
  IndexedInsight,
  InsightsIndex,
} from "./palace/insights-index.js";

// Palace — identity
export { readIdentity, writeIdentity } from "./palace/identity.js";

// Palace — index manager
export { readPalaceIndex, updatePalaceIndex } from "./palace/index-manager.js";

// Palace — obsidian
export {
  extractWikilinks,
  addBackReference,
  generateFrontmatter,
  roomReadmeContent,
} from "./palace/obsidian.js";

// Palace — log
export { appendToLog } from "./palace/log.js";

// Palace — consolidate
export { consolidateJournalToPalace } from "./palace/consolidate.js";
export type { ConsolidationResult } from "./palace/consolidate.js";

// Storage
export { journalDir, journalDirs, palaceDir, roomDir } from "./storage/paths.js";
export { ensureDir, todayISO, readJsonSafe, writeJsonAtomic } from "./storage/fs-utils.js";
export { detectProject, resolveProject, listAllProjects } from "./storage/project.js";

// Helpers
export {
  listJournalFiles,
  readJournalFile,
  extractTitle,
  extractMomentum,
  countLogEntries,
  updateIndex,
} from "./helpers/journal-files.js";
export { extractSection, appendToSection } from "./helpers/sections.js";

// Helpers — rollup
export { isoWeek, weekKey, groupByWeek, synthesizeWeek } from "./helpers/rollup.js";
