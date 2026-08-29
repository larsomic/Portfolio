import { createColumnHelper } from "@tanstack/svelte-table";
import type { DataTableFeatures } from "../../data-table-features.js";

export type TeamStanding = {
  teamId: number;
  teamName: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winningPct: string;
  streakCode: string;
  gamesBack: string | null;
  runDifferential: number;
};

const columnHelper = createColumnHelper<DataTableFeatures, TeamStanding>();

export const columns = columnHelper.columns([
  columnHelper.accessor("teamName", {
    header: "Team",
    enableSorting: true,
  }),
  columnHelper.accessor("wins", {
    header: "W",
    enableSorting: true,
  }),
  columnHelper.accessor("losses", {
    header: "L",
    enableSorting: true,
  }),
  columnHelper.accessor("winningPct", {
    header: "%",
    enableSorting: true,
  }),
  columnHelper.accessor("gamesBack", {
    header: "GB",
    enableSorting: false,
    cell: (context) => context.getValue() ?? "—",
  }),
  columnHelper.accessor("streakCode", {
    header: "Streak",
    enableSorting: false,
  }),
  columnHelper.accessor("runDifferential", {
    header: "RD",
    enableSorting: true,
    cell: (context) =>
      context.getValue() >= 0 ? `+${context.getValue()}` : context.getValue(),
  }),
]);
