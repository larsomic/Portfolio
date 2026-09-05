/**
 * Shared transformation for the MLB transactions feed: dedupe by id and
 * flatten the raw API shape into display-ready rows. Used by both the
 * server `load` (initial day) and client-side refetches (date picker).
 */
import type { Transaction } from "./columns.js";

export interface MlbTeamRef {
  id: number;
  name?: string;
  link: string;
}

export interface MlbTransactionRaw {
  id: number;
  person?: { id: number; fullName: string; link: string };
  typeCode?: string;
  typeDesc?: string;
  fromTeam?: MlbTeamRef;
  toTeam?: MlbTeamRef;
  date?: string;
  description?: string;
}

export interface MlbTransactionsResponse {
  transactions: MlbTransactionRaw[];
}

export function mapTransactions(
  data: MlbTransactionsResponse,
  fallbackDate: string,
): Transaction[] {
  const seen: Record<number, true> = {};
  return (data.transactions ?? [])
    .filter((t) => {
      if (seen[t.id]) return false;
      seen[t.id] = true;
      return true;
    })
    .map((t) => ({
      id: t.id,
      personId: t.person?.id ?? null,
      player: t.person?.fullName ?? "Unknown",
      type: t.typeDesc ?? t.typeCode ?? "—",
      fromTeam: t.fromTeam?.name ?? null,
      toTeam: t.toTeam?.name ?? null,
      date: t.date ?? fallbackDate,
      description: t.description ?? "",
    }));
}
