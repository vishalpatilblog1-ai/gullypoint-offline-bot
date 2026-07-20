// formatter.js

export function shortTeamName(name = "") {
  const map = {
    india: "IND",
    "south africa": "SA",
    pakistan: "PAK",
    australia: "AUS",
    england: "ENG",
    "new zealand": "NZ",
    "sri lanka": "SL",
    bangladesh: "BAN",
    "west indies": "WI",
    afghanistan: "AFG",
    zimbabwe: "ZIM",
    ireland: "IRE",
    nepal: "NEP",
    netherlands: "NED",
    uae: "UAE",
    scotland: "SCO",
  };

  const key = name.trim().toLowerCase();
  return map[key] || name;
}

export function longTeamName(name = "") {
  const map = {
    IND: "India",
    SA: "South Africa",
    PAK: "Pakistan",
    AUS: "Australia",
    ENG: "England",
    NZ: "New Zealand",
    SL: "Sri Lanka",
    BAN: "Bangladesh",
    WI: "West Indies",
    AFG: "Afghanistan",
    ZIM: "Zimbabwe",
    IRE: "Ireland",
    NEP: "Nepal",
    NED: "Netherlands",
    UAE: "UAE",
    SCO: "Scotland",
  };

  const key = name.trim().toUpperCase();
  return map[key] || name;
}

export function cleanBallText(text) {
  if (!text) return "";
  return text
    .replace(/B\d\$/g, "")
    .replace(/,,/g, ",")
    .replace(/\s+,/g, ",")
    .replace(/\s+/g, " ")
    .trim();
}

export function smartShortName(fullName, otherFullName = "") {
  if (!fullName) return "";

  const parts = fullName.trim().split(" ");
  const last = parts[parts.length - 1];
  const first = parts[0];

  // If no comparison name given OR last names different → return last name
  if (!otherFullName) return last;

  const otherParts = otherFullName.trim().split(" ");
  const otherLast = otherParts[otherParts.length - 1];

  // If last names same → return initial + last
  if (last.toLowerCase() === otherLast.toLowerCase()) {
    return `${first[0]}. ${last}`;
  }

  return last;
}
export function formatPartnership(p = "") {
  return p.replace("(", " (");
}
