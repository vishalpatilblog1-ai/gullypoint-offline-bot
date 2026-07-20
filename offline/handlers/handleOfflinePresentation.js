// cricbuzz/offline/handlers/handleOfflinePresentation.js

import { postTweet_console, postTweet_web } from "../../../twitter.js";
import { createLogger } from "../../../utils/logger.js";

const log = createLogger("prod");

export async function handleOfflinePresentation({
  presentationEvent,
  summary,
  useWebTweet,
}) {
  if (!presentationEvent) {
    return;
  }

  const presentationTweet = buildPresentationTweet(presentationEvent, summary);

  try {
    if (useWebTweet) {
      const resp = await postTweet_web(presentationTweet);
      console.log("🌐 WEB Tweet Response:", resp);
    } else {
      await postTweet_console(presentationTweet);
    }
  } catch (err) {
    log("❌ Presentation tweet failed:");
    console.error(err);
  }
}

function buildPresentationTweet(event, summary) {
  switch (event.type) {
    case "PLAYER_OF_MATCH":
      return `🗣️ ${event.player}:\n\n"${summary}"`;

    case "PLAYER_OF_SERIES":
      return `🗣️ ${event.player}:\n\n"${summary}"`;

    case "CAPTAIN":
      return `🗣️ ${event.player}:\n\n"${summary}"`;

    default:
      return summary;
  }
}

function stripHtml(text = "") {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?b>/gi, "")
    .replace(/<\/?i>/gi, "")
    .trim();
}
