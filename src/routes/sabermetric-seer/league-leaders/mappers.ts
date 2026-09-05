/**
 * Shared transformation for MLB leaderboard responses: flatten the per-stat
 * group entries and coerce values for sorting/display. Used by both the
 * server `load` (default board) and client-side refetches (selectors).
 */
import type { Leader } from "./columns.js";

export interface RawLeaderEntry {
  statGroup?: string;
  leaders: Array<{
    rank: number;
    value: string;
    person?: { id: number; fullName: string };
    team?: { name: string };
    league?: { name: string };
  }>;
}

export function mapLeaders(
  entries: RawLeaderEntry[] | undefined,
  group: "hitting" | "pitching",
): Leader[] {
  return (entries ?? [])
    .filter((entry) => !entry.statGroup || entry.statGroup === group)
    .flatMap((entry) => entry.leaders ?? [])
    .map((l) => ({
      rank: l.rank,
      personId: l.person?.id ?? 0,
      player: l.person?.fullName ?? "Unknown",
      team: l.team?.name ?? "—",
      league: l.league?.name ?? "—",
      value: l.value,
      valueNum: Number.parseFloat(l.value) || 0,
    }));
}
