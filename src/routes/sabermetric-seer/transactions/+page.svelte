<script lang="ts">
  import { ChevronDown } from "lucide-svelte";
  import {
    getLocalTimeZone,
    today,
    type CalendarDate,
  } from "@internationalized/date";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import Calendar from "$lib/components/ui/calendar/calendar.svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { browser } from "$app/environment";
  import DataTable from "../../data-table.svelte";
  import { columns } from "./columns.js";

  interface MlbPerson {
    id: number;
    link: string;
    fullName: string;
  }

  interface MlbTransactionResponse {
    transactions: Array<{
      id: number;
      person: MlbPerson;
      typeCode: string;
    }>;
  }

  const id = $props.id();

  let open = $state(false);
  let value = $state<CalendarDate>(today(getLocalTimeZone()));

  let transactionData = $state<MlbTransactionResponse>({ transactions: [] });
  let loading = $state(false);
  let error = $state(false);

  function fetchTransactions() {
    if (!browser) return;
    loading = true;

    const controller = new AbortController();

    fetch(
      `https://statsapi.mlb.com/api/v1/transactions?startDate=${value.year}-${value.month}-${value.day}&endDate=${value.year}-${value.month}-${value.day}`,
      { signal: controller.signal },
    )
      .then((res) => res.json())
      .then((data) => {
        transactionData = data;
        loading = false;
      })
      .catch((err) => {
        error = true;
        if (err.name !== "AbortError") loading = false;
      });

    return () => controller.abort();
  }
</script>

<div>
  <h1>View all MLB Transactions for a given day</h1>
  <div class="flex flex-col gap-3">
    <Label for="{id}-date" class="px-1">Date of transaction</Label>
    <Popover.Root bind:open>
      <Popover.Trigger id="{id}-date">
        {#snippet child({ props })}
          <Button
            {...props}
            variant="outline"
            class="w-48 justify-between font-normal"
          >
            {value
              ? value.toDate(getLocalTimeZone()).toLocaleDateString()
              : "Select date"}
            <ChevronDown />
          </Button>
        {/snippet}
      </Popover.Trigger>
      <Popover.Content class="w-auto overflow-hidden p-0" align="start">
        <Calendar
          type="single"
          bind:value
          captionLayout="dropdown"
          onValueChange={() => {
            fetchTransactions();
            open = false;
          }}
          maxValue={today(getLocalTimeZone())}
        />
      </Popover.Content>
    </Popover.Root>
  </div>
  {#if loading && !error}<p>Loading data...</p>
  {:else if transactionData != null}
    <h1>Transactions</h1>
    <DataTable data={[{ id: "1", name: "mike" }]} {columns} />

    {#each transactionData?.transactions as transaction}
      {#if transaction.person}
        <a href={`https://statsapi.mlb.com/${transaction.person.link}`}
          >{transaction.person.fullName}</a
        >
      {/if}
    {/each}
  {/if}
</div>
