import { error } from "@sveltejs/kit";
import type { Load } from "@sveltejs/kit";
import { getLocalTimeZone, today } from "@internationalized/date";

import {
  mapTransactions,
  type MlbTransactionsResponse,
} from "./mappers.js";

const API_BASE = "https://statsapi.mlb.com/api/v1/transactions";

export const load = (async ({ setHeaders }) => {
  const dateParam = today(getLocalTimeZone()).toString();

  let payload: MlbTransactionsResponse;
  try {
    const res = await fetch(`${API_BASE}?date=${dateParam}`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    payload = (await res.json()) as MlbTransactionsResponse;
  } catch {
    throw error(502, "Failed to load transactions from the MLB Stats API.");
  }

  // Today's wire is fine to serve from cache for a few minutes.
  setHeaders({ "cache-control": "public, max-age=120" });

  return { transactions: mapTransactions(payload, dateParam), date: dateParam };
}) satisfies Load;
