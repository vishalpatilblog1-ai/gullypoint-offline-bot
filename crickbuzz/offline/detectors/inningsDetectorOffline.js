// cricbuzz/offline/detectors/inningsDetectorOffline.js

import dotenv from "dotenv";
dotenv.config();

import { getCommentaryOffline } from "../cricbuzzApiOffline.js";
import { handleOfflinePlayingXI } from "../handlers/handleOfflinePlayingXI.js";
import { handleOfflineToss } from "../handlers/handleOfflineToss.js";
import { detectOfflineToss, hasMatchEnded } from "../utils/offline-utils.js";

const USE_WEB_TWEET = process.env.USE_WEB_TWEET === "true";

export function detectOfflineWicket(prev, curr) {
  if (!prev || !curr) return null;

  // if (prev.ballNbr === curr.ballNbr) return null;
  const sameBall = prev.ballNbr === curr.ballNbr;

  const prevEvent = String(prev.raw?.miniscore?.event ?? "")
    .trim()
    .toUpperCase();

  const currEvent = String(curr.raw?.miniscore?.event ?? "")
    .trim()
    .toUpperCase();

  if (sameBall && curr.wickets === prev.wickets && prevEvent === currEvent) {
    return null;
  }

  if (prev.inningsId !== curr.inningsId) return null;

  const mini = curr.raw?.miniscore ?? {};

  const events = (
    Array.isArray(mini.event) ? mini.event : String(mini.event || "").split(",")
  )
    .map((event) => String(event).trim().toUpperCase())
    .filter(Boolean);

  const apiSaysWicket = events.includes("WICKET");
  const wicketCountIncreased = curr.wickets > prev.wickets;

  if (!apiSaysWicket && !wicketCountIncreased) {
    return null;
  }

  const lastWicket = curr.lastWicket || mini.lastWicket || "";

  const wicketInfo = parseLastWicket(lastWicket);

  const matchTeamInfo = mini.matchScoreDetails?.matchTeamInfo?.[0] ?? {};

  const team1Short = matchTeamInfo.battingTeamShortName ?? "";
  const team2Short = matchTeamInfo.bowlingTeamShortName ?? "";

  console.log("wicketInfo::", wicketInfo);

  return {
    type: "WICKET",
    event: mini.event,

    eventBallNbr: curr.ballNbr,
    ballNbr: curr.ballNbr,

    inningsId: curr.inningsId,

    score: curr.score,
    wickets: curr.wickets,
    overs: curr.overs,

    battingTeam: curr.battingTeam,

    commentary: curr.commentary,
    lastWicket,

    batterName: wicketInfo?.batterName ?? "",
    batterRuns: wicketInfo?.batterRuns ?? null,
    batterBalls: wicketInfo?.batterBalls ?? null,

    bowlerName: mini.bowlerStriker?.bowlName ?? "",

    currRunrate: mini.currentRunRate ?? null,
    requiredRunRate: mini.requiredRunRate ?? null,
    outDescription: wicketInfo?.outDescription ?? "",
    team1Short,
    team2Short,
    raw: curr.raw,
  };
}

function parseLastWicket(lastWicket = "") {
  if (!lastWicket) return null;

  const score = lastWicket.match(/(\d+)\((\d+)\)/);

  const batterName = lastWicket
    .replace(
      /\s+(?:c\b|b\b|lbw\b|run out\b|st\b|retired out\b|retired hurt\b).*$/i,
      "",
    )
    .trim();

  let outDescription = "";

  if (score) {
    outDescription = lastWicket
      .split(score[0])[0]
      .replace(batterName, "")
      .trim();
  }
  console.log("outDescription:::", outDescription);

  return {
    batterName,
    batterRuns: score ? Number(score[1]) : null,
    batterBalls: score ? Number(score[2]) : null,
    outDescription,
  };
}

export function detectOfflineMilestone(prev, curr) {
  if (!prev || !curr) return null;

  if (prev.inningsId !== curr.inningsId) return null;

  const milestones = {
    FIFTY: 50,
    HUNDRED: 100,
  };

  const prevEvents = (prev.event ?? "")
    .split(",")
    .map((e) => e.trim().toUpperCase())
    .filter(Boolean);

  const currEvents = (curr.event ?? "")
    .split(",")
    .map((e) => e.trim().toUpperCase())
    .filter(Boolean);

  const milestoneType = Object.keys(milestones).find(
    (event) => currEvents.includes(event) && !prevEvents.includes(event),
  );

  if (!milestoneType) return null;

  const requiredRuns = milestones[milestoneType];

  console.log(`🏏 ${milestoneType} detected`, {
    ball: curr.ballNbr,
    prevEvent: prev.event,
    currEvent: curr.event,
    commentary: curr.commentary,
    striker: curr.striker,
    nonStriker: curr.nonStriker,
  });

  const eligibleBatters = [curr.striker, curr.nonStriker].filter(
    (batter) => batter.runs >= requiredRuns,
  );

  if (eligibleBatters.length === 0) {
    console.warn(`⚠ Unable to identify batter for ${milestoneType}`, {
      requiredRuns,
      striker: curr.striker,
      nonStriker: curr.nonStriker,
      commentary: curr.commentary,
    });

    return null;
  }

  let batter = eligibleBatters[0];

  if (eligibleBatters.length > 1) {
    const commentary = (curr.commentary ?? "").toLowerCase();

    const commentaryMatch = eligibleBatters.find((batter) =>
      commentary.includes(batter.name.toLowerCase()),
    );

    if (commentaryMatch) {
      batter = commentaryMatch;

      console.log(
        `ℹ Multiple eligible batters. Using commentary match: ${batter.name}`,
      );
    } else {
      batter = eligibleBatters.reduce((highest, current) =>
        current.runs > highest.runs ? current : highest,
      );

      console.warn(
        `⚠ Multiple eligible batters. Falling back to highest scorer.`,
        {
          commentary: curr.commentary,
          eligibleBatters,
        },
      );
    }
  }

  console.log(`✅ ${milestoneType} selected`, {
    batter: batter.name,
    runs: batter.runs,
    balls: batter.balls,
  });

  const matchTeamInfo =
    curr.raw?.miniscore?.matchScoreDetails?.matchTeamInfo?.[0] ?? {};

  const team1Short = matchTeamInfo.battingTeamShortName ?? "";
  const team2Short = matchTeamInfo.bowlingTeamShortName ?? "";

  return {
    type: milestoneType,

    eventBallNbr: curr.ballNbr,
    ballNbr: curr.ballNbr,

    inningsId: curr.inningsId,

    score: curr.score,
    wickets: curr.wickets,
    overs: curr.overs,

    battingTeam: curr.battingTeam,

    commentary: curr.commentary,

    batterName: batter.name,
    batterRuns: batter.runs,
    batterBalls: batter.balls,
    team1Short,
    team2Short,
  };
}

