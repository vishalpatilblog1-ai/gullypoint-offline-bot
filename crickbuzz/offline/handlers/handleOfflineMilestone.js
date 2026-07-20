// cricbuzz/offline/handlers/handleOfflineMilestone.js

import { formatMilestoneInfo } from "../templates/premium-template-offline.js";
import { postTweet_console, postTweet_web } from "../../../twitter/twitter.js";
// import { createLogger } from "../../../utils/logger.js";
// import { tweetNewsWithImage } from "../../tweetNewsWithImage.js";
import { generateCardImage } from "../../../canvas/imageRenderer.js";
import { CREX_BASE_IMAGE_TEMPLATE } from "../utils/config.js";
import { tweetNewsWithImage } from "../../../twitter/tweetNewsWithImage.js";

// const log = createLogger("prod");

export async function handleOfflineMilestone({
  milestoneEvent,
  currentSnapshot,
  useWebTweet,
}) {
  const eventBallNbr = milestoneEvent.eventBallNbr ?? currentSnapshot.ballNbr;

  const alreadyDetected =
    globalThis.OFFLINE_LAST_EVENT_BALL?.MILESTONE === eventBallNbr;

  if (alreadyDetected) {
    console.log(
      `⏩ Duplicate MILESTONE event on ball ${eventBallNbr} — skipping`,
    );
    return;
  }

  console.log("🏏 MILESTONE DETECTED");

  if (
    !milestoneEvent.batterName ||
    milestoneEvent.batterRuns == null ||
    milestoneEvent.batterBalls == null
  ) {
    console.warn("⚠ Skipping milestone tweet due to incomplete batter data", {
      batterName: milestoneEvent.batterName,
      batterRuns: milestoneEvent.batterRuns,
      batterBalls: milestoneEvent.batterBalls,
    });

    return;
  }

  const milestoneText = formatMilestoneInfo({
    batterName: milestoneEvent.batterName,
    batterRuns: milestoneEvent.batterRuns,
    batterBalls: milestoneEvent.batterBalls,
    battingTeam: milestoneEvent.battingTeam,
    score: milestoneEvent.score,
    wickets: milestoneEvent.wickets,
    overs: milestoneEvent.overs,
  });

  console.log("milestoneText:", milestoneText);

  const card = buildOfflineMilestoneCard(milestoneEvent);

  console.log("card::", card);

  let generatedPath;

  try {
    generatedPath = await generateCardImage(CREX_BASE_IMAGE_TEMPLATE, card);
  } catch (err) {
    console.error("❌ Card generation failed:", err);
  }

  try {
    if (useWebTweet) {
      let resp;
      if (generatedPath) {
        resp = await tweetNewsWithImage(milestoneText, generatedPath);
      } else {
        resp = await postTweet_web(milestoneText);
      }
      console.log("🌐 WEB Tweet Response:", resp);
    } else {
      await postTweet_console(milestoneText);
    }

    // Mark milestone only after successful tweet
    globalThis.OFFLINE_LAST_EVENT_BALL.MILESTONE = eventBallNbr;
  } catch (err) {
    log("❌ Milestone tweet failed:");
    console.error(err);
  }
}

function buildOfflineMilestoneCard(milestoneEvent) {
  let headline = "MILESTONE";

  switch (milestoneEvent.type) {
    case "FIFTY":
      headline = "FIFTY";
      break;

    case "HUNDRED":
      headline = "CENTURY";
      break;
  }

  return {
    category: `LIVE - ${milestoneEvent.team1Short} v ${milestoneEvent.team2Short}`,
    headline,
    subline: `${milestoneEvent.batterName} | ${milestoneEvent.batterRuns}* (${milestoneEvent.batterBalls})`,
  };
}
