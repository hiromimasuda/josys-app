import { describe, expect, it } from "vitest";
import { seed, seedValidation, validateSeed, formatJst } from "@ops/domain";

describe("seed bundle (docs/input/04_SEED_BUNDLE.json)", () => {
  it("11 flows / 43 operations / 15 eventTemplates", () => {
    expect(seedValidation.counts).toEqual({ flows: 11, operations: 43, eventTemplates: 15 });
  });

  it("has no validation errors (unique ids, references, invariants)", () => {
    expect(seedValidation.errors).toEqual([]);
  });

  it("keeps all operation priorities null with NEEDS_CONFIRMATION", () => {
    for (const op of seed.operations) {
      expect(op.operationalPriority).toBeNull();
      expect(op.priorityFactStatus).toBe("NEEDS_CONFIRMATION");
    }
  });

  it("keeps all event mappings PROPOSED", () => {
    for (const ev of seed.eventTemplates) {
      expect(ev.mappingFactStatus).toBe("PROPOSED");
    }
  });

  it("detects broken references (validator sanity check)", () => {
    const broken = structuredClone(seed);
    broken.operations[0]!.flowId = "F99";
    const result = validateSeed(broken);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("contains only example.invalid emails and URLs", () => {
    const raw = JSON.stringify(seed);
    for (const m of raw.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/g)) {
      expect(m[0].endsWith("@example.invalid")).toBe(true);
    }
    for (const m of raw.matchAll(/https:\/\/[^"\s]+/g)) {
      expect(new URL(m[0]).host.endsWith("example.invalid")).toBe(true);
    }
  });
});

describe("formatJst", () => {
  it("stores UTC, displays JST (+9, no DST)", () => {
    expect(formatJst("2026-07-17T07:00:00Z")).toBe("2026/07/17 16:00 JST");
    expect(formatJst("2026-12-31T15:00:00Z")).toBe("2027/01/01 00:00 JST");
  });
});
