/** Latest season whose tournament has been played (ends in April). */
export function latestCompletedSeason(now = new Date()): number {
  const year = now.getUTCFullYear();
  // March Madness tips over in April; before that, last spring's is newest.
  return now.getUTCMonth() >= 3 ? year : year - 1;
}

/**
 * College Basketball Data API — shared types and pure transformations.
 * Docs: https://collegebasketballdata.com — base URL https://api.collegebasketballdata.com
 * Fetching (with the private API key) lives in `$lib/server/ncaa.js`.
 */

/** Raw game shape returned by GET /games. */
export interface RawCbbGame {
  id: number;
  season: number;
  seasonLabel: string;
  seasonType: string;
  tournament: string | null;
  startDate: string;
  neutralSite: boolean;
  conferenceGame: boolean;
  gameType: string;
  status: string;
  gameNotes: string | null;
  attendance: number | null;
  homeTeamId: number;
  homeTeam: string;
  homeConference: string | null;
  homeSeed: number | null;
  homePoints: number | null;
  homeWinner: boolean;
  homeTeamEloStart: number | null;
  homeTeamEloEnd: number | null;
  awayTeamId: number;
  awayTeam: string;
  awayConference: string | null;
  awaySeed: number | null;
  awayPoints: number | null;
  awayWinner: boolean;
  awayTeamEloStart: number | null;
  awayTeamEloEnd: number | null;
  city: string | null;
  state: string | null;
  venue: string | null;
}

/** Bracket rounds in chronological order. */
export const ROUNDS = [
  "First Four",
  "Round of 64",
  "Round of 32",
  "Sweet 16",
  "Elite 8",
  "Final Four",
  "Championship",
] as const;

export type Round = (typeof ROUNDS)[number];

/** A normalized NCAA-tournament game with winner/loser resolved. */
export interface NcaaGame {
  id: number;
  season: number;
  /** e.g. "2024-2025" */
  seasonLabel: string;
  date: string;
  round: Round;
  region: string | null;
  teamAId: number;
  teamA: string;
  seedA: number | null;
  scoreA: number;
  teamBId: number;
  teamB: string;
  seedB: number | null;
  scoreB: number;
  winnerId: number;
  winner: string;
  winnerSeed: number | null;
  loserId: number;
  loser: string;
  loserSeed: number | null;
  /** Points the winner won by. */
  margin: number;
  /** Elo delta for the winning team (null before seeds/Elo tracked). */
  eloWinner: number | null;
  /** Elo delta for the losing team. */
  eloLoser: number | null;
  /** True when the higher-numbered (weaker) seed won. */
  upset: boolean;
  city: string | null;
  venue: string | null;
  attendance: number | null;
}

const ROUND_PATTERNS: [RegExp, Round][] = [
  [/first four|opening round|play-?in/i, "First Four"],
  [/national championship|championship game/i, "Championship"],
  [/final four|semifinal/i, "Final Four"],
  [/elite 8|regional final/i, "Elite 8"],
  [/sweet 16|regional semifinal/i, "Sweet 16"],
  [/2nd round|second round|round of 32/i, "Round of 32"],
  [/1st round|first round|round of 64/i, "Round of 64"],
];

/** Best-effort round label from the free-form `gameNotes` field. */
export function parseRound(notes: string | null): Round {
  if (notes) {
    for (const [re, round] of ROUND_PATTERNS) {
      if (re.test(notes)) return round;
    }
  }
  return "Round of 64";
}

/** Region name ("South", "East"…) from notes like "… South Region - Sweet 16". */
export function parseRegion(notes: string | null): string | null {
  if (!notes) return null;
  const m = /-\s*(\w+)\s+Region\b/i.exec(notes);
  return m ? m[1] : null;
}

/** Normalize a raw game, deciding team ordering by date id. */
export function normalizeGame(raw: RawCbbGame): NcaaGame | null {
  if (raw.tournament !== "NCAA") return null;
  if (raw.homePoints == null || raw.awayPoints == null) return null;
  const homeWon = !!raw.homeWinner;
  const round = parseRound(raw.gameNotes);
  const winnerSeed = homeWon ? raw.homeSeed : raw.awaySeed;
  const loserSeed = homeWon ? raw.awaySeed : raw.homeSeed;
  const margin = Math.abs(raw.homePoints - raw.awayPoints);
  const delta = (start: number | null, end: number | null) =>
    start != null && end != null ? end - start : null;
  return {
    eloWinner: delta(
      homeWon ? raw.homeTeamEloStart : raw.awayTeamEloStart,
      homeWon ? raw.homeTeamEloEnd : raw.awayTeamEloEnd,
    ),
    eloLoser: delta(
      homeWon ? raw.awayTeamEloStart : raw.homeTeamEloStart,
      homeWon ? raw.awayTeamEloEnd : raw.homeTeamEloEnd,
    ),
    id: raw.id,
    season: raw.season,
    seasonLabel: raw.seasonLabel,
    date: raw.startDate,
    round,
    region: parseRegion(raw.gameNotes),
    teamAId: raw.homeTeamId,
    teamA: raw.homeTeam,
    seedA: raw.homeSeed,
    scoreA: raw.homePoints,
    teamBId: raw.awayTeamId,
    teamB: raw.awayTeam,
    seedB: raw.awaySeed,
    scoreB: raw.awayPoints,
    winnerId: homeWon ? raw.homeTeamId : raw.awayTeamId,
    winner: homeWon ? raw.homeTeam : raw.awayTeam,
    winnerSeed,
    loserId: homeWon ? raw.awayTeamId : raw.homeTeamId,
    loser: homeWon ? raw.awayTeam : raw.homeTeam,
    loserSeed,
    margin,
    // A lower seed (higher number) beating a higher seed (lower number).
    upset:
      winnerSeed != null && loserSeed != null && winnerSeed > loserSeed,
    city: raw.city,
    venue: raw.venue,
    attendance: raw.attendance,
  };
}

