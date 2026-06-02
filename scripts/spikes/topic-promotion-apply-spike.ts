import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Source } from "../../src/shared/types.js";

type PromotionAction = "create" | "update_existing";

type SourcesFile = {
  $schema?: string;
  version: string;
  updated_at: string;
  license: string;
  sources: Source[];
};

type PromotionCandidate = {
  action: PromotionAction;
  source: Source;
};

type PromotionDraft = {
  candidates: PromotionCandidate[];
};

type PromotionReview = {
  confirm_promote: boolean;
  review: {
    source_id: string;
    approved: boolean;
  }[];
};

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));

const CANDIDATES_PATH = process.env.TOPIC_PROMOTION_INPUT_PATH ?? join(ROOT, "data", "spikes", "topic-promotion-candidates.json");
const REVIEW_PATH = process.env.TOPIC_PROMOTION_REVIEW_PATH ?? join(ROOT, "data", "spikes", "topic-promotion-review.json");
const SOURCES_PATH = process.env.SOURCES_PATH ?? join(ROOT, "data", "sources.json");
const OUTPUT_PATH = process.env.SOURCES_OUTPUT_PATH ?? SOURCES_PATH;

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function requireValidReview(review: PromotionReview) {
  if (review.confirm_promote !== true) {
    throw new Error("topic-promotion-review.json must set confirm_promote=true before apply.");
  }
}

function assertNoDuplicateIds(sources: Source[]) {
  const seen = new Set<string>();
  for (const source of sources) {
    if (seen.has(source.id)) throw new Error(`duplicate source id after apply: ${source.id}`);
    seen.add(source.id);
  }
}

async function main() {
  const [candidatesRaw, reviewRaw, sourcesRaw] = await Promise.all([
    readFile(CANDIDATES_PATH, "utf-8"),
    readFile(REVIEW_PATH, "utf-8"),
    readFile(SOURCES_PATH, "utf-8"),
  ]);

  const candidatesFile = JSON.parse(candidatesRaw) as PromotionDraft;
  const review = JSON.parse(reviewRaw) as PromotionReview;
  const sourcesFile = JSON.parse(sourcesRaw) as SourcesFile;

  requireValidReview(review);

  const approvedIds = new Set(
    (review.review ?? [])
      .filter((item) => item.approved)
      .map((item) => item.source_id)
  );

  if (approvedIds.size === 0) {
    throw new Error("No approved promotion rows found in topic-promotion-review.json.");
  }

  const approvedCandidates = (candidatesFile.candidates ?? []).filter((candidate) => approvedIds.has(candidate.source.id));
  const missingIds = [...approvedIds].filter((sourceId) => !approvedCandidates.some((candidate) => candidate.source.id === sourceId));
  if (missingIds.length > 0) {
    throw new Error(`approved source_id not found in candidates file: ${missingIds.join(", ")}`);
  }

  const byId = new Map(sourcesFile.sources.map((source, index) => [source.id, { source, index }]));
  const nextSources = [...sourcesFile.sources];
  let created = 0;
  let updated = 0;

  for (const candidate of approvedCandidates) {
    const existing = byId.get(candidate.source.id);

    if (existing) {
      nextSources[existing.index] = candidate.source;
      updated += 1;
      continue;
    }

    nextSources.push(candidate.source);
    byId.set(candidate.source.id, { source: candidate.source, index: nextSources.length - 1 });
    created += 1;
  }

  assertNoDuplicateIds(nextSources);

  const output: SourcesFile = {
    ...sourcesFile,
    updated_at: todayDate(),
    sources: nextSources,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf-8");

  console.log("[track-b-promote-apply] candidates:", CANDIDATES_PATH);
  console.log("[track-b-promote-apply] review:", REVIEW_PATH);
  console.log("[track-b-promote-apply] sources:", SOURCES_PATH);
  console.log("[track-b-promote-apply] output:", OUTPUT_PATH);
  console.log("[track-b-promote-apply] summary:", {
    approved: approvedCandidates.length,
    created,
    updated,
    total_sources: nextSources.length,
  });
}

main().catch((err) => {
  console.error("[track-b-promote-apply] FAILED:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
