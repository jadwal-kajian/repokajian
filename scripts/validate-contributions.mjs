import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { URL } from "node:url";

const ROOT = new URL("..", import.meta.url);
const CONTRIBUTIONS_DIR = new URL("../data/contributions/pending", import.meta.url);
const SOURCES_PATH = new URL("../data/sources.json", import.meta.url);

const ALLOWED_PLATFORMS = new Set(["tg", "yt", "ig", "web", "wa"]);
const ALLOWED_TYPES = new Set(["channel", "group", "topic", "site", "profile"]);
const REQUIRED_FIELDS = ["name", "platform", "source_type", "url", "handle", "region", "evidence_url", "submitted_by"];

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`✅ ${msg}`);
}

function warn(msg) {
  console.warn(`⚠️ ${msg}`);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function canonicalHandle(value) {
  return String(value ?? "").replace(/^@/, "").trim().toLowerCase();
}

async function listContributionFiles() {
  let entries = [];
  try {
    entries = await readdir(CONTRIBUTIONS_DIR);
  } catch {
    return [];
  }

  return entries
    .filter((entry) => entry.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b))
    .map((entry) => join(CONTRIBUTIONS_DIR.pathname, entry));
}

async function main() {
  const sourcesRaw = await readFile(SOURCES_PATH, "utf-8");
  const sourcesFile = JSON.parse(sourcesRaw);
  const sources = Array.isArray(sourcesFile.sources) ? sourcesFile.sources : [];

  const existingUrls = new Map(sources.map((source) => [String(source.url).toLowerCase(), source.id]));
  const existingHandlePlatform = new Map(
    sources.map((source) => [`${source.platform}::${canonicalHandle(source.handle)}`, source.id])
  );
  const existingIds = new Set(sources.map((source) => source.id));

  const files = await listContributionFiles();
  if (files.length === 0) {
    warn("No pending contribution JSON files found");
    return;
  }

  const seenUrls = new Map();
  const seenHandlePlatform = new Map();

  for (const file of files) {
    const rel = file.replace(ROOT.pathname, "");
    let item;
    try {
      item = JSON.parse(await readFile(file, "utf-8"));
    } catch (err) {
      fail(`${rel} is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }

    for (const field of REQUIRED_FIELDS) {
      if (!isNonEmptyString(item[field])) fail(`${rel} missing required string field '${field}'`);
    }

    if (!ALLOWED_PLATFORMS.has(item.platform)) {
      fail(`${rel}.platform '${item.platform}' is invalid`);
    }

    if (!ALLOWED_TYPES.has(item.source_type)) {
      fail(`${rel}.source_type '${item.source_type}' is invalid`);
    }

    if (!isValidUrl(item.url)) {
      fail(`${rel}.url must be valid http/https URL`);
    }

    if (!isValidUrl(item.evidence_url)) {
      fail(`${rel}.evidence_url must be valid http/https URL`);
    }

    if (item.category !== undefined && (!Array.isArray(item.category) || item.category.some((v) => !isNonEmptyString(v)))) {
      fail(`${rel}.category must be an array of non-empty strings when provided`);
    }

    if (item.tags !== undefined && (!Array.isArray(item.tags) || item.tags.some((v) => !isNonEmptyString(v)))) {
      fail(`${rel}.tags must be an array of non-empty strings when provided`);
    }

    if (item.source_type === "topic") {
      if (!isNonEmptyString(item.parent_id)) fail(`${rel}.parent_id is required for source_type=topic`);
      if (!isNonEmptyString(item.topic_id)) {
        fail(`${rel}.topic_id is required for source_type=topic`);
      } else if (!/^\d+$/.test(item.topic_id)) {
        fail(`${rel}.topic_id must be numeric for source_type=topic`);
      }
      if (isNonEmptyString(item.parent_id) && !existingIds.has(item.parent_id)) {
        fail(`${rel}.parent_id '${item.parent_id}' does not exist in data/sources.json`);
      }
    }

    const urlKey = String(item.url).toLowerCase();
    if (existingUrls.has(urlKey)) {
      fail(`${rel}.url duplicates existing source '${existingUrls.get(urlKey)}'`);
    }
    if (seenUrls.has(urlKey)) {
      fail(`${rel}.url duplicates pending contribution '${seenUrls.get(urlKey)}'`);
    }
    seenUrls.set(urlKey, rel);

    const handleKey = `${item.platform}::${canonicalHandle(item.handle)}`;
    if (item.source_type !== "topic" && existingHandlePlatform.has(handleKey)) {
      fail(`${rel}.handle duplicates existing source '${existingHandlePlatform.get(handleKey)}'`);
    }
    if (item.source_type !== "topic" && seenHandlePlatform.has(handleKey)) {
      fail(`${rel}.handle duplicates pending contribution '${seenHandlePlatform.get(handleKey)}'`);
    }
    seenHandlePlatform.set(handleKey, rel);
  }

  if (process.exitCode === 1) return;
  ok(`Validated ${files.length} pending contribution file(s)`);
}

main().catch((err) => {
  fail(err instanceof Error ? err.message : String(err));
});
