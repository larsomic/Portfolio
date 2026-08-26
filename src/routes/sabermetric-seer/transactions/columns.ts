import { createColumnHelper } from "@tanstack/svelte-table";
import type { DataTableFeatures } from "../../data-table-features.js"

export type Player = {
 id: string;
 name: string;
};
 
const columnHelper = createColumnHelper<DataTableFeatures, Player>();
 
export const columns = columnHelper.columns([
 columnHelper.accessor("name", {
  header: "Name",
 })
]);