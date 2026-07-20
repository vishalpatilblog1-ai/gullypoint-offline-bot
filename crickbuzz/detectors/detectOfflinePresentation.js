import dotenv from "dotenv";
dotenv.config();
const USE_WEB_TWEET = process.env.USE_WEB_TWEET === "true";
export function detectOfflinePresentation(response) {
  const commentary = response?.matchCommentary;

  if (!commentary) {
    return [];
  }

  const items = Object.values(commentary)
    .filter(
      (item) =>
        item?.commType === "commentary" && typeof item?.commText === "string",
    )
    .sort((a, b) => a.timestamp - b.timestamp); // Oldest → Newest

  const events = [];

  for (const item of items) {
    const text = item.commText;

    const match = text.match(
      /<b>(.*?)\s*\|\s*(Player of the Match|.*capt.*):<\/b>/i,
    );

    if (!match) {
      continue;
    }

    const player = match[1].trim();
    const role = match[2].trim();

    let type = "PRESENTATION";

    // if (/player of the match/i.test(role)) {
    //   type = "PLAYER_OF_MATCH";
    // } else if (/capt/i.test(role)) {
    //   type = "CAPTAIN";
    // }

    if (/player of the match/i.test(role)) {
      type = "PLAYER_OF_MATCH";
    } else if (/player of the series/i.test(role)) {
      type = "PLAYER_OF_SERIES";
    } else if (/capt/i.test(role)) {
      type = "CAPTAIN";
    }

    events.push({
      type,
      role,
      player,
      quote: text,
      timestamp: item.timestamp,
      inningsId: item.inningsId,
      teamName: item.teamName,
    });
  }

  return events;
}

export async function processPreMatchEvents(matchId) {
  if (!globalThis.OFFLINE_COMMENTARY_RESPONSE) {
    console.log("📥 Fetching commentary for pre-match metadata...");

    globalThis.OFFLINE_COMMENTARY_RESPONSE =
      await getCommentaryOffline(matchId);
  }

  const tossEvent = detectOfflineToss(globalThis.OFFLINE_COMMENTARY_RESPONSE);

  if (tossEvent?.state !== "Toss") {
    return;
  }

  await handleOfflineToss({
    tossEvent,
    useWebTweet: USE_WEB_TWEET,
  });

  if (!globalThis.OFFLINE_PLAYING_XI_TWEETED) {
    await handleOfflinePlayingXI({
      matchId: matchId,
      useWebTweet: USE_WEB_TWEET,
    });
  }
}
