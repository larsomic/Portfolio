<script lang="ts">
  async function loadItems() {
    const res = await fetch(
      "https://statsapi.mlb.com/api/v1/standings?leagueId=103&season=2026&standingsTypes=regularSeason&date=2026-08-18",
    );
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  }

  let itemsPromise = loadItems();

  let divisionMapping: Record<string, string> = {
    "200": "West",
    "201": "East",
    "202": "Central",
  };
</script>

<!-- https://statsapi.mlb.com/api/v1/transactions?startDate=2026-08-19&endDate=2026-08-19 -->

{#await itemsPromise}
  <p>Loading data...</p>
{:then items}
  <h1>American League</h1>
  <ul>
    {#each items.records as division}
      <h2>{divisionMapping[division.division.id as string]}</h2>

      {#each division.teamRecords as teams}
        <h3>{teams.team.name}</h3>
        {teams.runsAllowed}
        {teams.runsScored}
        {teams.runDifferential}
        {teams.leagueRecord.wins}
        {teams.leagueRecord.losses}
        {teams.streak.streakCode}
      {/each}
    {/each}
  </ul>
{:catch error}
  <p>Something went wrong: {error.message}</p>
{/await}
