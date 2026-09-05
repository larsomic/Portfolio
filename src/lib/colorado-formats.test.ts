import { describe, expect, it } from "vitest";

import { fmtMoney, fmtMonth } from "$lib/colorado-cannabis.js";
import { modeLabel } from "$lib/colorado-bikes.js";

describe("fmtMoney", () => {
  it("formats billions with the right precision", () => {
    expect(fmtMoney(1_500_000_000)).toBe("$1.50B");
    expect(fmtMoney(15_500_000_000)).toBe("$15.5B");
  });

  it("formats millions with the right precision", () => {
    expect(fmtMoney(4_200_000)).toBe("$4.20M");
    expect(fmtMoney(42_000_000)).toBe("$42.0M");
  });

  it("rounds thousands and whole dollars", () => {
    expect(fmtMoney(1_234)).toBe("$1k");
    expect(fmtMoney(900)).toBe("$900");
  });
});

describe("fmtMonth", () => {
  // Build dates in local time so the assertion does not depend on the TZ.
  const dateMs = new Date(2024, 4, 1).getTime();

  it("includes the year by default", () => {
    expect(fmtMonth(dateMs)).toBe("May 2024");
  });

  it("can render the month alone", () => {
    expect(fmtMonth(dateMs, false)).toBe("May");
  });
});

describe("modeLabel", () => {
  it("labels each sensor mode", () => {
    expect(modeLabel({ hasBike: true, hasPed: true })).toBe("Bikes & pedestrians");
    expect(modeLabel({ hasBike: true, hasPed: false })).toBe("Bikes");
    expect(modeLabel({ hasBike: false, hasPed: true })).toBe("Pedestrians");
  });
});
