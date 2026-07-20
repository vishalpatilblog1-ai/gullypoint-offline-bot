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
