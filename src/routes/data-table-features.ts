import {
 columnFilteringFeature,
 columnVisibilityFeature,
 createFilteredRowModel,
 createSortedRowModel,
 filterFn_includesString,
 rowSelectionFeature,
 rowSortingFeature,
 sortFn_alphanumeric,
 sortFn_text,
 tableFeatures,
} from "@tanstack/svelte-table";
 
export const features = tableFeatures({
 columnFilteringFeature,
 columnVisibilityFeature,
 rowSelectionFeature,
 rowSortingFeature,
 filteredRowModel: createFilteredRowModel(),
 sortedRowModel: createSortedRowModel(),
 filterFns: { includesString: filterFn_includesString },
 sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});
 
export type DataTableFeatures = typeof features;
