import { createColumnHelper } from "@tanstack/svelte-table";
import type { DataTableFeatures } from "../../data-table-features.js";

export type Transaction = {
  id: number;
  personId: number | null;
  player: string;
  type: string;
  fromTeam: string | null;
  toTeam: string | null;
  date: string;
  description: string;
};

const columnHelper = createColumnHelper<DataTableFeatures, Transaction>();

export const columns = columnHelper.columns([
  columnHelper.accessor("player", {
    header: "Player",
    enableSorting: true,
  }),
  columnHelper.accessor("type", {
    header: "Type",
    enableSorting: true,
  }),
  columnHelper.accessor("fromTeam", {
    header: "From",
    enableSorting: true,
  }),
  columnHelper.accessor("toTeam", {
    header: "To",
    enableSorting: true,
  }),
  columnHelper.accessor("date", {
    header: "Date",
    enableSorting: true,
  }),
  columnHelper.accessor("description", {
    header: "Description",
    enableSorting: false,
  }),
]);
