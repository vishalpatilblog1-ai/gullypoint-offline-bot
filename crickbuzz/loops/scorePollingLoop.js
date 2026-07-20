import dotenv from "dotenv";
dotenv.config();

import { handleWicket } from "../handlers/handleWicket.js";

import { displayMatchInfo } from "../templates/premium-template.js";

import {
  buildSnapshot,
  clone,
  isSameSnapshot,
  resetState,
} from "../utils/utils.js";

import { getCommentary, getLiveScore } from "../cricbuzzApi.js";
import { detectMilestone } from "../detectors/detectMilestone.js";
import { detectMatchResult } from "../detectors/detectMatchResult.js";
import { processPreMatchEvents } from "../detectors/detectPresentation.js";
import { detectWicket } from "../detectors/detectWicket.js";
import { handleMatchResult } from "../handlers/handleMatchResult.js";
import { handleMilestone } from "../handlers/handleMilestone.js";
import { handlePresentation } from "../handlers/handlePresentation.js";
import { summarizePresentationInterview } from "../ai/summarizePresentationInterview.js";

const POLL_INTERVAL = 6000;
const PRESENTATION_EVENT_DELAY = 8000;
const PRESENTATION_WINDOW_DURATION = 30 * 60 * 1000;

const USE_WEB_TWEET = process.env.USE_WEB_TWEET === "true";
const isGP = process.env.PUBLISH_SCORE_POLLING_ON_GP === "true";
const isCREX = process.env.PUBLISH_SCORE_POLLING_ON_CREX === "true";

if (isCREX) {
  console.log("======================================================");
  console.log("Tweets are going to publish in CREX");
  console.log("======================================================");
}

if (isGP) {
  console.log("======================================================");
  console.log("Tweets are going to publish in GP");
  console.log("======================================================");
}

console.log("USE_WEB_TWEET:::", USE_WEB_TWEET);

const wait = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function isPresentationWindowActive() {
  return Boolean(
    globalThis.OFFLINE_PRESENTATION_WINDOW_END &&
    Date.now() < globalThis.OFFLINE_PRESENTATION_WINDOW_END,
  );
}

function startPresentationWindow() {
  if (globalThis.OFFLINE_PRESENTATION_WINDOW_END) {
    return;
  }

  globalThis.OFFLINE_PRESENTATION_WINDOW_END =
    Date.now() + PRESENTATION_WINDOW_DURATION;

  console.log("🏁 Starting 10-minute presentation window.");
}

function hasPresentationWindowExpired() {
  return Boolean(
    globalThis.OFFLINE_PRESENTATION_WINDOW_END &&
    Date.now() >= globalThis.OFFLINE_PRESENTATION_WINDOW_END,
  );
}

function updatePreviousSnapshot(currentSnapshot) {
  globalThis.OFFLINE_PREV_SNAPSHOT = clone(currentSnapshot);
  globalThis.OFFLINE_PREV_INNINGS_ID = currentSnapshot.inningsId;
  globalThis.OFFLINE_LAST_BALL = currentSnapshot.ballNbr;
}

async function processPresentationEvents(matchId) {
  const commentaryResponse = await getCommentary(matchId);

  const presentationEvents = detectPresentation(commentaryResponse) ?? [];

  const sortedEvents = [...presentationEvents].sort(
    (a, b) => Number(a.timestamp ?? 0) - Number(b.timestamp ?? 0),
  );

  for (const presentationEvent of sortedEvents) {
    const eventTimestamp = Number(presentationEvent.timestamp ?? 0);
    const lastTimestamp = Number(globalThis.OFFLINE_LAST_PRESENTATION_TS ?? 0);

    if (!eventTimestamp || eventTimestamp <= lastTimestamp) {
      continue;
    }

    const summary = await summarizePresentationInterview({
      type: presentationEvent.type,
      player: presentationEvent.player,
      role: presentationEvent.role,
      interview: presentationEvent.quote,
    });

    await handlePresentation({
      presentationEvent,
      summary,
      useWebTweet: USE_WEB_TWEET,
    });

    globalThis.OFFLINE_LAST_PRESENTATION_TS = eventTimestamp;

    await wait(PRESENTATION_EVENT_DELAY);
  }
}

