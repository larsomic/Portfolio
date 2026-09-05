import { describe, expect, it } from "vitest";

import type { DataRow } from "$lib/datausa.js";
import { aggregate, pairRows } from "./helpers.js";

describe("aggregate", () => {
  const rows = [
    { Year: "2022", Geo: "Denver", income: "100" },
    { Year: "2023", Geo: "Denver", income: "250" },
    { Year: "2022", Geo: "Aurora", income: "50" },
    { Year: "2022", Geo: null as unknown as string, income: "999" },
    { Year: "2022", Geo: "Boulder", income: "n/a" },
  ] as DataRow[];

  // Real callers skip rows whose label is missing; String(null) would be "null".
  const geoLabel = (r: DataRow) =>
    r.Geo == null ? null : String(r.Geo);

  it("sums a measure per label", () => {
    const all = aggregate(rows, geoLabel, "income");
    expect(all.get("Denver")).toBe(350);
    expect(all.get("Aurora")).toBe(50);
  });

  it("skips rows with no label or a non-numeric measure", () => {
    const all = aggregate(rows, geoLabel, "income");
    expect(all.has("null")).toBe(false);
    expect(all.has("Boulder")).toBe(false);
  });

  it("works with a labelOf that filters by year", () => {
    const only2022 = aggregate(
      rows,
      (r) => (r.Year === "2022" ? geoLabel(r) : null),
      "income",
    );
    expect([...only2022.keys()].sort()).toEqual(["Aurora", "Denver"]);
    expect(only2022.get("Denver")).toBe(100);
  });
});

describe("pairRows", () => {
  it("unions labels and null-fills missing sides", () => {
    const a = new Map([["Denver", 10], ["Boulder", 20]]);
    const b = new Map([["Boulder", 5], ["Austin", 7]]);
    const paired = pairRows(a, b);
    const byLabel = new Map(paired.map((r) => [r.label, r]));
    expect(byLabel.get("Denver")).toEqual({ label: "Denver", a: 10, b: null });
    expect(byLabel.get("Boulder")).toEqual({ label: "Boulder", a: 20, b: 5 });
    expect(byLabel.get("Austin")).toEqual({ label: "Austin", a: null, b: 7 });
  });

  it("handles two empty maps", () => {
    expect(pairRows(new Map(), new Map())).toEqual([]);
  });
});
