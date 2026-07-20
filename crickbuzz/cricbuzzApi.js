// cricbuzz/cricbuzzApi.js
import fetch from "node-fetch";
import "dotenv/config";
import { getLiveMiniScore } from "./offline/cricbuzzApiOffline.js";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const BASE_URL = "https://cricbuzz-cricket.p.rapidapi.com";

/* Helper to fetch JSON safely */
async function fetchJson(url) {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com",
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
    });

    return await res.json();
  } catch (err) {
    console.error("❌ Fetch JSON error:", err.message);
    return null;
  }
}

export async function getLiveMatches() {
  return await fetchJson(`${BASE_URL}/matches/v1/live`);
}

export async function getLiveNewsList() {
  return await fetchJson(`${BASE_URL}/news/v1/index`);
}
export async function getNewsDetailsByNewsId(newsId) {
  return await fetchJson(`${BASE_URL}/news/v1/detail/${newsId}`);
}
export async function getICCRankings({
  category = "batsmen",
  formatType = "test",
} = {}) {
  const url = `${BASE_URL}/stats/v1/rankings/${category}?formatType=${formatType}`;
  return await fetchJson(url);
}

export async function getICCStandings({ matchType = "1" }) {
  return await fetchJson(
    `https://cricbuzz-cricket.p.rapidapi.com/stats/v1/iccstanding/team/matchtype/${matchType}`,
  );
}

export async function getRecordFilters() {
  return await fetchJson(`${BASE_URL}/stats/get-record-filters`);
}

export async function getRecords() {
  return await fetchJson(`${BASE_URL}/stats/get-records`);
}

export async function findIndiaMatch() {
  const data = await getLiveMatches();

  if (!data?.typeMatches) return null;

  // Allowed international identifiers
  const INTERNATIONAL_KEYS = [
    "test",
    "odi",
    "t20",
    "t20i",
    "international",
    "one-day",
  ];

  // Domestic leagues to skip
  const BLOCKED_KEYS = [
    "premier",
    "league",
    "ipl",
    "ranji",
    "trophy",
    "cup",
    "shield",
    "smat",
    "syed mushtaq",
    "women",
    "u19",
    "u23",
    "lanka",
    "psl",
    "bbl",
    "super smash",
    "nepal",
  ];

  for (const block of data.typeMatches) {
    for (const series of block.seriesMatches || []) {
      const matches = series.seriesAdWrapper?.matches || [];

      for (const match of matches) {
        const info = match.matchInfo;
        if (!info) continue;

        const t1 = info.team1?.teamName?.toLowerCase() || "";
        const t2 = info.team2?.teamName?.toLowerCase() || "";
        const format = info.matchFormat?.toLowerCase() || "";
        const seriesName = info.seriesName?.toLowerCase() || "";

        const isIndia = t1.includes("india") || t2.includes("india");

        if (!isIndia) continue;

        // Reject domestic leagues or IPL-like tournaments
        const isBlocked = BLOCKED_KEYS.some((key) => seriesName.includes(key));

        if (isBlocked) continue;

        // Must match international formats
        const isInternational = INTERNATIONAL_KEYS.some((key) =>
          format.includes(key),
        );

        if (!isInternational) continue;

        return {
          id: info.matchId,
          name: info.seriesName,
          format: info.matchFormat,
        };
      }
    }
  }

  return null;
}
export async function getBestImageUrl(imageId) {
  const cdnBase = "https://static.cricbuzz.com/a/img/v1/i1/c";
  const apiBase = "https://cricbuzz-cricket.p.rapidapi.com/img/v1/i1/c";

  const candidates = [
    `${cdnBase}${imageId}/o.jpg`,
    `${cdnBase}${imageId}/l.jpg`,
    `${apiBase}${imageId}/i.jpg`,
  ];

  for (const url of candidates) {
    try {
      const res = await axios.get(url, {
        responseType: "arraybuffer",
        validateStatus: (s) => s < 500,
      });

      if (res.status === 200) return url;
    } catch (err) {}
  }

  return null;
}

export async function getMatchScore(matchId) {
  const data = await await fetchJson(`${BASE_URL}/mcenter/v1/${matchId}/scard`);
  return data;
}

export async function getCommentary(matchId) {
  return await fetchJson(`${BASE_URL}/mcenter/v1/${matchId}/comm`);
}

export async function fetchNewsImageById(imageId) {
  return await fetchJson(`${BASE_URL}/img/v1/i1/c${imageId}/i.jpg`);
}
export async function fetchNewsPhotos() {
  return await fetchJson(`${BASE_URL}/photos/v1/index`);
}
export async function fetchNewsPhotoGallery() {
  return await fetchJson(`${BASE_URL}/photos/v1/detail/5374`);
}

export async function getMatchDetails(matchId) {
  return await fetchJson(`${BASE_URL}/mcenter/v1/${matchId}`);
}

export function buildCricbuzzImageUrl(imageId) {
  if (!imageId) return null;

  return `https://static.cricbuzz.com/a/img/v1/600x400/i1/c${imageId}/i.jpg`;
}

export async function getPreMatchImage(matchId) {
  try {
    const data = await fetchJson(`${BASE_URL}/mcenter/v1/${matchId}`);

    const matchImageId = data?.matchimageid;

    if (!matchImageId) {
      console.log("⚠ No match image id found");
      return null;
    }

    return buildMatchImageUrl(matchImageId);
  } catch (err) {
    console.log("❌ getPreMatchImage error:", err.message);
    return null;
  }
}

export function buildMatchImageUrl(matchImageId) {
  if (!matchImageId) return null;

  return `https://static.cricbuzz.com/a/img/v1/600x400/i1/c${matchImageId}/i.jpg`;
}

const IS_FREE_PROVIDER =
  (process.env.CRICBUZZ_PROVIDER || "paid").toLowerCase() === "free";

export async function getLiveScore(matchId) {
  if (IS_FREE_PROVIDER) {
    return getLiveMiniScore(matchId);
  }

  return getMatchScore(matchId);
}
