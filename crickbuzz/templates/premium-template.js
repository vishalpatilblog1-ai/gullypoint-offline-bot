// import { longTeamName } from "../../../utils/formatter.js";
import { longTeamName } from "../utils/formatter.js";
import { getWicketHeader, getWicketLine } from "../utils/offline-utils.js";

export function formatWicketInfo({
  batterName,
  batterRuns,
  batterBalls,
  battingTeam,
  score,
  wickets,
  overs,
}) {
  const header = getWicketHeader(batterRuns, wickets);

  const wicketLine = getWicketLine(batterName, batterRuns, batterBalls);

  return `${header}

${wicketLine}

${battingTeam} - ${score}/${wickets} (${overs} ov)`;
}

export function createTossTweet({
  tossWinner,
  decision,
  team1Short,
  team2Short,
}) {
  const action = decision.toLowerCase() === "bowling" ? "bowl" : "bat";

  return [
    `🚨 ${team1Short} vs ${team2Short}`,
    "",
    `${tossWinner} win the toss and elect to ${action} first.`,
    "",
    "Live updates 👉",
  ].join("\n");
}

export function formatMilestoneInfo({
  batterName,
  batterRuns,
  batterBalls,
  battingTeam,
  score,
  wickets,
  overs,
}) {
  let header = "FIFTY";

  if (batterRuns >= 200) {
    header = "DOUBLE CENTURY";
  } else if (batterRuns >= 150) {
    header = "150";
  } else if (batterRuns >= 100) {
    header = "CENTURY";
  }

  return `${header}

${batterName} brings up ${batterRuns} from ${batterBalls} balls.

${battingTeam} ${score}/${wickets} (${overs} ov)`;
}

export function formatMatchResultInfo({ status, innings1, innings2 }) {
  return `${status}`;
}

export function displayMatchInfo(response) {
  const matchTeamInfo = response?.miniscore?.matchScoreDetails?.matchTeamInfo;

  const firstTeamInfo = matchTeamInfo?.[0];

  if (!firstTeamInfo) {
    console.warn("⚠ Match team info unavailable", {
      hasMiniscore: Boolean(response?.miniscore),
      matchScoreDetails: response?.miniscore?.matchScoreDetails,
    });

    return;
  }

  const battingTeamShortName = firstTeamInfo.battingTeamShortName;
  const bowlingTeamShortName = firstTeamInfo.bowlingTeamShortName;

  if (!battingTeamShortName || !bowlingTeamShortName) {
    console.warn("⚠ Team names unavailable", firstTeamInfo);
    return;
  }

  const team1 = longTeamName(battingTeamShortName);
  const team2 = longTeamName(bowlingTeamShortName);

  const [first, second] = team2 === "India" ? [team2, team1] : [team1, team2];

  console.log(`💥 ${first} vs ${second} 💥`);
}

export function createPlayingXITweet(playingXI) {
  if (!playingXI) return null;

  const teams = Object.entries(playingXI);

  if (teams.length < 2) {
    console.warn("⚠ Unable to build Playing XI tweet");
    return null;
  }

  const [[team1, team1Players], [team2, team2Players]] = teams;

  return [
    "🚨 PLAYING XIs",
    "",
    `${team1} -`,
    team1Players.join(", "),
    "",
    `${team2} -`,
    team2Players.join(", "),
  ].join("\n");
}
