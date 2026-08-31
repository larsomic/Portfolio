/**
 * Per-team NFL game status for a given season/week.
 *
 * Sleeper doesn't expose game start times or live states, so we lean on the
 * public ESPN scoreboard (CORS enabled) for one query per selected week:
 * every fantasy week runs Thursday through the following Wednesday, and
 * Week 1's Thursday is the Thursday of the Mon-Sun week containing Sep 6 —
 * which matches the NFL opener Thursday for every recent season.
 */

export type GameStatus = "pre" | "live" | "final";

export interface TeamGame {
  status: GameStatus;
  /** e.g. "Q4 2:12" or final detail, when useful. */
  detail?: string;
}

const SCOREBOARD_BASE =
  "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

const DAY_MS = 86_400_000;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatUTC(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

/**
 * Thursday of the week containing the first Monday in September (Labor Day
 * week). Matches the NFL opener Thursday for every recent season.
 */
export function weekOneThursday(seasonYear: number): Date {
  const sep1 = new Date(Date.UTC(seasonYear, 8, 1));
  // getUTCDay(): Sunday=0..Saturday=6, so Monday is 1.
  const daysUntilMonday = (8 - sep1.getUTCDay()) % 7;
  const laborDay = new Date(sep1.getTime() + daysUntilMonday * DAY_MS);
  return new Date(laborDay.getTime() + 3 * DAY_MS);
}

/** [start, end] as YYYYMMDD strings covering the given fantasy week. */
export function weekDateRange(
  seasonYear: number,
  week: number,
): { start: string; end: string } {
  const thursday = new Date(weekOneThursday(seasonYear).getTime());
  thursday.setUTCDate(thursday.getUTCDate() + (week - 1) * 7);
  const wednesday = new Date(thursday.getTime() + 6 * DAY_MS);
  return { start: formatUTC(thursday), end: formatUTC(wednesday) };
}

/** ESPN and Sleeper disagree on the Commanders' abbreviation. */
function normalizeTeam(abbr: string): string {
  if (abbr === "WSH") return "WAS";
  return abbr;
}

function mapStatus(statusName: string | undefined): GameStatus {
  switch (statusName) {
    case "STATUS_IN_PROGRESS":
    case "STATUS_SUSPENDED":
    case "STATUS_DELAYED":
      return "live";
    case "STATUS_FINAL":
    case "STATUS_END_OF_GAME":
    case "STATUS_COMPLETED":
    case "STATUS_ABANDONED":
    case "STATUS_CANCELED":
      return "final";
    default:
      // STATUS_SCHEDULED, STATUS_TENTATIVE, anything unexpected.
      return "pre";
  }
}

/**
 * Fetch game state for every team playing in the given season/week.
 * Returns an empty map for future weeks (ESPN has no events yet) — callers
 * should treat missing teams as "not started".
 */
export async function fetchWeekGames(
  seasonYear: number,
  week: number,
): Promise<Map<string, TeamGame>> {
  const games = new Map<string, TeamGame>();
  const { start, end } = weekDateRange(seasonYear, week);

  let payload: EspnScoreboard | null = null;
  try {
    const res = await fetch(`${SCOREBOARD_BASE}?dates=${start}-${end}`);
    if (res.ok) payload = (await res.json()) as EspnScoreboard;
  } catch {
    return games;
  }

  for (const event of payload?.events ?? []) {
    const competition = event.competitions?.[0];
    if (!competition) continue;
    const status = mapStatus(competition.status?.type?.name);
    const detail = competition.status?.type?.shortDetail as string | undefined;
    for (const competitor of competition.competitors ?? []) {
      const abbr = competitor.team?.abbreviation;
      if (!abbr) continue;
      games.set(normalizeTeam(abbr), { status, detail });
    }
  }

  return games;
}

interface EspnScoreboard {
  events?: Array<{
    competitions?: Array<{
      status?: {
        type?: { name?: string; shortDetail?: string };
      };
      competitors?: Array<{
        team?: { abbreviation?: string };
      }>;
    }>;
  }>;
}
