export function clone(value) {
  return value ? structuredClone(value) : null;
}

export function getCurrentInningsScore(mini) {
  const inningsList = mini?.matchScoreDetails?.inningsScoreList;

  if (!Array.isArray(inningsList)) return null;

  return (
    inningsList.find(
      (innings) => Number(innings?.inningsId) === Number(mini?.inningsId),
    ) ?? null
  );
}

export function buildSnapshot(response) {
  const mini = response?.miniscore;

  if (!mini?.batTeam) return null;

  const inningsScore = getCurrentInningsScore(mini);
  const commentary = response?.commentaryList?.[0] ?? null;
  const striker = mini?.batsmanStriker;
  const nonStriker = mini?.batsmanNonStriker;
  const bowler = mini?.bowlerStriker;

  return {
    matchId: mini?.matchScoreDetails?.matchId ?? null,
    inningsId: mini?.inningsId ?? null,
    isSecondInnings: mini?.inningsId === 2,

    score: Number(mini?.batTeam?.teamScore ?? 0),
    wickets: Number(mini?.batTeam?.teamWkts ?? 0),
    overs: mini?.overs ?? inningsScore?.overs ?? null,

    ballNbr: inningsScore?.ballNbr ?? commentary?.ballNbr ?? null,

    event: mini?.event ?? "NONE",

    battingTeam: inningsScore?.batTeamName ?? commentary?.batTeamName ?? "",

    striker: {
      id: striker?.batId ?? null,
      name: striker?.batName ?? "",
      runs: Number(striker?.batRuns ?? 0),
      balls: Number(striker?.batBalls ?? 0),
    },

    nonStriker: {
      id: nonStriker?.batId ?? null,
      name: nonStriker?.batName ?? "",
      runs: Number(nonStriker?.batRuns ?? 0),
      balls: Number(nonStriker?.batBalls ?? 0),
    },

    bowler: {
      id: bowler?.bowlId ?? null,
      name: bowler?.bowlName ?? "",
    },

    lastWicket: mini?.lastWicket ?? "",

    currentRunRate: mini?.currentRunRate ?? null,
    requiredRunRate: mini?.requiredRunRate ?? null,

    status: mini?.status ?? "",
    matchState: mini?.matchScoreDetails?.state ?? "",
    customStatus: mini?.matchScoreDetails?.customStatus ?? "",
    timestamp: mini?.timestamp ?? null,
    responseLastUpdated: mini?.responseLastUpdated ?? null,

    commentary: commentary?.commText ?? "",

    raw: response,
  };
}

export function resetState(matchId) {
  console.log("🆕 New offline match detected — resetting state");

  globalThis.OFFLINE_PREV_MATCH_ID = matchId;
  globalThis.OFFLINE_PREV_INNINGS_ID = null;
  globalThis.OFFLINE_PREV_SNAPSHOT = null;
  globalThis.OFFLINE_LAST_BALL = null;
  globalThis.OFFLINE_LAST_EVENT_BALL = {};
  globalThis.OFFLINE_LAST_PRESENTATION_TS = 0;
  globalThis.OFFLINE_PRESENTATION_WINDOW_END = null;
  globalThis.OFFLINE_COMMENTARY_RESPONSE = null;

  globalThis.OFFLINE_TOSS_TWEETED = false;
  globalThis.OFFLINE_PLAYING_XI_TWEETED = false;
}

export function isSameSnapshot(previous, current) {
  if (!previous || !current) return false;

  return (
    previous.matchId === current.matchId &&
    previous.inningsId === current.inningsId &&
    previous.ballNbr === current.ballNbr &&
    previous.score === current.score &&
    previous.wickets === current.wickets &&
    previous.event === current.event &&
    previous.matchState === current.matchState &&
    previous.status === current.status
  );
}

export function isMatchComplete(snapshot) {
  const state = snapshot?.matchState?.toLowerCase?.() ?? "";
  const status = snapshot?.status?.toLowerCase?.() ?? "";

  return (
    state === "complete" ||
    state === "completed" ||
    status.includes("won by") ||
    status.includes("match tied") ||
    status.includes("drawn")
  );
}

export function detectToss(response) {
  const matchDetails =
    response?.miniscore?.matchScoreDetails ?? response?.matchHeader;

  if (!matchDetails) return null;

  const toss = matchDetails.tossResults;

  if (!toss?.tossWinnerName || !toss?.decision) {
    return null;
  }

  return {
    type: "TOSS",

    matchId: matchDetails.matchId,

    team1Short:
      matchDetails.team1?.shortName ??
      matchDetails.matchTeamInfo?.[0]?.teamSName,

    team2Short:
      matchDetails.team2?.shortName ??
      matchDetails.matchTeamInfo?.[1]?.teamSName,

    tossWinner: toss.tossWinnerName,
    decision: toss.decision,

    state: matchDetails.state,
    status:
      response?.miniscore?.status ??
      matchDetails.status ??
      matchDetails.customStatus ??
      "",
  };
}

export function getWicketHeader(batterRuns, wicketNumber) {
  if (wicketNumber >= 10) {
    return "🚨 ALL OUT";
  }

  if (batterRuns >= 50) {
    return "🚨 BIG WICKET";
  }

  const headers = ["🚨 WICKET", "🚨 WICKET", "🚨 BREAKTHROUGH"];

  return headers[Math.floor(Math.random() * headers.length)];
}

export function getWicketLine(batterName, batterRuns, batterBalls) {
  if (batterRuns === 0) {
    const ducks = [
      `${batterName} departs for a duck.`,
      `${batterName} falls for a duck.`,
      `${batterName} is gone for 0.`,
      `${batterName} dismissed for a duck.`,
    ];

    return ducks[Math.floor(Math.random() * ducks.length)];
  }

  const score = `${batterRuns} (${batterBalls})`;

  if (batterRuns <= 10) {
    const lines = [
      `${batterName} departs for ${score}.`,
      `${batterName} falls early for ${score}.`,
      `${batterName} fails to get going, scoring ${score}.`,
      `${batterName} is dismissed for ${score}.`,
    ];

    return lines[Math.floor(Math.random() * lines.length)];
  }

  if (batterRuns <= 49) {
    const lines = [
      `${batterName} departs for ${score}.`,
      `${batterName} falls for ${score}.`,
      `${batterName}'s stay ends on ${score}.`,
      `${batterName} is dismissed for ${score}.`,
    ];

    return lines[Math.floor(Math.random() * lines.length)];
  }

  const lines = [
    `${batterName}'s fine knock ends on ${score}.`,
    `${batterName} departs after scoring ${score}.`,
    `${batterName} falls after a valuable ${score}.`,
    `${batterName}'s innings ends on ${score}.`,
  ];

  return lines[Math.floor(Math.random() * lines.length)];
}

export function hasMatchEnded(status = "") {
  const s = status.toLowerCase();

  return (
    s.includes("won by") ||
    s.includes("tied") ||
    s.includes("drawn") ||
    s.includes("no result")
  );
}
