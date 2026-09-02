/**
 * Shared types + helpers for the Sabermetric Seer "Games" page.
 *
 * Data source: statsapi.mlb.com (per Public-MLB-API docs).
 * `feed/live` is 404 on this public mirror, so we assemble game detail from
 * the dedicated endpoints documented in the repo:
 *   - /game/{pk}/boxscore      (VERIFIED)
 *   - /game/{pk}/linescore     (VERIFIED)
 *   - /game/{pk}/playByPlay    (scoring plays, at-st data)
 *   - /game/{pk}/winProbability
 *   - /game/{pk}/decisions     (may 404 — handled gracefully)
 */

export const STATS_API = "https://statsapi.mlb.com/api/v1";

export function teamLogo(teamId: number): string {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}

/* ---------------------------------- types --------------------------------- */

export interface PersonRef {
  id: number;
  fullName: string;
  link?: string;
  boxscoreName?: string;
}

export interface TeamRef {
  id: number;
  name: string;
  abbreviation?: string;
  teamName?: string;
  link?: string;
}

export interface LeagueRecord {
  wins: number;
  losses: number;
  winningPercentage?: string;
  winLossPercentage?: string;
}

export interface ProbablePitcher extends PersonRef {
  seasonStats?: Record<string, number | string> | null;
}

export interface ScheduleGame {
  gamePk: number;
  gameDate: string; // ISO
  season: string;
  gameType: string;
  status: {
    abstractGameState: "Preview" | "Live" | "Final" | "Complete" | string;
    detailedState: string;
    startTimeTBD?: boolean;
  };
  teams: {
    away: ScheduleTeamSide;
    home: ScheduleTeamSide;
  };
  venue?: { id?: number; name?: string; address?: { city?: string; state?: string } };
  doubleHeader?: string; // Y | N
  gameNumber?: number;
  seriesDescription?: string;
  gamesInSeries?: number;
  seriesGameNumber?: number;
  dayNight?: string;
  tiebreaker?: string;
  linescore?: Linescore | null;
}

/**
 * Schedule `teams.away` / `teams.home` entries: the team identity is nested
 * under `.team`; record/score/probable pitcher sit alongside it.
 */
export interface ScheduleTeamSide {
  team: TeamRef;
  leagueRecord?: LeagueRecord;
  probablePitcher?: PersonRef | null;
  score?: number;
  isWinner?: boolean;
}

export interface LinescoreInning {
  num: number;
  ordinalNum: string;
  away: { runs: number; hits: number; errors: number; leftOnBase: number };
  home: { runs: number; hits: number; errors: number; leftOnBase: number };
}

export interface Linescore {
  currentInning?: number;
  currentInningOrdinal?: string;
  inningState?: string; // "Top 4th, 1 Out"
  inningHalf?: string;
  isTopInning?: boolean;
  scheduledInnings?: number;
  innings: LinescoreInning[];
  teams: {
    away: { runs: number; hits: number; errors: number; leftOnBase: number };
    home: { runs: number; hits: number; errors: number; leftOnBase: number };
  };
  balls?: number;
  strikes?: number;
  outs?: number;
  offense?: {
    batter?: PersonRef;
    onDeck?: PersonRef;
    inHole?: PersonRef;
    first?: PersonRef;
    second?: PersonRef;
    third?: PersonRef;
    pitcher?: PersonRef;
    team?: TeamRef;
  };
  defense?: {
    pitcher?: PersonRef;
    catcher?: PersonRef;
    first?: PersonRef;
    second?: PersonRef;
    third?: PersonRef;
    shortstop?: PersonRef;
    leftField?: PersonRef;
    centerField?: PersonRef;
    rightField?: PersonRef;
    team?: TeamRef;
  };
}

export interface BoxscoreSide {
  team: TeamRef;
  teamStats: {
    batting: Record<string, string | number>;
    pitching: Record<string, string | number>;
    fielding: Record<string, string | number>;
  };
  players: Record<string, BoxscorePlayer>;
  batters: number[];
  pitchers: number[];
  bench?: number[];
  bullpen?: number[];
  battingOrder?: number[];
  info?: BoxscoreNoteGroup[];
  note?: string | null;
}

