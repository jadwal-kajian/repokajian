import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Platform, HealthStatus, Source } from "../../shared/types";

const ROOT = process.cwd();
const DOCS_DIR = join(ROOT, "docs", "in-app");
const SOURCES_PATH = join(ROOT, "data", "sources.json");
const LATEST_PATH = join(ROOT, "data", "latest.json");
const TOPIC_DISCOVERY_PATH = join(ROOT, "data", "spikes", "telegram-topic-freshness-evaluated.json");

export type { Platform, HealthStatus, Priority, Source } from "../../shared/types";

export interface Snapshot {
  source_id: string;
  last_checked_at: string;
  platform: Platform;
  status: HealthStatus;
  confidence_score: number;
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
  } catch {
    return [];
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
    } catch {
      continue;
    }
  }
  return docs;
}

export async function loadSources(): Promise<Source[]> {
  try {
    const raw = await readFile(SOURCES_PATH, "utf-8");
    const json = JSON.parse(raw) as { sources: Source[] };
    return json.sources;
  } catch {
    return [];
  }
}

export async function loadLatest(): Promise<LatestSummary | null> {
  try {
    const raw = await readFile(LATEST_PATH, "utf-8");
    return JSON.parse(raw) as LatestSummary;
  } catch {
    return null;
  }
}

export async function loadTopicDiscovery(): Promise<TopicDiscovery | null> {
  try {
    const raw = await readFile(TOPIC_DISCOVERY_PATH, "utf-8");
    return JSON.parse(raw) as TopicDiscovery;
  } catch {
    return null;
  }
}
