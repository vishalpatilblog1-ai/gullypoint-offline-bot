// handlers/handleOfflinePlayingXI.js

import { createPlayingXITweet } from "../templates/premium-template-offline.js";
// import { postTweet_console, postTweet_web } from "../../../twitter.js";
import { extractPlayingXI } from "./playingXIParser.js";
import { getCommentaryOffline } from "../cricbuzzApiOffline.js";
import { postTweet_console, postTweet_web } from "../../twitter/twitter.js";

export async function handleOfflinePlayingXI({ matchId, useWebTweet }) {
  if (globalThis.OFFLINE_PLAYING_XI_TWEETED) {
    return;
  }

  const response = await getCommentaryOffline(matchId);

  const playingXI = extractPlayingXI(response);

  if (!playingXI) {
    console.log("⚠ Playing XI not found");
    return;
  }

  globalThis.OFFLINE_PLAYING_XI_TWEETED = true;

  const tweet = createPlayingXITweet(playingXI);

  if (useWebTweet) {
    await postTweet_web(tweet);
  } else {
    await postTweet_console(tweet);
  }
}