export interface BoxscorePlayer {
  person: PersonRef;
  jerseyNumber?: string;
  position?: { abbreviation?: string; name?: string; type?: string };
  status?: { code?: string; description?: string };
  battingOrder?: string; // "100" == leadoff, empty for non-starters/pitchers
  stats: {
    batting?: Record<string, string | number>;
    pitching?: Record<string, string | number>;
    fielding?: Record<string, string | number>;
  };
  seasonStats?: {
    batting?: Record<string, string | number>;
    pitching?: Record<string, string | number>;
  };
}

export interface BoxscoreNoteGroup {
  title?: string;
  label?: string;
  value: string;
  fieldList?: { label: string; value: string }[];
}

export interface BoxscoreResponse {
  teams: { away: BoxscoreSide; home: BoxscoreSide };
  officials?: { official: PersonRef; officialType: string }[];
  info?: BoxscoreNoteGroup[];
  pitchingNotes?: string | null;
  topPerformers?: {
    player: BoxscorePlayer & { person: PersonRef };
    gameStatus?: string;
    statistics: unknown[];
  }[];
}

export interface PlayMatchup {
  batter?: PersonRef;
  batSide?: { code?: string; description?: string };
  pitcher?: PersonRef;
  pitchHand?: { code?: string; description?: string };
}

export interface Play {
  result: {
    type?: string;
    event?: string;
    description?: string;
    rbi?: number;
    awayScore?: number;
    homeScore?: number;
    isOut?: boolean;
    wildPitch?: boolean;
    error?: boolean;
  };
  about: {
    atBatIndex?: number;
    halfInning?: string;
    inning?: number;
    isTopInning?: boolean;
    isScoringPlay?: boolean;
    startTime?: string;
  };
  count?: { balls?: number; strikes?: number; outs?: number };
  matchup?: PlayMatchup;
}

export interface WinProbPoint {
  about?: { inning?: number; halfInning?: string; isTopInning?: boolean };
  result?: { description?: string; event?: string };
  homeTeamWinProbability?: number;
  awayTeamWinProbability?: number;
  homeTeamWinProbabilityAdded?: number;
}

/* ------------------------------- fetch helpers ---------------------------- */

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    return null;
  }
}

export async function fetchSchedule(
  date: string, // YYYY-MM-DD
  signal?: AbortSignal,
): Promise<ScheduleGame[]> {
  const url = `${STATS_API}/schedule?sportId=1&date=${date}&hydrate=probablePitcher,team,linescore`;
  const data = await getJson<{ dates?: { games?: ScheduleGame[] }[] }>(url, signal);
  if (!data) throw new Error("Failed to reach the MLB schedule API");
  return data.dates?.flatMap((d) => d.games ?? []) ?? [];
}

export async function fetchBoxscore(pk: number, signal?: AbortSignal) {
  return getJson<BoxscoreResponse>(`${STATS_API}/game/${pk}/boxscore`, signal);
}

export async function fetchLinescore(pk: number, signal?: AbortSignal) {
  return getJson<Linescore>(`${STATS_API}/game/${pk}/linescore`, signal);
}

/**
 * On this API, `scoringPlays` is an array of integer indices into
 * `allPlays` (the docs claim play objects — it's neither documented nor
 * consistent), so we resolve indices and also tolerate full play objects.
 */
export async function fetchScoringPlays(pk: number, signal?: AbortSignal) {
  const data = await getJson<{
    scoringPlays?: (Play | number)[];
    allPlays?: Play[];
  }>(`${STATS_API}/game/${pk}/playByPlay`, signal);
  if (!data) return [];
  const all = data.allPlays ?? [];
  return (data.scoringPlays ?? [])
    .map((p) => (typeof p === "number" ? all[p] : p))
    .filter((p): p is Play => Boolean(p?.about && p?.result));
}

export async function fetchWinProbability(pk: number, signal?: AbortSignal) {
  const data = await getJson<WinProbPoint[]>(
    `${STATS_API}/game/${pk}/winProbability`,
    signal,
  );
  return data ?? [];
}

