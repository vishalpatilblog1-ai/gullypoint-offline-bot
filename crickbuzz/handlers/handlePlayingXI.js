import { createPlayingXITweet } from "../templates/premium-template.js";
import { extractPlayingXI } from "./playingXIParser.js";
import { getCommentary, getCommentaryAuto } from "../cricbuzzApi.js";
import { postTweet_console, postTweet_web } from "../../twitter/twitter.js";

// export async function handlePlayingXI({ matchId, useWebTweet }) {
//   if (globalThis.OFFLINE_PLAYING_XI_TWEETED) {
//     return;
//   }

//   const response = await getCommentaryAuto(matchId);

//   const playingXI = extractPlayingXI(response);

//   if (!playingXI) {
//     console.log("⚠ Playing XI not found");
//     return;
//   }

//   globalThis.OFFLINE_PLAYING_XI_TWEETED = true;

//   const tweet = createPlayingXITweet(playingXI);

//   if (useWebTweet) {
//     await postTweet_web(tweet);
//   } else {
//     await postTweet_console(tweet);
//   }
// }

export async function handlePlayingXI({ commentary, useWebTweet }) {
  if (globalThis.OFFLINE_PLAYING_XI_TWEETED) {
    return;
  }

  const playingXI = extractPlayingXI(commentary);

  if (!playingXI) {
    console.log("⚠ Playing XI not found");
    return;
  }

  const tweet = createPlayingXITweet(playingXI);

  let response;

  if (useWebTweet) {
    response = await postTweet_web(tweet);
  } else {
    response = await postTweet_console(tweet);
  }

  if (!response) {
    return;
  }

  globalThis.OFFLINE_PLAYING_XI_TWEETED = true;

  return response;
}
