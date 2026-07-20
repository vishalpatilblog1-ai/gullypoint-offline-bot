import dotenv from "dotenv";
import { scorePollingLoopOffline } from "./crickbuzz/offline/loops/scorePollingLoopOffline.js";

dotenv.config();

// import { scorePollingLoopOffline } from "./cricbuzz/offline/scorePollingLoopOffline.js";

const startBot = async () => {
  try {
    console.log("========================================");
    console.log("🏏 GullyPoint Offline Cricket Bot");
    console.log("🚀 Starting offline score polling...");
    console.log("========================================");

    await scorePollingLoopOffline();
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