async function processLiveMatchEvents({
  previousSnapshot,
  currentSnapshot,
  response,
}) {
  const wicketEvent = detectWicket(previousSnapshot, currentSnapshot);
  console.log("wicketEvent::", wicketEvent);

  if (wicketEvent) {
    await handleWicket({
      wicketEvent,
      currentSnapshot,
      response,
      useWebTweet: USE_WEB_TWEET,
    });
  } else {
    const milestoneEvent = detectMilestone(previousSnapshot, currentSnapshot);

    console.log("milestoneEvent:::", milestoneEvent);

    if (milestoneEvent) {
      await handleMilestone({
        milestoneEvent,
        currentSnapshot,
        useWebTweet: USE_WEB_TWEET,
      });
    }
  }

  const matchResultEvent = detectMatchResult(
    previousSnapshot,
    currentSnapshot,
    response,
  );

  console.log("matchResultEvent:::", matchResultEvent);

  if (!matchResultEvent) {
    return;
  }

  await handleMatchResult({
    matchResultEvent,
    useWebTweet: USE_WEB_TWEET,
  });

  startPresentationWindow();
}

export async function scorePollingLoop(MATCH_ID, MATCH_NAME = "") {
  console.log(`🔄 Offline Polling: ${MATCH_NAME || MATCH_ID}`);

  if (
    !globalThis.OFFLINE_PREV_MATCH_ID ||
    globalThis.OFFLINE_PREV_MATCH_ID !== MATCH_ID
  ) {
    resetState(MATCH_ID);
  }

  while (true) {
    try {
      const response = await getLiveScore(MATCH_ID);
      const currentSnapshot = buildSnapshot(response);

      // Handle pre-match events (Toss, Playing XI)
      if (!currentSnapshot) {
        await processPreMatchEvents(MATCH_ID);

        console.log("⏳ Waiting for innings data...");
        await wait(POLL_INTERVAL);
        continue;
      }

      // Pre-match data is no longer needed once innings starts
      globalThis.OFFLINE_COMMENTARY_RESPONSE = null;

      if (!globalThis.OFFLINE_PREV_SNAPSHOT) {
        displayMatchInfo(response);
        updatePreviousSnapshot(currentSnapshot);

        await wait(POLL_INTERVAL);
        continue;
      }

      const previousSnapshot = globalThis.OFFLINE_PREV_SNAPSHOT;

      if (previousSnapshot.inningsId !== currentSnapshot.inningsId) {
        console.log(
          `🆕 New innings detected: ${previousSnapshot.inningsId} → ${currentSnapshot.inningsId}`,
        );

        globalThis.OFFLINE_LAST_EVENT_BALL = {};
        updatePreviousSnapshot(currentSnapshot);

        await wait(POLL_INTERVAL);
        continue;
      }

      const presentationActive = isPresentationWindowActive();

      if (
        !presentationActive &&
        isSameSnapshot(previousSnapshot, currentSnapshot)
      ) {
        await wait(POLL_INTERVAL);
        continue;
      }

      if (presentationActive) {
        await processPresentationEvents(MATCH_ID);
      } else {
        console.log({
          ballNbr: currentSnapshot.ballNbr,
          event: currentSnapshot.event,
          commentary: currentSnapshot.commentary,
          lastWicket: currentSnapshot.lastWicket,
          matchState: currentSnapshot.matchState,
          status: currentSnapshot.status,
          striker: `${currentSnapshot.striker.name} ${currentSnapshot.striker.runs} (${currentSnapshot.striker.balls})`,
          nonStriker: `${currentSnapshot.nonStriker.name} ${currentSnapshot.nonStriker.runs} (${currentSnapshot.nonStriker.balls})`,
        });

        await processLiveMatchEvents({
          previousSnapshot,
          currentSnapshot,
          response,
        });

        if (isPresentationWindowActive()) {
          await processPresentationEvents(MATCH_ID);
        }
      }

      updatePreviousSnapshot(currentSnapshot);
    } catch (error) {
      console.error("❌ Error in scorePollingLoopOffline:", error);
      log(error?.message ?? String(error));
    }

    if (hasPresentationWindowExpired()) {
      console.log("✅ Presentation window expired. Exiting polling.");

      globalThis.OFFLINE_PRESENTATION_WINDOW_END = null;

      await wait(100);
      process.exit(0);
    }

    await wait(POLL_INTERVAL);
  }
}
