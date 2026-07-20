import dotenv from "dotenv";
import { scorePollingLoop } from "./crickbuzz/loops/scorePollingLoop.js";
dotenv.config();

const MATCH_ID = process.env.FORCE_MATCH_ID
  ? Number(process.env.FORCE_MATCH_ID)
  : 139018;

const startBot = async () => {
  try {
    console.log("========================================");
    console.log("🏏 GullyPoint Cricket Bot");
    console.log("🚀 Starting score polling...");
    console.log("========================================");

    console.log(`🎯 Using Match ID: ${MATCH_ID}`);

    await scorePollingLoop(MATCH_ID);
  } catch (error) {
    console.error("❌ Failed to start cricket bot:", error);
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
