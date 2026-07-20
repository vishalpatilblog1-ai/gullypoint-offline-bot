// cricbuzz/offline/utils/playingXIParser.js

export function extractPlayingXI(response) {
  const commentary = response?.matchCommentary;

  if (!commentary) return null;

  const result = {};

  for (const item of Object.values(commentary)) {
    const text = item?.commText;

    if (!text) continue;

    const match = text.match(/<b>(.*?)<\/b>\s*\(Playing XI\):\s*(.+)/i);

    if (!match) continue;

    const [, teamName, playersText] = match;

    result[teamName.trim()] = playersText
      .split(",")
      .map((player) => player.trim())
      .filter(Boolean);

    // result[teamName.trim()] = playersText
    //   .split(",")
    //   .map((player) => player.replace(/\s*\((c|wk|w)\)/gi, "").trim())
    //   .filter(Boolean);
  }

  return Object.keys(result).length ? result : null;
}
