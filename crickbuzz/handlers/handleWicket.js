import { postTweet_console, postTweet_web } from "../../twitter/twitter.js";
import { CREX_BASE_IMAGE_TEMPLATE } from "../utils/config.js";
import { tweetNewsWithImage } from "../../twitter/tweetNewsWithImage.js";
import { buildMatchContext } from "../buildMatchContext.js";
import { isMatchComplete } from "../utils/utils.js";
import { formatWicketInfo } from "../templates/premium-template.js";
import { generateCardImage } from "../../canvas/imageRenderer.js";

export async function handleWicket({
  wicketEvent,
  currentSnapshot,
  response,
  useWebTweet,
}) {
  const eventBallNbr = wicketEvent.eventBallNbr ?? currentSnapshot.ballNbr;

  const alreadyDetected =
    globalThis.OFFLINE_LAST_EVENT_BALL?.WICKET === eventBallNbr;

  if (alreadyDetected) {
    console.log(`⏩ Duplicate WICKET event on ball ${eventBallNbr} — skipping`);
    return;
  }

  console.log("🚨 WICKET DETECTED");

  if (
    !wicketEvent.batterName ||
    wicketEvent.batterRuns == null ||
    wicketEvent.batterBalls == null
  ) {
    console.warn("⚠ Skipping wicket tweet due to incomplete batter data", {
      batterName: wicketEvent.batterName,
      batterRuns: wicketEvent.batterRuns,
      batterBalls: wicketEvent.batterBalls,
      lastWicket: wicketEvent.lastWicket,
    });

    return;
  }

  const wicketText = formatWicketInfo({
    batterName: wicketEvent.batterName,
    batterRuns: wicketEvent.batterRuns,
    batterBalls: wicketEvent.batterBalls,
    battingTeam: wicketEvent.battingTeam,
    score: wicketEvent.score,
    wickets: wicketEvent.wickets,
    overs: wicketEvent.overs,
    status: wicketEvent.status,
    isSecondInnings: wicketEvent.isSecondInnings,
  });

  const card = buildWicketCard(wicketEvent);

  console.log("card:", card);

  let generatedPath;

  try {
    generatedPath = await generateCardImage(CREX_BASE_IMAGE_TEMPLATE, card);
  } catch (err) {
    console.error("❌ Card generation failed:", err);
  }

  try {
    console.log("generatedPath:", generatedPath);
    if (useWebTweet) {
      let resp;
      if (generatedPath) {
        resp = await tweetNewsWithImage(wicketText, generatedPath);
      } else {
        resp = await postTweet_web(wicketText);
      }
      console.log("🌐 WEB Tweet Response:", resp);
    } else {
      await postTweet_console(wicketText);
    }

    globalThis.OFFLINE_LAST_EVENT_BALL.WICKET = eventBallNbr;
  } catch (err) {
    log("❌ Wicket tweet failed:");
    console.error(err);
    return;
  }

  try {
    const context = buildMatchContext({
      score: response,
      event: wicketEvent,
      isMatchComplete: isMatchComplete(currentSnapshot),
    });

    console.log(
      "✅ OFFLINE WICKET EVENT CONTEXT:",
      JSON.stringify(context, null, 2),
    );
  } catch (err) {
    console.error("❌ Failed to build wicket context:", err);
  }
}

function buildWicketCard(wicketEvent) {
  return {
    category: `LIVE - ${wicketEvent.team1Short} v ${wicketEvent.team2Short}`,
    headline: "WICKET",
    subline: `${wicketEvent.batterName} | ${wicketEvent.outDescription}`,
    player: wicketEvent.batterName,
  };
}
