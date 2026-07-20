import dotenv from "dotenv";
dotenv.config();

import { scorePollingLoopOffline } from "./crickbuzz/offline/loops/scorePollingLoopOffline.js";

const MATCH_ID = process.env.FORCE_MATCH_ID
  ? Number(process.env.FORCE_MATCH_ID)
  : 139018;

const startBot = async () => {
  try {
    console.log("========================================");
    console.log("🏏 GullyPoint Offline Cricket Bot");
    console.log("🚀 Starting offline score polling...");
    console.log("========================================");

    console.log(`🎯 Using Match ID: ${MATCH_ID}`);

    await scorePollingLoopOffline(MATCH_ID);
  } catch (error) {
    console.error("❌ Failed to start offline cricket bot:", error);
    process.exit(1);
  }
};

process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught exception:", error);
  process.exit(1);
});

startBot();
