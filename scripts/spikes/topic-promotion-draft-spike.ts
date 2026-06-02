import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Source } from "../../src/shared/types.js";

type TopicDiscoveryStatus = "active" | "stale" | "dead" | "blocked" | "ignored" | "error";

type EvaluatedTopic = {
  topic_id: string;
  topic_title: string;
  last_post_at: string | null;
  ignored?: boolean;
  mapped: boolean;
  mapped_region: string | null;
  mapped_source_id: string | null;
  evaluated_status: TopicDiscoveryStatus;
  evaluation_reason: string;
  freshness_age_hours: number | null;
};

type EvaluatedArtifact = {
  generated_at: string;
  summary: {
    total_topics: number;
    active: number;
    stale: number;
    dead: number;
    blocked: number;
    ignored?: number;
    error: number;
  };
  topics: EvaluatedTopic[];
};

type SourcesFile = {
  sources: Source[];
};

type PromotionAction = "create" | "update_existing";

type PromotionCandidate = {
  action: PromotionAction;
  reason: string;
  topic: {
    topic_id: string;
    topic_title: string;
    evaluated_status: TopicDiscoveryStatus;
    last_post_at: string | null;
    freshness_age_hours: number | null;
  };
  source: Source;
  existing_source?: Source;
};

type SkippedTopic = {
  topic_id: string;
  topic_title: string;
  reason: string;
  evaluated_status: TopicDiscoveryStatus;
  mapped: boolean;
  ignored: boolean;
  mapped_region: string | null;
};

