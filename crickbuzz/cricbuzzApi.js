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

export async function getCommentaryOld(matchId) {
  console.log("Fetching match commentary", matchId);

  try {
    const res = await fetch(
      `${DIRECT_CRICBUZZ_BASE}/api/mcenter/hcomm/${matchId}`,
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
    const data = await res.json();

    console.log(JSON.stringify(data, null, 2));

    return data;
  } catch (err) {
    console.error("❌ getMatchCommentary:", err.message);
    return null;
  }
}

export async function getCommentary(matchId, endpoint = "comm") {
  console.log(`Fetching ${endpoint} for match ${matchId}`);

  const res = await fetch(
    `${DIRECT_CRICBUZZ_BASE}/api/mcenter/${endpoint}/${matchId}`,
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
}

export async function getCommentaryAuto(matchId) {
  const endpoints = ["comm", "hcomm"];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying: ${endpoint}`);

      const data = await getCommentary(matchId, endpoint);

      const hasMini = !!data?.miniscore;

      const comments = Object.values(data?.matchCommentary || {});

      // Ignore Cricbuzz's placeholder:
      // "Please Update the app to follow match updates"
      const hasRealCommentary = comments.some((comment) => {
        const text = comment?.commText?.trim();

        return text && !text.toLowerCase().includes("please update the app");
      });

      console.log(endpoint, {
        hasMini,
        hasRealCommentary,
      });

      if (hasMini || hasRealCommentary) {
        console.log(`✅ Using ${endpoint}`);
        return data;
      }

      console.log(`❌ ${endpoint} has no useful data. Trying next...`);
    } catch (err) {
      console.error(`❌ ${endpoint} failed:`, err.message);
    }
  }

  throw new Error(
    `Unable to fetch valid commentary for match ${matchId} from any endpoint.`,
  );
}
// export async function getCommentaryAuto(matchId) {
//   const endpoints = ["comm", "hcomm"];

//   for (const endpoint of endpoints) {
//     try {
//       const data = await getCommentary(matchId, endpoint);

//       // Valid response?
//       if (
//         data?.matchHeader ||
//         data?.miniscore ||
//         Object.keys(data?.matchCommentary || {}).length > 0
//       ) {
//         return data;
//       }
//     } catch (err) {
//       console.log(`${endpoint} failed: ${err.message}`);
//     }
//   }

//   return null;
// }

export async function getLiveScore(matchId) {
  return getLiveMiniScore(matchId);
}
