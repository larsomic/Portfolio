/**
 * Shared Sleeper API helpers for the fantasy football pages.
 *
 * Docs: https://docs.sleeper.com/ — base URL https://api.sleeper.app/v1
 *
 * This league is a keeper league that is recreated each year, so every season
 * lives in its own league id chained backwards via `previous_league_id`.
 * Past seasons therefore need their own league id, and player names come from
 * the big `/players/nfl` map (rosters only store player ids).
 */

export const LEAGUE_ID = "1388688821515751424";

const API_BASE = "https://api.sleeper.app/v1";

export async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function leagueUrl(leagueId: string): string {
  return `${API_BASE}/league/${leagueId}`;
}

export function membersUrl(): string {
  return `${API_BASE}/league/${LEAGUE_ID}/users`;
}

export function usersForLeagueUrl(leagueId: string): string {
  return `${API_BASE}/league/${leagueId}/users`;
}

/** Matchups (lineups + scores) for one week of one league instance. */
export function matchupsUrl(leagueId: string, week: number): string {
  return `${API_BASE}/league/${leagueId}/matchups/${week}`;
}

export function nflStateUrl(): string {
  return `${API_BASE}/state/nfl`;
}

/** Rosters for one league instance (one season). Past = final state. */
export function rostersUrl(leagueId: string): string {
  return `${API_BASE}/league/${leagueId}/rosters`;
}

// ---------- League & seasons ----------

export interface SleeperLeague {
  league_id?: string;
  name?: string;
  season?: string;
  status?: string;
  previous_league_id?: string | null;
}

/** One year of league history: the season plus its dedicated league id. */
export interface SeasonEntry {
  season: string;
  leagueId: string;
}

/**
 * Walk the `previous_league_id` chain from the current league backwards, so
 * we know which league id holds each historical season's data.
 */
export async function buildSeasonHistory(): Promise<{
  name: string;
  seasons: SeasonEntry[];
}> {
  const seasons: SeasonEntry[] = [];
  let leagueId: string | null = LEAGUE_ID;
  let name = "";

  // The chain is a handful of sequential requests; cap it defensively.
  for (let i = 0; i < 12 && leagueId; i++) {
    const league: SleeperLeague | null = await fetchJson<SleeperLeague>(
      leagueUrl(leagueId),
    );
    if (!league) break;
    name ||= league.name ?? "";
    seasons.push({
      season: league.season ?? String(new Date().getFullYear()),
      leagueId,
    });
    const prev: string | null | undefined = league.previous_league_id;
    leagueId = prev && prev !== "-1" ? String(prev) : null;
  }

  return { name, seasons };
}

// ---------- Members ----------

export interface RawLeagueUser {
  user_id: string;
  avatar?: string | null;
  display_name?: string;
  metadata?: {
    avatar?: string | null;
    /** Intentionally never displayed — team names can be spicy. */
    team_name?: string;
  };
}

export interface LeagueMember {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

function resolveAvatar(
  user: RawLeagueUser,
): string | null {
  // Custom uploads come as full URLs in metadata; plain values are CDN hashes.
  const meta = user.metadata?.avatar;
  if (meta) return meta.startsWith("http") ? meta : `https://sleepercdn.com/images/avatars/${meta}`;
  const hash = user.avatar;
  if (hash) return `https://sleepercdn.com/images/avatars/${hash}`;
  return null;
}

export function parseMembers(raw: RawLeagueUser[] | null): LeagueMember[] {
  if (!raw) return [];
  return raw
    .map((user) => ({
      userId: user.user_id,
      displayName: user.display_name ?? "Unknown",
      avatarUrl: resolveAvatar(user),
    }))
    // Sort case-insensitively so the grid reads like a roster sheet.
    .sort((a, b) =>
      a.displayName.localeCompare(b.displayName, undefined, {
        sensitivity: "base",
      }),
    );
}

// ---------- NFL state & matchups ----------

export interface NflState {
  week?: number;
  season?: string;
  season_type?: string;
  season_start_date?: string;
}

export interface SleeperMatchup {
  roster_id: number;
  matchup_id?: number;
  points?: number | null;
  custom_points?: number | null;
  players?: string[];
  starters?: string[];
  starters_points?: (number | null)[] | null;
  players_points?: Record<string, number> | null;
}

// ---------- Rosters & players ----------

export interface SleeperRoster {
  roster_id: number;
  owner_id?: string | null;
  players?: string[];
  starters?: string[];
  settings?: {
    wins?: number;
    losses?: number;
    ties?: number;
    ppf?: number;
    fpts?: number;
  };
}

export interface RawPlayer {
  full_name?: string;
  position?: string;
  team?: string | null;
  injury_status?: string | null;
}

export type PlayerMap = Record<string, RawPlayer>;

export interface RosterPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  injuryStatus?: string | null;
}

export interface SeasonRoster {
  players: RosterPlayer[];
  wins: number | null;
  losses: number | null;
  ties: number | null;
  pointsFor: number | null;
}

// The full NFL player map is a few MB, so fetch it at most once per session.
let playersPromise: Promise<PlayerMap> | null = null;

export function loadPlayerMap(): Promise<PlayerMap> {
  playersPromise ??= fetchJson<PlayerMap>(`${API_BASE}/players/nfl`).then(
    (map) => map ?? {},
  );
  return playersPromise;
}

export const POSITION_ORDER = ["QB", "RB", "WR", "TE", "K", "DEF"];

export function positionRank(position: string): number {
  const index = POSITION_ORDER.indexOf(position);
  return index === -1 ? POSITION_ORDER.length : index;
}

/**
 * Resolve one player id against the global map. Defense/squad slots are
 * stored as three-letter team codes and may be missing from the map.
 */
export function resolvePlayer(id: string, playerMap: PlayerMap): RosterPlayer {
  const info = playerMap[id];
  if (info) {
    return {
      id,
      name: info.full_name ?? `Player #${id}`,
      position: info.position ?? "?",
      team: info.team ?? "",
      injuryStatus: info.injury_status ?? null,
    };
  }
  const isDefense = /^[A-Z]{3}$/.test(id);
  return {
    id,
    name: isDefense ? "Defense / Squad" : `Player #${id}`,
    position: isDefense ? "DEF" : "?",
    team: "",
    injuryStatus: null,
  };
}

/**
 * Flatten one owner's roster for a season into display-ready players.
 */
export function parseSeasonRoster(
  rosters: SleeperRoster[] | null,
  ownerId: string,
  playerMap: PlayerMap,
): SeasonRoster | null {
  if (!rosters) return null;
  const roster = rosters.find((r) => r.owner_id === ownerId);
  if (!roster) return null;

  // "0" entries are placeholder empty slots (pre-draft rosters).
  const ids = (roster.players ?? []).filter((id) => id && id !== "0");
  const players: RosterPlayer[] = ids.map((id) =>
    resolvePlayer(id, playerMap),
  );

  players.sort((a, b) => {
    const rank = positionRank(a.position) - positionRank(b.position);
    if (rank !== 0) return rank;
    return a.name.localeCompare(b.name);
  });

  const settings = roster.settings ?? {};
  return {
    players,
    wins: settings.wins ?? null,
    losses: settings.losses ?? null,
    ties: settings.ties ?? null,
    pointsFor: settings.ppf ?? settings.fpts ?? null,
  };
}
