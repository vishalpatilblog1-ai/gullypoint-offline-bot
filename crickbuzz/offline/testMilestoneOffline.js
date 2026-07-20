// cricbuzz/offline/testMilestoneOffline.js

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSnapshot, clone } from "./utils/offline-utils.js";
import { detectOfflineMilestone } from "./detectors/inningsDetectorOffline.js";
import { handleOfflineMilestone } from "./handlers/handleOfflineMilestone.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const response = JSON.parse(
  fs.readFileSync(path.join(__dirname, "milestone-response.json"), "utf8"),
);

const currentSnapshot = buildSnapshot(response);

if (!currentSnapshot) {
  throw new Error("Unable to build current snapshot from mock response.");
}

/*
 * We only have the milestone response, so create a synthetic previous snapshot.
 * It represents the poll immediately before the milestone.
 */
const previousSnapshot = clone(currentSnapshot);

previousSnapshot.event = "";
previousSnapshot.commentary = "";
previousSnapshot.ballNbr = Number(currentSnapshot.ballNbr) - 1;

// Adjust the milestone batter to 49/99 in the previous snapshot.
const milestoneEvents = String(currentSnapshot.event ?? "")
  .split(",")
  .map((event) => event.trim().toUpperCase());

if (milestoneEvents.includes("FIFTY")) {
  if (previousSnapshot.striker?.runs >= 50) {
    previousSnapshot.striker.runs = 49;
  }

  if (previousSnapshot.nonStriker?.runs >= 50) {
    previousSnapshot.nonStriker.runs = 49;
  }
}

if (milestoneEvents.includes("HUNDRED")) {
  if (previousSnapshot.striker?.runs >= 100) {
    previousSnapshot.striker.runs = 99;
  }

  if (previousSnapshot.nonStriker?.runs >= 100) {
    previousSnapshot.nonStriker.runs = 99;
  }
}

console.log("\nPREVIOUS SNAPSHOT");
console.dir(previousSnapshot, { depth: null });

console.log("\nCURRENT SNAPSHOT");
console.dir(currentSnapshot, { depth: null });

const milestoneEvent = detectOfflineMilestone(
  previousSnapshot,
  currentSnapshot,
);

console.log("\nMILESTONE EVENT");
console.dir(milestoneEvent, { depth: null });

if (!milestoneEvent) {
  throw new Error("Milestone was not detected.");
}

/*
 * false means console mode.
 * It should generate the tweet but not post it through the browser.
 */
globalThis.OFFLINE_LAST_EVENT_BALL = {};
await handleOfflineMilestone({
  milestoneEvent,
  currentSnapshot,
  useWebTweet: false,
});

console.log("\n✅ Milestone test completed.");
