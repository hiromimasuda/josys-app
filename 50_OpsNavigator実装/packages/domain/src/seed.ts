// docs/input/04_SEED_BUNDLE.json を読み取り専用の正規入力として直接importする。
// コピーした二重正本を作らない(docs/build-packet/01_GENERATION_PLAN.md参照)。
import rawBundle from "../../../docs/input/04_SEED_BUNDLE.json";
import type { SeedBundle } from "./types";
import { validateSeed } from "./validate";

export const seed = rawBundle as unknown as SeedBundle;

const validation = validateSeed(seed);
if (validation.errors.length > 0) {
  throw new Error(`SEED_VALIDATION_FAILED: ${validation.errors.join(" / ")}`);
}

export const seedValidation = validation;
export const FIXED_NOW = new Date(seed.metadata.fixedNow);
