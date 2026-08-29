<script lang="ts">
  import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
  } from "lucide-svelte";
  import {
    CalendarDate,
    getLocalTimeZone,
    today,
    type CalendarDate as CalendarDateType,
  } from "@internationalized/date";
  import { browser } from "$app/environment";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import Calendar from "$lib/components/ui/calendar/calendar.svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import DataTable from "../../data-table.svelte";
  import { columns, type Transaction } from "./columns.js";

  interface MlbTeamRef {
    id: number;
    name?: string;
    link: string;
  }

  interface MlbTransactionRaw {
    id: number;
    person?: { id: number; fullName: string; link: string };
    typeCode?: string;
    typeDesc?: string;
    fromTeam?: MlbTeamRef;
    toTeam?: MlbTeamRef;
    date?: string;
    description?: string;
  }

  interface MlbTransactionsResponse {
    transactions: MlbTransactionRaw[];
  }

  const API_BASE = "https://statsapi.mlb.com/api/v1/transactions";

  const id = $props.id();

  const maxDate = today(getLocalTimeZone());

  let open = $state(false);
  let selectedDate = $state<CalendarDateType>(maxDate);

  let transactions = $state<Transaction[]>([]);
  // Start as loading so SSR shows the skeleton until data arrives
  let loading = $state(true);
  let errorMessage = $state<string | null>(null);

  let activeController: AbortController | null = null;

  function fetchTransactions() {
    if (!browser || !selectedDate) return;

    // Cancel any in-flight request so rapid date changes don't race
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;

    loading = true;
    errorMessage = null;

    const dateParam = selectedDate.toString();

    fetch(`${API_BASE}?date=${dateParam}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        return res.json() as Promise<MlbTransactionsResponse>;
      })
      .then((data) => {
        const seen: Record<number, true> = {};
        transactions = (data.transactions ?? [])
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
            date: t.date ?? dateParam,
            description: t.description ?? "",
          }));
        loading = false;
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        errorMessage = "Failed to load transactions. Please try again.";
        loading = false;
      });
  }

  // Fetch whenever the selected date changes (and once on mount in the browser)
  $effect(() => {
    void selectedDate;
    if (browser) fetchTransactions();
  });

  function previousDay() {
    if (!selectedDate) return;
    selectedDate = selectedDate.subtract({ days: 1 });
  }

  function nextDay() {
    if (!selectedDate || selectedDate.compare(maxDate) >= 0) return;
    selectedDate = selectedDate.add({ days: 1 });
  }

  const isToday = $derived(
    selectedDate != null && selectedDate.compare(maxDate) === 0,
  );
</script>

<svelte:head>
  <title>MLB Transactions | Sabermetric Seer</title>
</svelte:head>

<div class="flex flex-col gap-4">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">MLB Transactions</h1>
    <p class="text-muted-foreground">
      All MLB transactions for
      {selectedDate
        ? selectedDate
            .toDate(getLocalTimeZone())
            .toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
        : "a given day"}
    </p>
  </div>

  <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
    <div class="flex flex-col gap-3">
      <Label for="{id}-date" class="px-1">Date of transactions</Label>
      <Popover.Root bind:open>
        <Popover.Trigger id="{id}-date">
          {#snippet child({ props })}
            <Button
              {...props}
              variant="outline"
              class="w-48 justify-between font-normal"
            >
              {selectedDate
                ? selectedDate.toDate(getLocalTimeZone()).toLocaleDateString()
                : "Select date"}
              <ChevronDown />
            </Button>
          {/snippet}
        </Popover.Trigger>
        <Popover.Content class="w-auto overflow-hidden p-0" align="start">
          <Calendar
            type="single"
            bind:value={selectedDate}
            captionLayout="dropdown"
            maxValue={maxDate}
            minValue={new CalendarDate(1901, 1, 1)}
            onValueChange={() => {
              // Keep the picker from clearing the selection entirely
              if (!selectedDate) selectedDate = maxDate;
              open = false;
            }}
          />
        </Popover.Content>
      </Popover.Root>
    </div>

    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onclick={previousDay}
        title="Previous day"
        disabled={loading}
      >
        <ChevronLeft />
        <span class="sr-only">Previous day</span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        onclick={nextDay}
        title="Next day"
        disabled={loading || isToday}
      >
        <ChevronRight />
        <span class="sr-only">Next day</span>
      </Button>
      <Button
        variant="secondary"
        onclick={fetchTransactions}
        disabled={loading}
      >
        <RefreshCw />
        Refresh
      </Button>
    </div>
  </div>

  {#if loading}
    <div class="space-y-2">
      {#each [1, 2, 3, 4, 5, 6, 7, 8] as row (row)}
        <Skeleton class="h-10 w-full" />
      {/each}
    </div>
  {:else if errorMessage}
    <div class="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
      {errorMessage}
    </div>
  {:else}
    <p class="text-sm text-muted-foreground">
      {transactions.length} transaction{transactions.length === 1 ? "" : "s"}
      found
    </p>
    <DataTable data={transactions} {columns} />
  {/if}
</div>