export function detectOfflineMatchResult(prev, curr, response) {
  if (!prev || !curr || !response) return null;

  const previousEnded = hasMatchEnded(prev.status);
  const currentEnded = hasMatchEnded(curr.status);

  if (previousEnded || !currentEnded) {
    return null;
  }
  const matchDetails = response?.miniscore?.matchScoreDetails ?? {};

  console.log("matchDetails:::", matchDetails);
  const matchHeader = response?.matchHeader ?? {};

  const innings =
    response?.miniscore?.matchScoreDetails?.inningsScoreList ?? [];

  const innings1 = innings.find((i) => i.inningsId === 1);
  const innings2 = innings.find((i) => i.inningsId === 2);

  return {
    type: "MATCH_RESULT",

    matchId: matchDetails.matchId,

    matchState: matchDetails.state,

    status: response?.miniscore?.status ?? matchDetails.customStatus ?? "",

    highlightedTeamId: matchDetails.highlightedTeamId,
    team1: matchHeader.team1?.name,
    team2: matchHeader.team2?.name,
    team1Short: matchHeader.team1?.shortName,
    team2Short: matchHeader.team2?.shortName,

    innings1: innings1
      ? {
          teamId: innings1.batTeamId,
          team: innings1.batTeamName,
          score: innings1.score,
          wickets: innings1.wickets,
          overs: innings1.overs,
        }
      : null,

    innings2: innings2
      ? {
          teamId: innings2.batTeamId,
          team: innings2.batTeamName,
          score: innings2.score,
          wickets: innings2.wickets,
          overs: innings2.overs,
        }
      : null,

    raw: response,
  };
}

export function detectOfflinePresentation(response) {
  const commentary = response?.matchCommentary;

  if (!commentary) {
    return [];
  }

  const items = Object.values(commentary)
    .filter(
      (item) =>
        item?.commType === "commentary" && typeof item?.commText === "string",
    )
    .sort((a, b) => a.timestamp - b.timestamp); // Oldest → Newest

  const events = [];

  for (const item of items) {
    const text = item.commText;

    const match = text.match(
      /<b>(.*?)\s*\|\s*(Player of the Match|.*capt.*):<\/b>/i,
    );

    if (!match) {
      continue;
    }

    const player = match[1].trim();
    const role = match[2].trim();

    let type = "PRESENTATION";

    // if (/player of the match/i.test(role)) {
    //   type = "PLAYER_OF_MATCH";
    // } else if (/capt/i.test(role)) {
    //   type = "CAPTAIN";
    // }

    if (/player of the match/i.test(role)) {
      type = "PLAYER_OF_MATCH";
    } else if (/player of the series/i.test(role)) {
      type = "PLAYER_OF_SERIES";
    } else if (/capt/i.test(role)) {
      type = "CAPTAIN";
    }

    events.push({
      type,
      role,
      player,
      quote: text,
      timestamp: item.timestamp,
      inningsId: item.inningsId,
      teamName: item.teamName,
    });
  }

  return events;
}

export async function processPreMatchEvents(matchId) {
  if (!globalThis.OFFLINE_COMMENTARY_RESPONSE) {
    console.log("📥 Fetching commentary for pre-match metadata...");

    globalThis.OFFLINE_COMMENTARY_RESPONSE =
      await getCommentaryOffline(matchId);
  }

  const tossEvent = detectOfflineToss(globalThis.OFFLINE_COMMENTARY_RESPONSE);

  if (tossEvent?.state !== "Toss") {
    return;
  }

  await handleOfflineToss({
    tossEvent,
    useWebTweet: USE_WEB_TWEET,
  });

  if (!globalThis.OFFLINE_PLAYING_XI_TWEETED) {
    await handleOfflinePlayingXI({
      matchId: matchId,
      useWebTweet: USE_WEB_TWEET,
    });
  }
}
