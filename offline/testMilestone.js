//cricbuzz/offline/testMilestone.js

import { handleOfflineMilestone } from "./handlers/handleOfflineMilestone.js";

// testMilestone.js

// import { handleOfflineMilestone } from "./cricbuzz/offline/handlers/handleOfflineMilestone.js";
globalThis.OFFLINE_LAST_EVENT_BALL;

await handleOfflineMilestone({
  milestoneEvent: {
    type: "FIFTY",

    eventBallNbr: 121,
    ballNbr: 121,

    inningsId: 1,

    score: 156,
    wickets: 2,
    overs: 26.1,

    battingTeam: "IND",

    batterName: "Virat Kohli",
    batterRuns: 50,
    batterBalls: 43,

    team1Short: "IND",
    team2Short: "ENG",
  },

  currentSnapshot: {
    ballNbr: 121,
  },

  useWebTweet: true,
});