export async function fetchDecisions(pk: number, signal?: AbortSignal) {
  return getJson<{
    winner?: BoxscorePlayer;
    loser?: BoxscorePlayer;
    save?: BoxscorePlayer;
    intermediateWinners?: unknown[];
  }>(`${STATS_API}/game/${pk}/decisions`, signal);
}

/** Season stats for one player (tries pitching then hitting group). */
export async function fetchPlayerSeasonStats(
  personId: number,
  season: string | number,
  signal?: AbortSignal,
): Promise<{ group: string; stats: Record<string, string | number> } | null> {
  for (const group of ["pitching", "hitting"]) {
    const data = await getJson<{
      stats?: { splits?: { statistics?: Record<string, string | number> }[] }[];
    }>(
      `${STATS_API}/people/${personId}/stats?stats=season&season=${season}&group=${group}`,
      signal,
    );
    const stats = data?.stats?.[0]?.splits?.[0]?.statistics;
    if (stats && Object.keys(stats).length > 3) return { group, stats };
  }
  return null;
}

/* --------------------------------- helpers -------------------------------- */

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

/** "Top 8th, 2 outs" — robust to inningState being just "Top"/"Bottom". */
export function liveInningLabel(ls?: Linescore | null): string {
  if (!ls) return "";
  const half = ls.isTopInning ? "Top" : "Bottom";
  const inn =
    ls.currentInningOrdinal ??
    (ls.currentInning != null ? ordinal(ls.currentInning) : "");
  const label = `${half}${inn ? ` ${inn}` : ""}`;
  const outs = ls.outs ?? 0;
  if (!label.trim() && !outs) return "";
  return [label.trim(), `${outs} out${outs === 1 ? "" : "s"}`]
    .filter(Boolean)
    .join(", ");
}

export function formatGameTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function handOf(code?: string): string {
  if (!code) return "";
  const c = code.toUpperCase();
  return c.startsWith("R") ? "RHP" : c.startsWith("L") ? "LHP" : "";
}

/** Sort key so Live games float first, then Preview by start time, then Final. */
export function statusSort(g: ScheduleGame): [number, number] {
  const t = new Date(g.gameDate).getTime();
  switch (g.status.abstractGameState) {
    case "Live":
      return [0, -t];
    case "Final":
    case "Complete":
      return [2, -t];
    default:
      return [1, t];
  }
}

export function isLive(g: ScheduleGame): boolean {
  return g.status.abstractGameState === "Live";
}

export function isPlayable(g: ScheduleGame): boolean {
  const s = g.status.abstractGameState;
  return s === "Live" || s === "Final" || s === "Complete";
}

/** Detect no-hitter / perfect-game from boxscore team hitting totals. */
export function detectNoHitters(box: BoxscoreResponse): string[] {
  const flags: string[] = [];
  for (const side of ["away", "home"] as const) {
    const opp = side === "away" ? "home" : "away";
    const batting = box.teams[side].teamStats.batting;
    const hits = Number(batting.hits ?? -1);
    if (hits !== 0) continue;
    // Did the opponent throw it, or was it combined? Check pitching of opp pitchers later —
    // simplest robust signal: hits allowed by the *other* side.
    const oppHits = Number(box.teams[opp].teamStats.batting.hits ?? -1);
    const baseLabel = `${box.teams[side].team.name} were no-hit`;
    if (
      Number(batting.baseOnBalls ?? 0) === 0 &&
      Number(batting.hitByPitch ?? 0) === 0 &&
      Number(box.teams[opp].teamStats.fielding.errors ?? 0) === 0 &&
      Number(batting.leftOnBase ?? 0) === 0 &&
      oppHits > 0
    ) {
      flags.push(`PERFECT GAME — ${box.teams[side].team.name} retired 27 in a row!`);
    } else if (oppHits > 0) {
      flags.push(`COMBINED NO-HITTER — ${baseLabel} (multiple pitchers)`);
    } else {
      flags.push(`NO-HITTER — ${box.teams[side].team.name} pitched a no-hitter!`);
    }
  }
  return flags;
}
