// twitter.js
import { TwitterApi } from "twitter-api-v2";
import dotenv from "dotenv";

dotenv.config();

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

export async function postTweet_console(text) {
  if (typeof text !== "string") {
    console.log("❌ Invalid tweet (not a string)");
    console.log("INVALID TWEET:", text);
    return;
  }

  if (!text.trim()) {
    console.log("⚠ Empty tweet skipped (console mode)");
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

export async function postTweet_web(text, replyToId = null) {
  console.log("text>>>", text);

  // Validate input
  if (typeof text !== "string") {
    console.log("❌ Invalid tweet (not a string)");
    console.log("INVALID TWEET:", text);
    return null;
  }

  const cleanText = text.trim();

  if (!cleanText) {
    console.log("⚠ Empty tweet skipped");
    return null;
  }

  // Reject tweets containing null/undefined placeholders
  if (/\b(undefined|null)\b/i.test(cleanText)) {
    console.log("❌ Invalid tweet (contains undefined/null)");
    console.log("INVALID TWEET:", cleanText);
    return null;
  }

  try {
    const payload = {
      text: cleanText,
    };

    if (replyToId) {
      payload.reply = {
        in_reply_to_tweet_id: replyToId,
      };
    }

    const response = await twitterClient.v2.tweet(payload);

    console.log("📤 Tweet POSTED via API:");
    console.log(JSON.stringify(response.data, null, 2));

    return {
      status: "api_ok",
      id: response.data.id,
      text: response.data.text,
      raw: response.data,
    };
  } catch (err) {
    console.error("❌ Error posting tweet (API):");

    if (err.data) {
      console.error("Twitter API Error:");
      console.error("Message:", err.message);
      console.error("Code:", err.code);
      console.error("Data:", err.data);
      console.error("Response:", err.response);
    }

    console.error(err);
    return null;
  }
}
