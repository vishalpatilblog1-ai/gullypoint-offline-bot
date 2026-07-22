import { hasMatchEnded } from "../utils/utils.js";

export function detectMatchResult(prev, curr, response) {
  if (!prev || !curr || !response) return null;

  const previousEnded = hasMatchEnded(prev.status);
  const currentEnded = hasMatchEnded(curr.status);

  if (previousEnded || !currentEnded) {
    return null;
  }
  const matchDetails = response?.miniscore?.matchScoreDetails ?? {};


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
