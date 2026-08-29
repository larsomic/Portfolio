import { createColumnHelper } from "@tanstack/svelte-table";
import type { DataTableFeatures } from "../../data-table-features.js";

export type Leader = {
  rank: number;
  personId: number;
  player: string;
  team: string;
  league: string;
  value: string;
  valueNum: number;
};

const columnHelper = createColumnHelper<DataTableFeatures, Leader>();

export const columns = columnHelper.columns([
  columnHelper.accessor("rank", {
    header: "Rank",
    enableSorting: true,
  }),
  columnHelper.accessor("player", {
    header: "Player",
    enableSorting: true,
  }),
  columnHelper.accessor("team", {
    header: "Team",
    enableSorting: true,
  }),
  columnHelper.accessor("league", {
    header: "League",
    enableSorting: true,
  }),
  columnHelper.accessor((row) => row.valueNum, {
    id: "value",
    header: "Value",
    enableSorting: true,
    // Display the formatted string (e.g. ".301") but sort numerically
    cell: (context) => context.row.original.value,
  }),
]);
