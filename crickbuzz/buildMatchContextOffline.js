// cricbuzz/buildMatchContextOffline.js

import { shortTeamName } from "./utils/formatter.js";

// import { shortTeamName } from "../../utils/formatter.js";

function normalizeOvers(overs) {
  if (!overs) return overs;

  const [o, b = "0"] = overs.toString().split(".");
  const over = Number(o);
  const ball = Number(b);

  if (ball === 6) {
    return `${over + 1}`;
  }

  return overs;
}

export function buildMatchContextOffline({
  score,
  event,
  isMatchComplete = false,
}) {
  const mini = score?.miniscore || {};
  const details = mini?.matchScoreDetails || {};

  const matchInfo = details?.matchTeamInfo?.[0] || {};

  const team1Long = details?.matchTeamInfo?.[0]?.battingTeamShortName || "";
  const team2Long = details?.matchTeamInfo?.[0]?.bowlingTeamShortName || "";

  const team1Short = shortTeamName(team1Long);
  const team2Short = shortTeamName(team2Long);

  const enrichedEvent = {
    ...event,

    matchName: `🚨 ${team1Long || team1Short} Vs ${team2Long || team2Short} 🚨`,

    inningsid: mini.inningsId,

    runs: event?.score ?? mini?.batTeam?.teamScore,
    wickets: mini?.batTeam?.teamWkts,
    overs: event?.overs ?? normalizeOvers(mini?.overs),

    batteamname: event?.battingTeam,
    batteamsname: event?.battingTeam,

    bowlerName: event?.bowlerName ?? mini?.bowlerStriker?.bowlName ?? "",

    batterName: event?.batterName,
    batterRuns: event?.batterRuns,
    batterBalls: event?.batterBalls,

    commentary: event?.commentary,
    lastWicket: event?.lastWicket,

    currRunrate: event?.currRunrate ?? mini?.currentRunRate,

    requiredRunRate: mini?.requiredRunRate,

    target: mini?.target,

    series: "",

    scoreCardStatus: mini?.status ?? "",

    isMatchComplete,

    team1Short,
    team2Short,

    team1Long,
    team2Long,

    format: details?.matchFormat?.toUpperCase() || "",

    venue: "",

    outdec: event?.outdec,

    collapseInfo: event?.collapseInfo,
  };

  return {
    event: enrichedEvent,
  };
}