type PromotionDraft = {
  generated_at: string;
  input_file: string;
  sources_file: string;
  policy: {
    include_statuses: TopicDiscoveryStatus[];
    parent_id: string;
    handle: string;
    dry_run_only: true;
  };
  summary: {
    total_topics: number;
    candidates: number;
    create: number;
    update_existing: number;
    skipped: number;
    skipped_ignored: number;
    skipped_unmapped: number;
    skipped_blocked_or_error: number;
    skipped_duplicate_topic_id: number;
  };
  candidates: PromotionCandidate[];
  skipped: SkippedTopic[];
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

const INPUT_PATH = process.env.TG_EVAL_INPUT_PATH ?? join(ROOT, "data", "spikes", "telegram-topic-freshness-evaluated.json");
const SOURCES_PATH = process.env.SOURCES_PATH ?? join(ROOT, "data", "sources.json");
const OUTPUT_PATH = process.env.TOPIC_PROMOTION_OUTPUT_PATH ?? join(ROOT, "data", "spikes", "topic-promotion-candidates.json");

const PARENT_ID = process.env.TG_TOPIC_PARENT_ID ?? "tg-sijadwalkajian";
const HANDLE = process.env.TG_TOPIC_HANDLE ?? "sijadwalkajian";
const INCLUDE_STATUSES: TopicDiscoveryStatus[] = ["active", "stale", "dead"];

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function titleCase(input: string): string {
  return input
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function displayRegion(topicTitle: string, region: string): string {
  const stripped = topicTitle.replace(/^kajian\s+/i, "").trim();
  return titleCase(stripped || region.replace(/-/g, " "));
}

function buildSource(topic: EvaluatedTopic, existing?: Source): Source {
  const region = topic.mapped_region ?? "nasional";
  const id = `tg-sijadwalkajian-${region}`;
  const source: Source = {
    id,
    name: `Sijadwal Kajian - ${displayRegion(topic.topic_title, region)}`,
    platform: "tg",
    source_type: "topic",
    parent_id: PARENT_ID,
    topic_id: topic.topic_id,
    url: `https://t.me/${HANDLE}/${topic.topic_id}`,
    handle: HANDLE,
    category: ["aggregator", "jadwal", "kajian"],
    region,
    language: "id",
    priority: existing?.priority ?? 2,
    tags: ["telegram-topic", "track-b", "sijadwalkajian"],
    verified: true,
    added_at: existing?.added_at ?? todayDate(),
    notes: `Promoted draft from Track B topic discovery. Status: ${topic.evaluated_status}; last_post_at: ${topic.last_post_at ?? "unknown"}.`,
  };

  return existing ? { ...existing, ...source } : source;
}

function skip(topic: EvaluatedTopic, reason: string): SkippedTopic {
  return {
    topic_id: topic.topic_id,
    topic_title: topic.topic_title,
    reason,
    evaluated_status: topic.evaluated_status,
    mapped: topic.mapped,
    ignored: Boolean(topic.ignored),
    mapped_region: topic.mapped_region,
  };
}

async function main() {
  const [inputRaw, sourcesRaw] = await Promise.all([
    readFile(INPUT_PATH, "utf-8"),
    readFile(SOURCES_PATH, "utf-8"),
  ]);

  const input = JSON.parse(inputRaw) as EvaluatedArtifact;
  const sourcesFile = JSON.parse(sourcesRaw) as SourcesFile;
  const sources = sourcesFile.sources ?? [];

  const byId = new Map(sources.map((source) => [source.id, source]));
  const byRealTopicId = new Map(
    sources
      .filter((source) => source.parent_id === PARENT_ID && source.topic_id && /^\d+$/.test(source.topic_id))
      .map((source) => [source.topic_id as string, source])
  );

  const candidates: PromotionCandidate[] = [];
  const skipped: SkippedTopic[] = [];
  let skippedIgnored = 0;
  let skippedUnmapped = 0;
  let skippedBlockedOrError = 0;
  let skippedDuplicateTopicId = 0;

  for (const topic of input.topics ?? []) {
    if (topic.ignored || topic.evaluated_status === "ignored") {
      skippedIgnored += 1;
      skipped.push(skip(topic, "topic is intentionally ignored by mapping policy"));
      continue;
    }

    if (!topic.mapped || !topic.mapped_region) {
      skippedUnmapped += 1;
      skipped.push(skip(topic, "topic is not mapped to a region/source key"));
      continue;
    }

    if (!INCLUDE_STATUSES.includes(topic.evaluated_status)) {
      skippedBlockedOrError += 1;
      skipped.push(skip(topic, `status ${topic.evaluated_status} is not eligible for promotion draft`));
      continue;
    }

    const duplicateTopic = byRealTopicId.get(topic.topic_id);
    if (duplicateTopic) {
      skippedDuplicateTopicId += 1;
      skipped.push(skip(topic, `topic_id already exists in ${duplicateTopic.id}`));
      continue;
    }

    const id = `tg-sijadwalkajian-${topic.mapped_region}`;
    const existing = byId.get(id);
    const source = buildSource(topic, existing);
    const action: PromotionAction = existing ? "update_existing" : "create";

    candidates.push({
      action,
      reason: existing
        ? "existing region source found; draft updates topic_id/url and Track B metadata"
        : "mapped topic is eligible for new registry source",
      topic: {
        topic_id: topic.topic_id,
        topic_title: topic.topic_title,
        evaluated_status: topic.evaluated_status,
        last_post_at: topic.last_post_at,
        freshness_age_hours: topic.freshness_age_hours,
      },
      source,
      ...(existing ? { existing_source: existing } : {}),
    });
  }

  const output: PromotionDraft = {
    generated_at: new Date().toISOString(),
    input_file: INPUT_PATH,
    sources_file: SOURCES_PATH,
    policy: {
      include_statuses: INCLUDE_STATUSES,
      parent_id: PARENT_ID,
      handle: HANDLE,
      dry_run_only: true,
    },
    summary: {
      total_topics: input.topics?.length ?? 0,
      candidates: candidates.length,
      create: candidates.filter((candidate) => candidate.action === "create").length,
      update_existing: candidates.filter((candidate) => candidate.action === "update_existing").length,
      skipped: skipped.length,
      skipped_ignored: skippedIgnored,
      skipped_unmapped: skippedUnmapped,
      skipped_blocked_or_error: skippedBlockedOrError,
      skipped_duplicate_topic_id: skippedDuplicateTopicId,
    },
    candidates,
    skipped,
  };

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf-8");

  console.log("[track-b-promote-draft] input:", INPUT_PATH);
  console.log("[track-b-promote-draft] sources:", SOURCES_PATH);
  console.log("[track-b-promote-draft] output:", OUTPUT_PATH);
  console.log("[track-b-promote-draft] summary:", output.summary);
}

main().catch((err) => {
  console.error("[track-b-promote-draft] FAILED:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
