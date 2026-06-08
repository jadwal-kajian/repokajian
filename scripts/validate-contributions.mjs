import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalHandle,
  validateIntake,
} from "../src/shared/intake-rules.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

// Paths can be overridden via env (used by the test harness); default to repo data.
const CONTRIBUTIONS_DIR = process.env.CONTRIBUTIONS_PENDING_DIR
  ? resolve(process.env.CONTRIBUTIONS_PENDING_DIR)
  : join(ROOT, "data", "contributions", "pending");
const SOURCES_PATH = process.env.SOURCES_PATH
  ? resolve(process.env.SOURCES_PATH)
  : join(ROOT, "data", "sources.json");

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
    .map((entry) => join(CONTRIBUTIONS_DIR, entry));
}

async function main() {
  const sourcesRaw = await readFile(SOURCES_PATH, "utf-8");
  const sourcesFile = JSON.parse(sourcesRaw);
  const sources = Array.isArray(sourcesFile.sources) ? sourcesFile.sources : [];

  const files = await listContributionFiles();
  if (files.length === 0) {
    warn("No pending contribution JSON files found");
    return;
  }

  // Cross-file duplicate tracking (within the pending batch).
  const seenUrls = new Map();
  const seenHandlePlatform = new Map();

  for (const file of files) {
    const rel = file.startsWith(ROOT) ? file.slice(ROOT.length + 1) : file;
    let item;
    try {
      item = JSON.parse(await readFile(file, "utf-8"));
    } catch (err) {
      fail(`${rel} is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }

    // Shared per-item rules. In CI, both errors AND warnings (existing-registry
    // duplicates) are treated as failures so the registry stays clean.
    const { errors, warnings } = validateIntake(item, { sources });
    for (const message of errors) fail(`${rel}.${message}`);
    for (const message of warnings) fail(`${rel}.${message}`);

    // Cross-file duplicates within this pending batch.
    const urlKey = String(item.url).toLowerCase();
    if (seenUrls.has(urlKey)) {
      fail(`${rel}.url duplicates pending contribution '${seenUrls.get(urlKey)}'`);
    }
    seenUrls.set(urlKey, rel);

    if (item.source_type !== "topic") {
      const handleKey = `${item.platform}::${canonicalHandle(item.handle)}`;
      if (seenHandlePlatform.has(handleKey)) {
        fail(`${rel}.handle duplicates pending contribution '${seenHandlePlatform.get(handleKey)}'`);
      }
      seenHandlePlatform.set(handleKey, rel);
    }
  }

  if (process.exitCode === 1) return;
  ok(`Validated ${files.length} pending contribution file(s)`);
}

main().catch((err) => {
  fail(err instanceof Error ? err.message : String(err));
});
