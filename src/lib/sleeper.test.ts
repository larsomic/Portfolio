import { describe, expect, it } from "vitest";

import {
  parseMembers,
  parseSeasonRoster,
  positionRank,
  resolvePlayer,
  type PlayerMap,
  type SleeperRoster,
} from "$lib/sleeper.js";

describe("parseMembers", () => {
  it("returns an empty list for a missing response", () => {
    expect(parseMembers(null)).toEqual([]);
  });

  it("resolves custom-upload avatars and CDN hashes", () => {
    const members = parseMembers([
      { user_id: "u1", display_name: "Ada", metadata: { avatar: "https://example.com/a.png" } },
      { user_id: "u2", display_name: "Bo", metadata: { avatar: "abc123" } },
      { user_id: "u3", display_name: "Cid", avatar: "hash9" },
    ]);
    expect(members.map((m) => m.avatarUrl)).toEqual([
      "https://example.com/a.png",
      "https://sleepercdn.com/images/avatars/abc123",
      "https://sleepercdn.com/images/avatars/hash9",
    ]);
  });

  it("falls back to Unknown and null avatars, sorted case-insensitively", () => {
    const members = parseMembers([
      { user_id: "u1" },
      { user_id: "u2", display_name: "aaron" },
      { user_id: "u3", display_name: "Zoe" },
    ]);
    // Case-insensitive sort: "aaron" < "unknown" < "zoe".
    expect(members.map((m) => m.displayName)).toEqual(["aaron", "Unknown", "Zoe"]);
    expect(members.find((m) => m.userId === "u1")!.avatarUrl).toBeNull();
  });
});

describe("positionRank", () => {
  it("orders positions by the display order", () => {
    expect(positionRank("QB")).toBe(0);
    expect(positionRank("DEF")).toBe(5);
  });

  it("pushes unknown positions to the end", () => {
    expect(positionRank("BN")).toBe(6);
  });
});

describe("resolvePlayer", () => {
  const playerMap: PlayerMap = {
    "1": { full_name: "Patrick Mahomes", position: "QB", team: "KC", injury_status: "Questionable" },
    "2": {},
  };

  it("uses map info when present", () => {
    expect(resolvePlayer("1", playerMap)).toEqual({
      id: "1",
      name: "Patrick Mahomes",
      position: "QB",
      team: "KC",
      injuryStatus: "Questionable",
    });
  });

  it("falls back to a numbered name for map entries without one", () => {
    expect(resolvePlayer("2", playerMap).name).toBe("Player #2");
  });

  it("treats three-letter ids as defense/squad slots", () => {
    const den = resolvePlayer("DEN", {});
    expect(den.position).toBe("DEF");
    expect(den.name).toBe("Defense / Squad");
  });

  it("marks unknown numeric ids with a question mark", () => {
    const missing = resolvePlayer("9999", {});
    expect(missing.position).toBe("?");
    expect(missing.name).toBe("Player #9999");
  });
});

describe("parseSeasonRoster", () => {
  const playerMap: PlayerMap = {
    "10": { full_name: "Zee Receiver", position: "WR", team: "DEN" },
    "11": { full_name: "Adam Running", position: "RB", team: "KC" },
    "12": { full_name: "Bob Quarterback", position: "QB", team: "SF" },
    "13": { full_name: "Aaron Quarterback", position: "QB", team: "LV" },
  };

  const rosters: SleeperRoster[] = [
    {
      roster_id: 1,
      owner_id: "owner-1",
      players: ["10", "11", "12", "13", "0", "DEN"],
      settings: { wins: 9, losses: 5, ties: 0, ppf: 1234.5 },
    },
    { roster_id: 2, owner_id: "owner-2" },
  ];

  it("returns null when rosters are missing or the owner has no roster", () => {
    expect(parseSeasonRoster(null, "owner-1", {})).toBeNull();
    expect(parseSeasonRoster(rosters, "nobody", {})).toBeNull();
  });

  it("drops empty placeholder slots and sorts by position then name", () => {
    const roster = parseSeasonRoster(rosters, "owner-1", playerMap);
    expect(roster).not.toBeNull();
    expect(roster!.players.map((p) => p.name)).toEqual([
      "Aaron Quarterback",
      "Bob Quarterback",
      "Adam Running",
      "Zee Receiver",
      "Defense / Squad",
    ]);
  });

  it("surfaces the win/loss record and points for", () => {
    const roster = parseSeasonRoster(rosters, "owner-1", playerMap);
    expect(roster!.wins).toBe(9);
    expect(roster!.losses).toBe(5);
    expect(roster!.pointsFor).toBe(1234.5);
  });

  it("falls back to fpts when ppf is absent and nulls everything else", () => {
    const rostersWithFpts: SleeperRoster[] = [
      { roster_id: 1, owner_id: "owner-3", settings: { fpts: 99.9 } },
    ];
    const roster = parseSeasonRoster(rostersWithFpts, "owner-3", {});
    expect(roster!.pointsFor).toBe(99.9);
    expect(roster!.wins).toBeNull();
    expect(roster!.players).toEqual([]);
  });
});
