import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Platform, HealthStatus, Source } from "../../shared/types";
import { confidenceToPercent } from "./format";

const ROOT = process.cwd();
const DOCS_DIR = join(ROOT, "docs", "in-app");
const SOURCES_PATH = join(ROOT, "data", "sources.json");
const LATEST_PATH = join(ROOT, "data", "latest.json");
const TOPIC_DISCOVERY_PATH = join(ROOT, "data", "spikes", "telegram-topic-freshness-evaluated.json");

function isMissingFileError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "ENOENT");
}

async function readJsonFile<T>(path: string): Promise<T> {
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw) as T;
}

export type { Platform, HealthStatus, Priority, Source } from "../../shared/types";

export interface Snapshot {
  source_id: string;
  last_checked_at: string;
  platform: Platform;
  status: HealthStatus;
  confidence_score?: number;
  reliability_score?: number;
  checks: {
    name: string;
    ok: boolean;
    details: string;
  }[];
  metrics: {
    subscribers?: number | null;
    last_post_at?: string | null;
    last_post_age_hours?: number | null;
  };
  error?: string;
}

export interface LatestSummary {
  generated_at: string;
  version: string;
  total_sources: number;
  monitored_sources: number;
  by_status: Record<HealthStatus, number>;
  snapshots: Snapshot[];
}

export interface HealthHistoryPoint {
  date: string;
  generated_at: string;
  avg_score: number;
  active_count: number;
  dead_count: number;
  total_sources: number;
}

export type TopicDiscoveryStatus = "active" | "stale" | "dead" | "blocked" | "ignored" | "error";

export interface TopicDiscoveryTopic {
  topic_id: string;
  topic_title: string;
  last_post_at: string | null;
  mapped: boolean;
  mapped_region: string | null;
  mapped_source_id: string | null;
  ignored?: boolean;
  evaluated_status: TopicDiscoveryStatus;
  evaluation_reason: string;
  freshness_age_hours: number | null;
}

export interface TopicDiscovery {
  generated_at: string;
  source_artifact: string;
  policy: {
    active_lt_hours: number;
    stale_lt_hours: number;
    dead_gte_hours: number;
  };
  summary: {
    total_topics: number;
    active: number;
    stale: number;
    dead: number;
    blocked: number;
    ignored?: number;
    error: number;
  };
  topics: TopicDiscoveryTopic[];
}

export interface DocFile {
  slug: string;
  title: string;
  content: string;
}

export async function loadDocs(): Promise<DocFile[]> {
  let entries: string[] = [];
  try {
    entries = await readdir(DOCS_DIR);
  } catch (error) {
    if (isMissingFileError(error)) return [];
    throw error;
  }

  const sorted = entries
    .filter((f) => f.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));

  const docs: DocFile[] = [];
  for (const filename of sorted) {
    try {
      const content = await readFile(join(DOCS_DIR, filename), "utf-8");
      const titleMatch = content.match(/^#\s+(.+)$/m);
      docs.push({
        slug: filename.replace(/\.md$/, ""),
        title: titleMatch ? titleMatch[1].trim() : filename,
        content,
      });
    } catch (error) {
      if (isMissingFileError(error)) continue;
      throw error;
    }
  }
  return docs;
}

export async function loadSources(): Promise<Source[]> {
  try {
    const json = await readJsonFile<{ sources: Source[] }>(SOURCES_PATH);
    return json.sources;
  } catch (error) {
    if (isMissingFileError(error)) return [];
    throw error;
  }
}

function snapshotScoreToPercent(snapshot: Snapshot): number | null {
  if (typeof snapshot.confidence_score === "number") {
    return confidenceToPercent(snapshot.confidence_score);
  }
  if (typeof snapshot.reliability_score === "number") {
    return Math.round(snapshot.reliability_score);
  }
  return null;
}

export async function loadLatest(): Promise<LatestSummary | null> {
  try {
    return await readJsonFile<LatestSummary>(LATEST_PATH);
  } catch (error) {
    if (isMissingFileError(error)) return null;
    throw error;
  }
}

export async function loadHealthHistory(): Promise<HealthHistoryPoint[]> {
  let entries: string[] = [];
  try {
    entries = await readdir(join(ROOT, "data", "health"));
  } catch (error) {
    if (isMissingFileError(error)) return [];
    throw error;
  }

  const history: HealthHistoryPoint[] = [];
  for (const filename of entries.filter((f) => f.endsWith(".json")).sort()) {
    try {
      const snapshot = await readJsonFile<LatestSummary>(join(ROOT, "data", "health", filename));
      const scored = snapshot.snapshots
        .map((item) => snapshotScoreToPercent(item))
        .filter((score): score is number => score !== null);
      const byStatus = snapshot.by_status ?? {};
      history.push({
        date: filename.replace(/\.json$/, ""),
        generated_at: snapshot.generated_at,
        avg_score: scored.length > 0 ? Math.round(scored.reduce((sum, score) => sum + score, 0) / scored.length) : 0,
        active_count: byStatus.active ?? 0,
        dead_count: byStatus.dead ?? 0,
        total_sources: snapshot.total_sources,
      });
    } catch (error) {
      if (isMissingFileError(error)) continue;
      throw error;
    }
  }

  return history.slice(-30);
}

export async function loadTopicDiscovery(): Promise<TopicDiscovery | null> {
  try {
    return await readJsonFile<TopicDiscovery>(TOPIC_DISCOVERY_PATH);
  } catch (error) {
    if (isMissingFileError(error)) return null;
    throw error;
  }
}
