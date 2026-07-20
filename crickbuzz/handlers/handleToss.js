import { postTweet_console, postTweet_web } from "../../twitter/twitter.js";
import { createTossTweet } from "../templates/premium-template.js";

export async function handleToss({ tossEvent, useWebTweet }) {
  if (globalThis.OFFLINE_TOSS_TWEETED) {
    console.log("⏩ Toss already tweeted in this process — skipping");
    return;
  }

  console.log("🪙 TOSS DETECTED");
  console.log(tossEvent);

  const tossTweet = createTossTweet(tossEvent);

  console.log("tossTweet:", tossTweet);

  try {
    if (useWebTweet) {
      const resp = await postTweet_web(tossTweet);
      console.log("🌐 WEB Tweet Response:", resp);
    } else {
      await postTweet_console(tossTweet);
    }

    globalThis.OFFLINE_TOSS_TWEETED = true;
  } catch (err) {
    log("❌ Toss tweet failed:");
    console.error(err);
  }
}