export interface SeedMatchupRow {
  /** e.g. "5 vs 12" */
  pair: string;
  seedHigh: number;
  seedLow: number;
  games: number;
  upsets: number;
  upsetRate: number;
}

/**
 * How often does the weaker (higher-numbered) seed beat the stronger seed,
 * grouped by seed pair across all provided games.
 */
export function seedMatchupRates(games: NcaaGame[]): SeedMatchupRow[] {
  const map = new Map<string, { games: number; upsets: number }>();
  for (const g of games) {
    if (g.winnerSeed == null || g.loserSeed == null) continue;
    const high = Math.min(g.winnerSeed, g.loserSeed);
    const low = Math.max(g.winnerSeed, g.loserSeed);
    if (high > 16) continue; // play-in / overflow seeds skipped
    const key = `${high}-${low}`;
    const row = map.get(key) ?? { games: 0, upsets: 0 };
    row.games += 1;
    if (g.upset && g.winnerSeed === low && g.loserSeed === high) {
      row.upsets += 1;
    }
    map.set(key, row);
  }
  const rows: SeedMatchupRow[] = [];
  for (const [key, { games, upsets }] of map) {
    if (games < 4) continue; // not enough sample
    const [seedHigh, seedLow] = key.split("-").map(Number);
    rows.push({
      pair: `${seedHigh} vs ${seedLow}`,
      seedHigh,
      seedLow,
      games,
      upsets,
      upsetRate: upsets / games,
    });
  }
  return rows.sort(
    (a, b) => b.upsetRate - a.upsetRate || b.seedLow - a.seedLow,
  );
}

export interface SeasonUpsetRow {
  season: number;
  games: number;
  upsets: number;
  doubleDigitWins: number;
  /** Seeds 10-16 winning = the classic "double-digit seed" stat. */
  rate: number;
}

/** Per-season upset counts (double-digit seeds beating single-digit). */
export function seasonUpsetStats(games: NcaaGame[]): SeasonUpsetRow[] {
  const map = new Map<number, SeasonUpsetRow>();
  for (const g of games) {
    if (g.winnerSeed == null || g.loserSeed == null) continue;
    if (g.seedA == null && g.seedB == null) continue;
    const row =
      map.get(g.season) ??
      ({ season: g.season, games: 0, upsets: 0, doubleDigitWins: 0, rate: 0 } satisfies SeasonUpsetRow);
    row.games += 1;
    if (g.upset) row.upsets += 1;
    const losingSeedHigh = Math.max(g.winnerSeed, g.loserSeed);
    if (
      g.upset &&
      g.winnerSeed != null &&
      g.winnerSeed >= 10 &&
      g.winnerSeed <= 16 &&
      losingSeedHigh <= 16
    ) {
      row.doubleDigitWins += 1;
    }
    map.set(g.season, row);
  }
  const rows = [...map.values()].filter((r) => r.games > 0);
  for (const r of rows) r.rate = r.upsets / r.games;
  return rows.sort((a, b) => a.season - b.season);
}

export interface TitleContender {
  team: string;
  apps: number;
  wins: number;
  championships: number;
  runnerUps: number;
}

/** Final Four / title-game résumé per team. */
export function contenderResume(games: NcaaGame[]): TitleContender[] {
  const map = new Map<string, TitleContender>();
  const get = (team: string): TitleContender => {
    let row = map.get(team);
    if (!row) {
      row = { team, apps: 0, wins: 0, championships: 0, runnerUps: 0 };
      map.set(team, row);
    }
    return row;
  };
  for (const g of games) {
    const isFinalFour = g.round === "Final Four" || g.round === "Championship";
    if (!isFinalFour) continue;
    for (const team of [g.teamA, g.teamB]) get(team).apps += 1;
    get(g.winner).wins += 1;
    if (g.round === "Championship") {
      get(g.winner).championships += 1;
      get(g.loser).runnerUps += 1;
    }
  }
  return [...map.values()].sort(
    (a, b) =>
      b.championships - a.championships ||
      b.wins - a.wins ||
      b.apps - a.apps,
  );
}
