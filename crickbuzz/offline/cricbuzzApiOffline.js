// ------------------------------
// Direct Cricbuzz API (No RapidAPI)
// ------------------------------

const DIRECT_CRICBUZZ_BASE = "https://www.cricbuzz.com";

export async function getLiveMiniScore(matchId) {
  try {
    const res = await fetch(
      `${DIRECT_CRICBUZZ_BASE}/api/mcenter/livescore/${matchId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0",
          Referer: `https://www.cricbuzz.com/live-cricket-scores/${matchId}`,
        },
      },
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("❌ getLiveMiniScore:", err.message);
    return null;
  }
}

export async function getCommentaryOffline(matchId) {
  console.log("Fetching match commentary");

  try {
    const res = await fetch(
      `${DIRECT_CRICBUZZ_BASE}/api/mcenter/comm/${matchId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0",
          Referer: `https://www.cricbuzz.com/live-cricket-scores/${matchId}`,
        },
      },
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("❌ getMatchCommentary:", err.message);
    return null;
  }
}
