import { tweetNewsWithImage } from "../../twitter/tweetNewsWithImage.js";
import { postTweet_console, postTweet_web } from "../../twitter/twitter.js";
import { formatMatchResultInfo } from "../templates/premium-template-offline.js";

import { CREX_BASE_IMAGE_TEMPLATE } from "../utils/config.js";

// const log = createLogger("prod");

export async function handleOfflineMatchResult({
  matchResultEvent,
  useWebTweet,
}) {
  if (
    !matchResultEvent?.status ||
    !matchResultEvent?.innings1 ||
    !matchResultEvent?.innings2
  ) {
    console.warn("⚠ Skipping match result tweet due to incomplete data");
    return;
  }

  console.log("🏆 MATCH RESULT DETECTED");

  const matchResultText = formatMatchResultInfo(matchResultEvent);

  const card = buildOfflineMatchResultCard(matchResultEvent);

  console.log("card:", card);

  let generatedPath;

  try {
    generatedPath = await generateCardImage(CREX_BASE_IMAGE_TEMPLATE, card);
  } catch (err) {
    console.error("❌ Card generation failed:", err);
  }

  try {
    let resp;

    if (useWebTweet) {
      if (generatedPath) {
        resp = await tweetNewsWithImage(matchResultText, generatedPath);
      } else {
        resp = await postTweet_web(matchResultText);
      }

      console.log("🌐 WEB Tweet Response:", resp);
    } else {
      await postTweet_console(matchResultText);
    }
  } catch (err) {
    log("❌ Match result tweet failed:");
    console.error(err);
  }
}

function buildOfflineMatchResultCard(matchResultEvent) {
  return {
    category: `LIVE - ${matchResultEvent.innings1.team} v ${matchResultEvent.innings2.team}`,
    headline: matchResultEvent.status.toUpperCase(),
  };
}
