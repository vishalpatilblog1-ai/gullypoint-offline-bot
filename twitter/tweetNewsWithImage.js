import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import fs from "fs";
import path from "path";
import { TwitterApi } from "twitter-api-v2";

// const client = new TwitterApi({
//   appKey: process.env.X_API_KEY,
//   appSecret: process.env.X_API_SECRET,
//   accessToken: process.env.X_ACCESS_TOKEN,
//   accessSecret: process.env.X_ACCESS_SECRET,
// });

const isGP = process.env.PUBLISH_SCORE_POLLING_ON_GP === "true";
const isCREX = process.env.PUBLISH_SCORE_POLLING_ON_CREX === "true";

let client;

if (isCREX) {
  client = new TwitterApi({
    appKey: process.env.X_API_KEY_CREX,
    appSecret: process.env.X_API_SECRET_CREX,
    accessToken: process.env.X_ACCESS_TOKEN_CREX,
    accessSecret: process.env.X_ACCESS_SECRET_CREX,
  });
}

if (isGP) {
  client = new TwitterApi({
    appKey: process.env.X_API_KEY_GP,
    appSecret: process.env.X_API_SECRET_GP,
    accessToken: process.env.X_ACCESS_TOKEN_GP,
    accessSecret: process.env.X_ACCESS_SECRET_GP,
  });
}

console.log("Access token suffix:", process.env.X_ACCESS_TOKEN_CREX?.slice(-6));

console.log("GP token suffix:", process.env.X_ACCESS_TOKEN_GP?.slice(-6));

// const client = new TwitterApi({
//   appKey: process.env.X_API_KEY_CREX,
//   appSecret: process.env.X_API_SECRET_CREX,
//   accessToken: process.env.X_ACCESS_TOKEN_CREX,
//   accessSecret: process.env.X_ACCESS_SECRET_CREX,
// });
const rwClient = client.readWrite;
const me = await rwClient.v2.me({
  "user.fields": ["username", "name"],
});

console.log("Authenticated as:", me.data);

// async function downloadImage(url) {
//   fs.mkdirSync("./tmp", { recursive: true });
//   const filePath = "./tmp/news.jpg";

//   const res = await axios.get(url, {
//     responseType: "arraybuffer",
//     headers: {
//       "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
//       "X-RapidAPI-Host": "cricbuzz-cricket.p.rapidapi.com",
//     },
//   });

//   fs.writeFileSync(filePath, res.data);
//   return filePath;
// }

export async function downloadImage(urlOrPath) {
  fs.mkdirSync("./tmp", { recursive: true });

  if (urlOrPath.startsWith("./") || urlOrPath.startsWith("/")) {
    console.log("📁 Using local generated image");
    return urlOrPath;
  }

  const filePath = "./tmp/news.png"; // 🔥 single file

  const res = await axios.get(urlOrPath, {
    responseType: "arraybuffer",
  });

  fs.writeFileSync(filePath, res.data);

  return filePath;
}

export async function tweetNewsWithImage(text, imageUrl) {
  let filePath = null;
  let isTempFile = false;

  try {
    if (imageUrl?.startsWith("http")) {
      console.log("⬇ Downloading image...");
      filePath = await downloadImage(imageUrl);
      isTempFile = true;
    } else {
      console.log("📂 Using local image...");
      filePath = imageUrl;

      // 🔥 IMPORTANT FIX
      if (filePath.includes("/tmp/")) {
        isTempFile = true;
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error("Image file not found");
    }

    // 🔼 STEP 2: Read file safely
    console.log("📤 Uploading image to Twitter...");

    const data = await fs.promises.readFile(filePath); // ✅ async read (no lock issues)

    const ext = path.extname(filePath).toLowerCase();

    let mimeType = "image/jpeg";
    if (ext === ".png") mimeType = "image/png";
    else if (ext === ".webp") mimeType = "image/webp";

    // 🐦 STEP 3: Upload + Tweet
    const mediaId = await rwClient.v1.uploadMedia(data, { mimeType });

    console.log("📝 Tweeting...");
    const tweet = await rwClient.v2.tweet({
      text,
      media: { media_ids: [mediaId] },
    });

    console.log("🚀 Tweet Posted:", tweet.data.id);

    return tweet;
  } catch (err) {
    console.error(
      "❌ Error tweeting news image:",
      err.response?.status || err?.code || err?.message,
    );
    throw err;
  } finally {
    console.log("isTempFile::", isTempFile);
    console.log("finally filePath::", filePath);
    console.log("fs.existsSync(filePath)::", fs.existsSync(filePath));
    try {
      if (isTempFile && filePath && fs.existsSync(filePath)) {
        console.log("🧹 Cleaning up file:", filePath);

        fs.unlinkSync(filePath);

        console.log("✅ File deleted");
      }
    } catch (cleanupErr) {
      console.error("⚠️ Cleanup failed:", cleanupErr.message);
    }
  }
}

// export async function tweetNewsWithImage(text, imageUrl) {
//   let downloadedPath = null;

//   try {
//     console.log("⬇ Downloading image...");
//     downloadedPath = await downloadImage(imageUrl);

//     console.log("📤 Uploading image to Twitter...");
//     const data = fs.readFileSync(downloadedPath);

//     // await new Promise((r) => setTimeout(r, 1000));

//     const mediaId = await rwClient.v1.uploadMedia(data, {
//       mimeType: "image/jpeg",
//     });

//     console.log("📝 Tweeting...");
//     const tweet = await rwClient.v2.tweet({
//       text,
//       media: { media_ids: [mediaId] },
//     });

//     console.log("🚀 Tweet Posted:", tweet.data.id);

//     return tweet;
//   } catch (err) {
//     console.error(
//       "❌ Error tweeting news image:",
//       err.response?.status || err?.code || err?.message
//     );
//     throw err;
//   } finally {
//     if (downloadedPath && fs.existsSync(downloadedPath)) {
//       fs.unlinkSync(downloadedPath);
//     }
//   }
// }
