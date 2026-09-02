<script lang="ts">
    import * as d3Scale from "d3-scale";
  import { IconFlag, IconTrophy } from "@tabler/icons-svelte";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import {
    detectNoHitters,
    fetchBoxscore,
    fetchDecisions,
    fetchLinescore,
    fetchPlayerSeasonStats,
    fetchScoringPlays,
    fetchWinProbability,
    isLive,
    liveInningLabel,
    teamLogo,
    type BoxscoreNoteGroup,
    type BoxscorePlayer,
    type BoxscoreResponse,
    type BoxscoreSide,
    type Linescore,
    type Play,
    type ScheduleGame,
    type WinProbPoint,
  } from "$lib/mlb-games.js";

  let { game }: { game: ScheduleGame } = $props();

  const season = $derived(game.season);
  const playable = $derived(game.status.abstractGameState !== "Preview");

  let box = $state<BoxscoreResponse | null>(null);
  let line = $state<Linescore | null>(null);
  let scoringPlays = $state<Play[]>([]);
  let winProb = $state<WinProbPoint[]>([]);
  let decisions = $state<{
    winner?: BoxscorePlayer;
    loser?: BoxscorePlayer;
    save?: BoxscorePlayer;
  } | null>(null);
  let probables = $state<
    {
      side: "away" | "home";
      id: number;
      name: string;
      group: string;
      stats: Record<string, string | number>;
    }[]
  >([]);

  let loading = $state(true);
  let tick = $state(0);
  let controller: AbortController | null = null;

  async function load() {
    controller?.abort();
    const c = new AbortController();
    controller = c;
    loading = true;
    try {
      if (playable) {
        const [b, l, sp, wp] = await Promise.all([
          fetchBoxscore(game.gamePk, c.signal),
          fetchLinescore(game.gamePk, c.signal),
          fetchScoringPlays(game.gamePk, c.signal),
          fetchWinProbability(game.gamePk, c.signal),
        ]);
        box = b;
        line = l;
        scoringPlays = sp;
        winProb = wp;
        decisions = isLive(game)
          ? null
          : await fetchDecisions(game.gamePk, c.signal);
      } else {
        const pairs: { id?: number; side: "away" | "home"; name?: string }[] = [
          {
            id: game.teams.away.probablePitcher?.id,
            side: "away",
            name: game.teams.away.probablePitcher?.fullName,
          },
          {
            id: game.teams.home.probablePitcher?.id,
            side: "home",
            name: game.teams.home.probablePitcher?.fullName,
          },
        ];
        const results = await Promise.all(
          pairs.map(async ({ id, side, name }) => {
            if (!id) return null;
            const r = await fetchPlayerSeasonStats(id, season, c.signal);
            if (!r) return null;
            return { side, id, name: name ?? "Probable pitcher", ...r };
          }),
        );
        probables = results.filter(Boolean) as typeof probables;
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") throw err;
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    void game.gamePk;
    void game.gameDate;
    void game.status.detailedState;
    void tick;
    if (
      playable ||
      game.teams.away.probablePitcher ||
      game.teams.home.probablePitcher
    ) {
      void load();
    } else {
      loading = false;
    }
  });

  // Poll while the game is live so scores, lines and win-prob stay fresh.
  $effect(() => {
    const poll = setInterval(() => {
      if (isLive(game)) tick++;
    }, 45_000);
    return () => clearInterval(poll);
  });

  /* ------------------------------ derived views ---------------------------- */

  const noHitterFlags = $derived(box ? detectNoHitters(box) : []);
  const awaySide = $derived(box?.teams.away ?? null);
  const homeSide = $derived(box?.teams.home ?? null);

  function num(v: unknown, dflt = 0): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : dflt;
  }

  function battersOf(side: BoxscoreSide | null): BoxscorePlayer[] {
    if (!side) return [];
    const order = side.battingOrder ?? side.batters;
    return order
      .filter((id) => id !== 0 && !side.pitchers.includes(id))
      .map((id) => side.players[`ID${id}`])
      .filter(Boolean);
  }

  function pitchersOf(side: BoxscoreSide | null): BoxscorePlayer[] {
    if (!side) return [];
    return (side.pitchers ?? [])
      .map((id) => side.players[`ID${id}`])
      .filter(
        (p) => p && Object.keys(p.stats?.pitching ?? {}).length > 0,
      );
  }


  /** Top game batters by total bases. */
  function leaders(side: BoxscoreSide | null): BoxscorePlayer[] {
    return [...battersOf(side)]
      .sort(
        (a, b) =>
          num(b.stats?.batting?.totalBases) -
            num(a.stats?.batting?.totalBases) ||
          num(b.stats?.batting?.hits) - num(a.stats?.batting?.hits),
      )
      .slice(0, 3);
  }

  function topArm(side: BoxscoreSide | null): BoxscorePlayer | undefined {
    return [...pitchersOf(side)]
      .filter((p) => num(p.stats?.pitching?.inningsPitched) > 0)
      .sort(
        (a, b) =>
          num(b.stats?.pitching?.inningsPitched) -
          num(a.stats?.pitching?.inningsPitched),
      )[0];
  }


  /* ----------------------------- win-prob chart ---------------------------- */

  const CHART_W = 640;
  const CHART_H = 170;

  const wpSeries = $derived.by(() => {
    const pts = winProb.filter((p) => p.homeTeamWinProbability != null);
    if (pts.length < 2) return null;
    const x = d3Scale
      .scaleLinear()
      .domain([0, pts.length - 1])
      .range([8, CHART_W - 8]);
    const y = d3Scale
      .scaleLinear()
      .domain([0, 100])
      .range([CHART_H - 14, 14]);
    const lineGen = pts
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.homeTeamWinProbability!).toFixed(1)}`,
      )
      .join(" ");
    const areaGen = `${lineGen} L${x(pts.length - 1).toFixed(1)},${CHART_H - 14} L${x(0).toFixed(1)},${CHART_H - 14} Z`;
    let extreme = { v: 50, i: 0 };
    pts.forEach((p, i) => {
      if (Math.abs(p.homeTeamWinProbability! - 50) > Math.abs(extreme.v - 50))
        extreme = { v: p.homeTeamWinProbability!, i };
    });
    const last = pts[pts.length - 1];
    return {
      lineGen,
      areaGen,
      y,
      lastHome: last.homeTeamWinProbability!,
      lastAway:
        last.awayTeamWinProbability ?? 100 - last.homeTeamWinProbability!,
      extreme,
      extremeX: x(extreme.i),
    };
  });

  /* ---------------------------- notes / game info -------------------------- */

  const gameNotes = $derived.by(() => {
    if (!box?.info) return [] as { label: string; value: string }[];
    const out: { label: string; value: string }[] = [];
    for (const group of box.info) {
      if (group.fieldList) {
        for (const f of group.fieldList) out.push({ ...f });
      } else if (group.label) {
        out.push({ label: group.label, value: group.value });
      } else if (group.title) {
        out.push({ label: group.title.replace(/:$/, ""), value: "" });
      }
    }
    return out;
  });

  const crew = $derived(box?.officials ?? []);

  function notesFor(side: BoxscoreSide | null): string[] {
    if (!side?.info) return [];
    const out: string[] = [];
    for (const g of side.info) {
      const items: BoxscoreNoteGroup[] = g.fieldList
        ? g.fieldList.map((f) => ({ label: f.label, value: f.value }))
        : [g];
      for (const item of items) {
        if (!item.label && !item.value) continue;
        out.push(`${item.label ? `${item.label}: ` : ""}${item.value}`);
      }
    }
    return out;
  }


  const ipFmt = (v: unknown) => String(v ?? "0");

  /* --------- typed side entries so #each blocks infer correctly ---------- */

  interface LineSideEntry {
    key: "away" | "home";
    data: BoxscoreSide;
  }

  const sidesForLinescore = $derived.by<LineSideEntry[]>(() => {
    if (!box) return [];
    return [
      { key: "away", data: box.teams.away },
      { key: "home", data: box.teams.home },
    ];
  });

  interface LeaderCard {
    data: BoxscoreSide;
    leaders: BoxscorePlayer[];
    arm?: BoxscorePlayer;
  }

  const leaderCards = $derived.by<LeaderCard[]>(() => {
    if (!box) return [];
    return [
      { data: box.teams.away, leaders: leaders(box.teams.away), arm: topArm(box.teams.away) },
      { data: box.teams.home, leaders: leaders(box.teams.home), arm: topArm(box.teams.home) },
    ];
  });

  interface BoxSection {
    data: BoxscoreSide;
    batters: BoxscorePlayer[];
    pitchers: BoxscorePlayer[];
    benchNames: string[];
    penNames: string[];
  }

  const boxSections = $derived.by<BoxSection[]>(() => {
    if (!box) return [];
    const build = (side: BoxscoreSide): BoxSection => ({
      data: side,
      batters: battersOf(side),
      pitchers: pitchersOf(side),
      benchNames: (side.bench ?? [])
        .map((id) => side.players[`ID${id}`]?.person.fullName)
        .filter(Boolean) as string[],
      penNames: (side.bullpen ?? [])
        .map((id) => side.players[`ID${id}`]?.person.fullName)
        .filter(Boolean) as string[],
    });
    return [build(box.teams.away), build(box.teams.home)];
  });

  interface NotesCard {
    data: BoxscoreSide;
    notes: string[];
  }

  const notesCards = $derived.by<NotesCard[]>(() => {
    if (!box) return [];
    return [
      { data: box.teams.away, notes: notesFor(box.teams.away) },
      { data: box.teams.home, notes: notesFor(box.teams.home) },
    ];
  });

  // Stats shown for probable pitchers in preview mode, per stat group.
  const PITCH_FIELDS: [string, string][] = [
    ["W", "wins"],
    ["L", "losses"],
    ["ERA", "era"],
    ["WHIP", "whip"],
    ["K/9", "strikeOutsPer9Inn"],
    ["BB/9", "walksAndHitBattersPer9Inn"],
    ["IP", "inningsPitched"],
    ["GS", "gamesStarted"],
  ];
  const HIT_FIELDS: [string, string][] = [
    ["AVG", "avg"],
    ["OBP", "obp"],
    ["SLG", "slg"],
    ["OPS", "ops"],
    ["HR", "homeRuns"],
    ["RBI", "rbi"],
    ["SB", "stolenBases"],
    ["G", "gamesPlayed"],
  ];
</script>

<div class="flex flex-col gap-3 border-t pt-3">
  {#if noHitterFlags.length > 0}
    <div
      class="flex items-center gap-2 rounded-lg border-2 border-amber-400/60 bg-amber-400/10 p-3 text-sm font-semibold text-amber-700 dark:text-amber-300"
    >
      <IconFlag class="size-5 shrink-0" />
      {noHitterFlags.join(" • ")}
    </div>
  {/if}

  {#if loading && playable}
    <div class="grid gap-3 md:grid-cols-2">
      <Skeleton class="h-40 w-full" />
      <Skeleton class="h-40 w-full" />
    </div>
  {:else if playable && awaySide && homeSide}
    <Tabs.Root value="summary" class="w-full">
      <Tabs.List class="flex-wrap justify-start">
        <Tabs.Trigger value="summary">Summary</Tabs.Trigger>
        <Tabs.Trigger value="boxscore">Boxscore</Tabs.Trigger>
        <Tabs.Trigger value="scoring">Scoring plays</Tabs.Trigger>
        {#if wpSeries}
          <Tabs.Trigger value="winprob">Win probability</Tabs.Trigger>
        {/if}
        <Tabs.Trigger value="info">Game info</Tabs.Trigger>
      </Tabs.List>

      <!-- ============================= SUMMARY ============================ -->
      <Tabs.Content value="summary" class="pt-2">
        <div class="flex flex-col gap-4">
          {#if line}
            <div class="overflow-x-auto rounded-lg border">
              <Table.Root class="min-w-[640px] text-sm">
                <Table.Header>
                  <Table.Row class="bg-muted/20">
                    <Table.Head class="sticky left-0 bg-background">Team</Table.Head>
                    {#each line.innings as inn (inn.num)}
                      <Table.Head class="text-center">{inn.num}</Table.Head>
                    {/each}
                    <Table.Head class="text-center font-bold">R</Table.Head>
                    <Table.Head class="text-center font-bold">H</Table.Head>
                    <Table.Head class="text-center font-bold">E</Table.Head>
                    <Table.Head class="text-center font-bold">LOB</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {#each sidesForLinescore as sEnt (sEnt.key)}
                    {@const t = line.teams?.[sEnt.key]}
                    <Table.Row>
                      <Table.Cell class="sticky left-0 bg-background font-medium">
                        <span class="flex items-center gap-1.5">
                          <img src={teamLogo(sEnt.data.team.id)} alt="" class="size-5" />
                          {sEnt.data.team.abbreviation}
                        </span>
                      </Table.Cell>
                      {#each line.innings as inn (inn.num)}
                        <Table.Cell class="text-center tabular-nums">
                          {inn[sEnt.key].runs || ""}
                        </Table.Cell>
                      {/each}
                      <Table.Cell class="text-center font-bold tabular-nums">{t?.runs}</Table.Cell>
                      <Table.Cell class="text-center tabular-nums">{t?.hits}</Table.Cell>
                      <Table.Cell class="text-center tabular-nums">{t?.errors}</Table.Cell>
                      <Table.Cell class="text-center tabular-nums text-muted-foreground">{t?.leftOnBase}</Table.Cell>
                    </Table.Row>
                  {/each}
                </Table.Body>
              </Table.Root>
            </div>
          {/if}

          {#if line?.offense && isLive(game)}
            <Card.Root>
              <Card.Header class="pb-2">
                <Card.Title class="text-sm tracking-wider text-muted-foreground uppercase">
                  Live situation{liveInningLabel(line) ? ` — ${liveInningLabel(line)}` : ""}
                </Card.Title>
              </Card.Header>
              <Card.Content class="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p class="text-muted-foreground text-xs">At bat</p>
                  <p class="font-semibold">{line.offense.batter?.fullName ?? "—"}</p>
                </div>
                <div>
                  <p class="text-muted-foreground text-xs">On deck</p>
                  <p class="font-medium">{line.offense.onDeck?.fullName ?? "—"}</p>
                </div>
                <div>
                  <p class="text-muted-foreground text-xs">In the hole</p>
                  <p class="font-medium">{line.offense.inHole?.fullName ?? "—"}</p>
                </div>
                <div>
                  <p class="text-muted-foreground text-xs">Pitching</p>
                  <p class="font-medium">{line.offense.pitcher?.fullName ?? "—"}</p>
                </div>
                <div class="col-span-full flex flex-wrap items-center gap-3 text-sm">
                  <span class="rounded bg-muted px-2 py-0.5 font-mono">
                    {line.balls ?? 0}-{line.strikes ?? 0}-{line.outs ?? 0}
                  </span>
                  {#if line.offense.first}<span>1B: {line.offense.first.fullName}</span>{/if}
                  {#if line.offense.second}<span>2B: {line.offense.second.fullName}</span>{/if}
                  {#if line.offense.third}<span>3B: {line.offense.third.fullName}</span>{/if}
                </div>
              </Card.Content>
            </Card.Root>
          {/if}

          <div class="grid gap-3 md:grid-cols-2">
            {#each leaderCards as lc (`l-${lc.data.team.id}`)}
              <Card.Root>
                <Card.Header class="pb-2">
                  <Card.Title class="flex items-center gap-2 text-base">
                    <img src={teamLogo(lc.data.team.id)} alt="" class="size-6" />
                    {lc.data.team.name} leaders
                  </Card.Title>
                </Card.Header>
                <Card.Content class="flex flex-col gap-1.5 text-sm">
                  {#each lc.leaders as p (p.person.id)}
                    {@const b = p.stats?.batting ?? {}}
                    <div class="flex items-center justify-between gap-2">
                      <span class="font-medium">{p.person.fullName}</span>
                      <span class="text-muted-foreground text-right tabular-nums">
                        {num(b.hits)} H • {num(b.runs)} R • {num(b.homeRuns)} HR • {num(b.rbi)} RBI • {num(b.totalBases)} TB
                      </span>
                    </div>
                  {/each}
                  {#if lc.arm}
                    <div class="mt-1 flex items-center justify-between gap-2 border-t pt-1.5">
                      <span class="font-medium">{lc.arm.person.fullName}</span>
                      <span class="text-muted-foreground text-right tabular-nums">
                        {lc.arm.stats?.pitching?.inningsPitched} IP • {num(lc.arm.stats?.pitching?.strikeOuts)} K • {num(lc.arm.stats?.pitching?.earnedRuns)} ER
                      </span>
                    </div>
                  {/if}
                  <div class="mt-1 grid grid-cols-2 gap-1 border-t pt-1.5 text-xs text-muted-foreground">
                    <span>{num(lc.data.teamStats.batting.baseOnBalls)} BB • {num(lc.data.teamStats.batting.strikeOuts)} SO</span>
                    <span>{num(lc.data.teamStats.pitching.numberOfPitches)} pitches</span>
                    <span>LOB: {num(lc.data.teamStats.batting.leftOnBase)}</span>
                    <span>Team OPS: {String(lc.data.teamStats.batting.ops ?? "—")}</span>
                  </div>
                </Card.Content>
              </Card.Root>
            {/each}
          </div>

          {#if decisions?.winner || decisions?.loser || decisions?.save}
            <Card.Root>
              <Card.Header class="pb-2">
                <Card.Title class="flex items-center gap-2 text-sm tracking-wider text-muted-foreground uppercase">
                  <IconTrophy class="size-4" /> Pitching decisions
                </Card.Title>
              </Card.Header>
              <Card.Content class="flex flex-wrap gap-6 text-sm">
                {#if decisions?.winner}
                  <div>
                    <p class="text-green-600 text-xs dark:text-green-400">Winning pitcher</p>
                    <p class="font-semibold">{decisions.winner.person.fullName}</p>
                    <p class="text-muted-foreground text-xs">{decisions.winner.stats?.pitching?.summary ?? ""}</p>
                  </div>
                {/if}
                {#if decisions?.loser}
                  <div>
                    <p class="text-red-600 text-xs dark:text-red-400">Losing pitcher</p>
                    <p class="font-semibold">{decisions.loser.person.fullName}</p>
                    <p class="text-muted-foreground text-xs">{decisions.loser.stats?.pitching?.summary ?? ""}</p>
                  </div>
                {/if}
                {#if decisions?.save}
                  <div>
                    <p class="text-blue-600 text-xs dark:text-blue-400">Save</p>
                    <p class="font-semibold">{decisions.save.person.fullName}</p>
                    <p class="text-muted-foreground text-xs">{decisions.save.stats?.pitching?.summary ?? ""}</p>
                  </div>
                {/if}
              </Card.Content>
            </Card.Root>
          {/if}
        </div>
      </Tabs.Content>

      <!-- ============================ BOXSCORE ============================ -->
      <Tabs.Content value="boxscore" class="pt-2">
        <div class="flex flex-col gap-6">
          {#each boxSections as sec (`bs-${sec.data.team.id}`)}
            <section class="flex flex-col gap-2">
              <h3 class="flex items-center gap-2 text-base font-bold">
                <img src={teamLogo(sec.data.team.id)} alt="" class="size-6" />
                {sec.data.team.name}
                <span class="text-muted-foreground text-xs font-normal">
                  ({sec.data.team.abbreviation})
                </span>
              </h3>

              <div class="overflow-x-auto rounded-lg border">
                <p class="border-b bg-muted/40 px-3 py-1.5 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  Batting — game stats + season line
                </p>
                <Table.Root class="min-w-[860px] text-sm">
                  <Table.Header>
                    <Table.Row class="bg-muted/20">
                      <Table.Head class="sticky left-0 bg-background">Lineup</Table.Head>
                      <Table.Head class="text-center">AB</Table.Head>
                      <Table.Head class="text-center">R</Table.Head>
                      <Table.Head class="text-center">H</Table.Head>
                      <Table.Head class="text-center">2B</Table.Head>
                      <Table.Head class="text-center">3B</Table.Head>
                      <Table.Head class="text-center">HR</Table.Head>
                      <Table.Head class="text-center">RBI</Table.Head>
                      <Table.Head class="text-center">BB</Table.Head>
                      <Table.Head class="text-center">SO</Table.Head>
                      <Table.Head class="text-center">TB</Table.Head>
                      <Table.Head class="text-center">AVG</Table.Head>
                      <Table.Head class="text-center">OBP</Table.Head>
                      <Table.Head class="text-center">SLG</Table.Head>
                      <Table.Head class="text-center">OPS</Table.Head>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {#each sec.batters as p (p.person.id)}
                      {@const b = p.stats?.batting ?? {}}
                      {@const s = p.seasonStats?.batting ?? {}}
                      <Table.Row>
                        <Table.Cell class="sticky left-0 bg-background">
                          <span class="flex items-center gap-1.5">
                            {#if p.battingOrder && num(p.battingOrder) > 0}
                              <span class="text-muted-foreground text-xs">
                                {Math.round(num(p.battingOrder) / 100)}
                              </span>
                            {/if}
                            <div>
                              <p class="font-medium leading-tight">{p.person.fullName}</p>
                              <p class="text-muted-foreground text-xs">
                                {p.position?.abbreviation ?? ""}{p.jerseyNumber ? ` · #${p.jerseyNumber}` : ""}
                              </p>
                            </div>
                          </span>
                        </Table.Cell>
                        {#each ["atBats", "runs", "hits", "doubles", "triples", "homeRuns", "rbi", "baseOnBalls", "strikeOuts", "totalBases"] as key (key)}
                          <Table.Cell class="text-center tabular-nums">{num(b[key])}</Table.Cell>
                        {/each}
                        {#each ["avg", "obp", "slg", "ops"] as key (key)}
                          <Table.Cell class="text-muted-foreground text-center tabular-nums">
                            {String(s[key] ?? "—")}
                          </Table.Cell>
                        {/each}
                      </Table.Row>
                    {/each}
                    {@const tb = sec.data.teamStats.batting}
                    <Table.Row class="border-t-2 font-semibold">
                      <Table.Cell class="sticky left-0 bg-background text-xs uppercase">Team</Table.Cell>
                      {#each ["atBats", "runs", "hits", "doubles", "triples", "homeRuns", "rbi", "baseOnBalls", "strikeOuts", "totalBases"] as key (key)}
                        <Table.Cell class="text-center tabular-nums">{num(tb[key])}</Table.Cell>
                      {/each}
                      {#each ["avg", "obp", "slg", "ops"] as key (key)}
                        <Table.Cell class="text-muted-foreground text-center tabular-nums">
                          {String(tb[key] ?? "—")}
                        </Table.Cell>
                      {/each}
                    </Table.Row>
                  </Table.Body>
                </Table.Root>
              </div>

              <div class="overflow-x-auto rounded-lg border">
                <p class="border-b bg-muted/40 px-3 py-1.5 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  Pitching — game stats + season line
                </p>
                <Table.Root class="min-w-[860px] text-sm">
                  <Table.Header>
                    <Table.Row class="bg-muted/20">
                      <Table.Head class="sticky left-0 bg-background">Pitcher</Table.Head>
                      <Table.Head class="text-center">IP</Table.Head>
                      <Table.Head class="text-center">H</Table.Head>
                      <Table.Head class="text-center">R</Table.Head>
                      <Table.Head class="text-center">ER</Table.Head>
                      <Table.Head class="text-center">HR</Table.Head>
                      <Table.Head class="text-center">BB</Table.Head>
                      <Table.Head class="text-center">SO</Table.Head>
                      <Table.Head class="text-center">Pit-ST</Table.Head>
                      <Table.Head class="text-center">BF</Table.Head>
                      <Table.Head class="text-center">W</Table.Head>
                      <Table.Head class="text-center">L</Table.Head>
                      <Table.Head class="text-center">ERA</Table.Head>
                      <Table.Head class="text-center">WHIP</Table.Head>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {#each sec.pitchers as p (p.person.id)}
                      {@const st = p.stats?.pitching ?? {}}
                      {@const s = p.seasonStats?.pitching ?? {}}
                      <Table.Row>
                        <Table.Cell class="sticky left-0 bg-background">
                          <span class="flex items-center gap-1.5">
                            {#if num(st.gamesStarted) === 1}
                              <Badge variant="outline" class="text-[10px]">STARTER</Badge>
                            {/if}
                            <div>
                              <p class="font-medium leading-tight">{p.person.fullName}</p>
                              <p class="text-muted-foreground text-xs">
                                {p.jerseyNumber ? `#${p.jerseyNumber}` : ""}
                              </p>
                            </div>
                          </span>
                        </Table.Cell>
                        <Table.Cell class="text-center tabular-nums">{ipFmt(st.inningsPitched)}</Table.Cell>
                        {#each ["hits", "runs", "earnedRuns", "homeRuns", "baseOnBalls", "strikeOuts"] as key (key)}
                          <Table.Cell class="text-center tabular-nums">{num(st[key])}</Table.Cell>
                        {/each}
                        <Table.Cell class="text-muted-foreground text-center tabular-nums">
                          {num(st.strikes)}-{num(st.balls)} / {num(st.numberOfPitches)}
                        </Table.Cell>
                        <Table.Cell class="text-center tabular-nums">{num(st.battersFaced)}</Table.Cell>
                        <Table.Cell class="text-muted-foreground text-center tabular-nums">{num(s.wins)}</Table.Cell>
                        <Table.Cell class="text-muted-foreground text-center tabular-nums">{num(s.losses)}</Table.Cell>
                        <Table.Cell class="text-muted-foreground text-center tabular-nums">{String(s.era ?? "—")}</Table.Cell>
                        <Table.Cell class="text-muted-foreground text-center tabular-nums">{String(s.whip ?? "—")}</Table.Cell>
                      </Table.Row>
                    {/each}
                  </Table.Body>
                </Table.Root>
              </div>

              {#if sec.benchNames.length || sec.penNames.length}
                <p class="text-muted-foreground text-xs">
                  {(sec.benchNames.length
                    ? `Bench: ${sec.benchNames.join(", ")}. `
                    : "") +
                    (sec.penNames.length
                      ? `Bullpen (DNP): ${sec.penNames.join(", ")}.`
                      : "")}
                </p>
              {/if}
              </section>{/each}
        </div>
      </Tabs.Content>

      <!-- ========================== SCORING PLAYS ========================= -->
      <Tabs.Content value="scoring" class="pt-2">
        {#if scoringPlays.length === 0}
          <p class="text-muted-foreground text-sm">No scoring plays yet.</p>
        {:else}
          <ol class="flex flex-col gap-1.5">
            {#each scoringPlays.slice().reverse() as play, i (`${play.about?.atBatIndex ?? -1}-${i}`)}
              {@const half = play.about?.isTopInning ? "top" : "bottom"}
              {@const teamName = play.about?.isTopInning
                ? game.teams.away.team.abbreviation ?? "AWAY"
                : game.teams.home.team.abbreviation ?? "HOME"}
              <li class="flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
                <span class="text-muted-foreground w-16 shrink-0 font-mono text-xs">
                  {half.charAt(0).toUpperCase()}{play.about?.inning}
                </span>
                <div>
                  <p>{teamName}: {play.result.description ?? play.result.event ?? ""}</p>
                  <p class="text-muted-foreground text-xs">
                    Score: {play.result.awayScore ?? "?"}-{play.result.homeScore ?? "?"}
                    {#if num(play.result.rbi) > 0} • {num(play.result.rbi)} RBI{/if}
                    {#if play.matchup?.batter} • batter: {play.matchup.batter.fullName}{/if}
                    {#if play.matchup?.pitcher} vs {play.matchup.pitcher.fullName}{/if}
                  </p>
                </div>
              </li>
            {/each}
          </ol>
        {/if}
      </Tabs.Content>

      <!-- ========================= WIN PROBABILITY ======================== -->
      {#if wpSeries && awaySide && homeSide}
        <Tabs.Content value="winprob" class="pt-2">
          <Card.Root>
            <Card.Header class="pb-1">
              <Card.Title class="text-sm tracking-wider text-muted-foreground uppercase">
                Win probability over the game
              </Card.Title>
              <Card.Description class="text-xs">
                Home {game.teams.home.team.teamName ?? ""} win % — one point per at-bat, from the
                model behind MLB's win-probability graph.
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} class="w-full" role="img"
                aria-label="Win probability chart">
                <defs>
                  <clipPath id="wp-above">
                    <rect x="0" y="0" width={CHART_W} height={wpSeries.y(50)} />
                  </clipPath>
                  <clipPath id="wp-below">
                    <rect x="0" y={wpSeries.y(50)} width={CHART_W} height={CHART_H - wpSeries.y(50)} />
                  </clipPath>
                </defs>
                <!-- gridlines -->
                {#each [0, 25, 50, 75, 100] as g (g)}
                  <line x1="8" x2={CHART_W - 8} y1={wpSeries.y(g)} y2={wpSeries.y(g)}
                    class={g === 50 ? "stroke-foreground/30" : "stroke-border"} stroke-width="1"
                    stroke-dasharray={g === 50 ? "" : "4 4"} />
                {/each}
                <path d={wpSeries.areaGen} class="fill-sky-500/25 dark:fill-sky-400/20" clip-path="url(#wp-below)" />
                <path d={wpSeries.areaGen} class="fill-emerald-500/25 dark:fill-emerald-400/20" clip-path="url(#wp-above)" />
                <path d={wpSeries.lineGen} class="stroke-foreground" fill="none" stroke-width="2" />
                {#if wpSeries.extreme.i > 0}
                  <circle cx={wpSeries.extremeX} cy={wpSeries.y(wpSeries.extreme.v)} r="3.5"
                    class="fill-foreground" />
                {/if}
                <text x="10" y={wpSeries.y(100) + 12} class="fill-emerald-600 text-[11px]">HOME</text>
                <text x="10" y={CHART_H - 5} class="fill-sky-600 text-[11px]">AWAY</text>
              </svg>
              <div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  Final: {game.teams.away.team.abbreviation}
                  <b>{wpSeries.lastAway.toFixed(0)}%</b> / {game.teams.home.team.abbreviation}
                  <b>{wpSeries.lastHome.toFixed(0)}%</b>
                </span>
                <span class="text-muted-foreground text-xs">
                  Biggest swing: {Math.abs(wpSeries.extreme.v - 50).toFixed(0)}% toward
                  {wpSeries.extreme.v >= 50 ? (game.teams.home.team.abbreviation ?? "home") : (game.teams.away.team.abbreviation ?? "away")}
                </span>
              </div>
            </Card.Content>
          </Card.Root>
        </Tabs.Content>
      {/if}

      <!-- ============================ GAME INFO =========================== -->
      <Tabs.Content value="info" class="pt-2">
        <div class="flex flex-col gap-3">
          {#if crew.length > 0}
            <Card.Root>
              <Card.Header class="pb-2">
                <Card.Title class="text-sm tracking-wider text-muted-foreground uppercase">
                  Officiating crew
                </Card.Title>
              </Card.Header>
              <Card.Content class="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                {#each crew as o (o.official.id)}
                  <span><b>{o.officialType.replace(" Base", "B").replace("Home Plate", "HP")}:</b> {o.official.fullName}</span>
                {/each}
              </Card.Content>
            </Card.Root>
          {/if}

          {#if gameNotes.length > 0}
            <Card.Root>
              <Card.Header class="pb-2">
                <Card.Title class="text-sm tracking-wider text-muted-foreground uppercase">
                  Game notes
                </Card.Title>
              </Card.Header>
              <Card.Content class="flex flex-col gap-1 text-sm">
                {#each gameNotes as note, i (i)}
                  {#if note.value}
                    <p><b>{note.label}:</b> {note.value}</p>
                  {:else}
                    <p class="text-muted-foreground mt-1 font-semibold uppercase">{note.label}</p>
                  {/if}
                {/each}
              </Card.Content>
            </Card.Root>
          {/if}

          <div class="grid gap-3 md:grid-cols-2">
            {#each notesCards as nc (`n-${nc.data.team.id}`)}
              {#if nc.notes.length > 0}
                <Card.Root>
                  <Card.Header class="pb-2">
                    <Card.Title class="flex items-center gap-2 text-sm">
                      <img src={teamLogo(nc.data.team.id)} alt="" class="size-5" />
                      {nc.data.team.name} notes
                    </Card.Title>
                  </Card.Header>
                  <Card.Content class="flex flex-col gap-1 text-sm">
                    {#each nc.notes as note, i (i)}
                      <p>{note}</p>
                    {/each}
                  </Card.Content>
                </Card.Root>
              {/if}
            {/each}
          </div>

          {#if box?.pitchingNotes}
            <p class="text-muted-foreground text-xs italic">{box.pitchingNotes}</p>
          {/if}
        </div>
      </Tabs.Content>
    </Tabs.Root>

  {:else if !playable}
    <!-- ===================== PREVIEW / PROBABLES MODE ===================== -->
    <div class="flex flex-col gap-3">
      {#if loading}
        <Skeleton class="h-40 w-full" />
      {:else if probables.length > 0}
        <Card.Root>
          <Card.Header class="pb-2">
            <Card.Title class="text-sm tracking-wider text-muted-foreground uppercase">
              Probable pitchers — {season} season stats
            </Card.Title>
          </Card.Header>
          <Card.Content class="grid gap-4 sm:grid-cols-2">
            {#each probables as pr (pr.side)}
              {@const fields = pr.group === "pitching" ? PITCH_FIELDS : HIT_FIELDS}
              {@const teamSide = game.teams[pr.side]}
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <img src={teamLogo(teamSide.team.id)} alt="" class="size-7" />
                  <div>
                    <p class="font-semibold leading-tight">{pr.name}</p>
                    <p class="text-muted-foreground text-xs">
                      {teamSide.team.name} · {pr.group === "pitching" ? "SP" : "starter"}
                    </p>
                  </div>
                </div>
                <dl class="grid grid-cols-4 gap-1 text-center text-sm">
                  {#each fields as [label, key] (key)}
                    <div class="rounded bg-muted/40 px-1 py-1.5">
                      <dt class="text-muted-foreground text-[10px] uppercase">{label}</dt>
                      <dd class="font-semibold tabular-nums">
                        {String(pr.stats[key] ?? "—")}
                      </dd>
                    </div>
                  {/each}
                </dl>
              </div>
            {/each}
          </Card.Content>
        </Card.Root>
      {/if}

      <div class="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-lg border p-3">
          <p class="text-muted-foreground text-xs uppercase">First pitch</p>
          <p class="font-semibold">
            {new Date(game.gameDate).toLocaleString(undefined, {
              weekday: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div class="rounded-lg border p-3">
          <p class="text-muted-foreground text-xs uppercase">Venue</p>
          <p class="font-semibold">{game.venue?.name ?? "—"}</p>
        </div>
        <div class="rounded-lg border p-3">
          <p class="text-muted-foreground text-xs uppercase">Series</p>
          <p class="font-semibold">
            {#if game.seriesDescription && game.gamesInSeries}
              {game.seriesDescription} · Game {game.seriesGameNumber} of {game.gamesInSeries}
            {:else}
              —
            {/if}
          </p>
        </div>
        <div class="rounded-lg border p-3">
          <p class="text-muted-foreground text-xs uppercase">Records</p>
          <p class="font-semibold tabular-nums">
            {`${game.teams.away.team.abbreviation ?? "AWAY"} ${game.teams.away.leagueRecord?.wins ?? 0}-${game.teams.away.leagueRecord?.losses ?? 0} · ${game.teams.home.team.abbreviation ?? "HOME"} ${game.teams.home.leagueRecord?.wins ?? 0}-${game.teams.home.leagueRecord?.losses ?? 0}`}
          </p>
        </div>
      </div>
    </div>
  {:else}
    <p class="text-muted-foreground text-sm">
      Detailed statistics aren't available for this game{game.status.detailedState === "Postponed" ? " (postponed)" : ""}.
    </p>
  {/if}
</div>
