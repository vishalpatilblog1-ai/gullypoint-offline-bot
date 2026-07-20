export function detectWicket(prev, curr) {
  if (!prev || !curr) return null;

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
