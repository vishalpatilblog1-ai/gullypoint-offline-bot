// twitter.js
import { TwitterApi } from "twitter-api-v2";
import dotenv from "dotenv";
// import { createLogger } from "./utils/logger.js";

dotenv.config();
// const log = createLogger("prod");

// const twitterClient = new TwitterApi({
//   appKey: process.env.X_API_KEY,
//   appSecret: process.env.X_API_SECRET,
//   accessToken: process.env.X_ACCESS_TOKEN,
//   accessSecret: process.env.X_ACCESS_SECRET,
// });

let twitterClient;

const isGP = process.env.PUBLISH_SCORE_POLLING_ON_GP === "true";
const isCREX = process.env.PUBLISH_SCORE_POLLING_ON_CREX === "true";

if (isCREX) {
  twitterClient = new TwitterApi({
    appKey: process.env.X_API_KEY_CREX,
    appSecret: process.env.X_API_SECRET_CREX,
    accessToken: process.env.X_ACCESS_TOKEN_CREX,
    accessSecret: process.env.X_ACCESS_SECRET_CREX,
  });
}

if (isGP) {
  twitterClient = new TwitterApi({
    appKey: process.env.X_API_KEY_GP,
    appSecret: process.env.X_API_SECRET_GP,
    accessToken: process.env.X_ACCESS_TOKEN_GP,
    accessSecret: process.env.X_ACCESS_SECRET_GP,
  });
}

console.log(
  "process.env.PUBLISH_SCORE_POLLING_ON_GP::",
  process.env.PUBLISH_SCORE_POLLING_ON_GP,
);
console.log("isGP::", isGP);
console.log("isCREX::", isCREX);

export async function postTweet_console_bbc(payload) {
  const text = typeof payload === "string" ? payload : payload?.text;

  if (typeof text !== "string") {
    console.log("❌ Invalid tweet (not a string)");
    console.log("INVALID TWEET:", payload);
    return null;
  }

  if (!text.trim()) {
    console.log("⚠ Empty tweet skipped (console mode)");
    return null;
  }

  console.log(`\n\n${text}\n\n`);

  // 👇 THIS IS THE IMPORTANT PART
  return {
    id: `console_${Date.now()}`,
  };
}

export async function postTweet_console(text) {
  if (typeof text !== "string") {
    log("❌ Invalid tweet (not a string)");
    console.log("INVALID TWEET:", text);
    return;
  }

  if (!text.trim()) {
    log("⚠ Empty tweet skipped (console mode)");
    return;
  }

  // console.log("=============================");
  // console.log("🟦 AI PROD TWEET (CONSOLE MODE):");
  console.log(`
  
  
  
  
${text}
  
  
  
  
  `);
  // console.log("=============================");

  return { status: "console_ok", text };
}

export async function postTweet_web_bcci(payload) {
  try {
    const text = typeof payload === "string" ? payload : payload?.text;
    const media_ids = payload?.media_ids;

    if (typeof text !== "string") {
      log("❌ Invalid tweet (not a string)");
      console.log("INVALID TWEET:", payload);
      return null;
    }

    if (!text.trim()) {
      log("⚠ Empty tweet skipped");
      return null;
    }

    const res = await twitterClient.v2.tweet({
      text,
      ...(media_ids?.length ? { media: { media_ids } } : {}),
    });

    log("📤 Tweet POSTED via API:");
    log(JSON.stringify(res.data, null, 2));

    return res.data;
  } catch (err) {
    log("❌ Error posting tweet (API):");
    console.error(err);
    return null;
  }
}

export async function postTweet_web(text, replyToId = null) {
  try {
    if (typeof text !== "string") {
      log("❌ Invalid tweet (not a string)");
      console.log("INVALID TWEET:", text);
      return null;
    }

    const cleanText = text.trim();

    if (!cleanText) {
      log("⚠ Empty tweet skipped");
      return null;
    }

    // Reject tweets containing undefined or null placeholders
    if (/\b(undefined|null)\b/i.test(cleanText)) {
      log("❌ Invalid tweet (contains undefined/null)");
      console.log("INVALID TWEET:", cleanText);
      return null;
    }

    const payload = {
      text: cleanText,
    };

    if (replyToId) {
      payload.reply = {
        in_reply_to_tweet_id: replyToId,
      };
    }

    const res = await twitterClient.v2.tweet(payload);

    console.log("📤 Tweet POSTED via API:");
    console.log(JSON.stringify(res.data, null, 2));

    return res.data;
  } catch (err) {
    console.error("❌ Error posting tweet (API):");
    console.error("❌ Twitter API Error:");
    console.error("Message:", err?.message);
    console.error("Code:", err?.code);
    console.error("Data:", err?.data);
    console.error("Response:", err?.response?.data);
    console.error(err);
    return null;
  }
}

// export async function postTweet_web(text, replyToId = null) {
//   try {
//     if (typeof text !== "string") {
//       log("❌ Invalid tweet (not a string)");
//       console.log("INVALID TWEET:", text);
//       return null;
//     }

//     const cleanText = text.trim();

//     if (!cleanText) {
//       log("⚠ Empty tweet skipped");
//       return null;
//     }

//     const payload = {
//       text: cleanText,
//     };

//     if (replyToId) {
//       payload.reply = {
//         in_reply_to_tweet_id: replyToId,
//       };
//     }

//     const res = await twitterClient.v2.tweet(payload);

//     console.log("📤 Tweet POSTED via API:");
//     console.log(JSON.stringify(res.data, null, 2));

//     return res.data;
//   } catch (err) {
//     console.error("❌ Error posting tweet (API):");
//     console.error("❌ Twitter API Error:");
//     console.error("Message:", err?.message);
//     console.error("Code:", err?.code);
//     console.error("Data:", err?.data);
//     console.error("Response:", err?.response?.data);
//     console.error(err);
//     return null;
//   }
// }
