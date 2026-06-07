import { mkdtemp, readFile, rm, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  buildGithubNewFileUrl,
  buildIntakeJSON,
  buildSlug,
  validateIntake,
} from "../src/shared/intake-rules.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const REVIEW_SCRIPT = join(ROOT, "scripts", "review-contributions.mjs");
const PROMOTE_SCRIPT = join(ROOT, "scripts", "promote-contribution.mjs");
const VALIDATE_SCRIPT = join(ROOT, "scripts", "validate-contributions.mjs");

function baseSourcesFile() {
  return {
    $schema: "./schema/source.schema.json",
    version: "test",
    updated_at: "2026-06-01",
    license: "CC-BY-SA-4.0",
    sources: [
      {
        id: "tg-sijadwalkajian",
        name: "Sijadwal Kajian",
        platform: "tg",
        source_type: "group",
        url: "https://t.me/sijadwalkajian",
        handle: "sijadwalkajian",
        category: ["jadwal", "kajian"],
        region: "nasional",
        language: "id",
        priority: 1,
        tags: ["telegram"],
        verified: true,
        added_at: "2026-06-01",
      },
    ],
  };
}

function validChannelContribution() {
  return {
    name: "Kajian Kota Contoh",
    platform: "tg",
    source_type: "channel",
    url: "https://t.me/kajiancontoh",
    handle: "kajiancontoh",
    region: "kota-contoh",
    category: ["kajian", "jadwal"],
    tags: ["kajian", "jadwal"],
    evidence_url: "https://t.me/kajiancontoh",
    submitted_by: "tester",
    notes: "Akun publik aktif.",
  };
}

function validTopicContribution() {
  return {
    name: "Sijadwal Kajian - Jakarta",
    platform: "tg",
    source_type: "topic",
    parent_id: "tg-sijadwalkajian",
    topic_id: "201",
    url: "https://t.me/sijadwalkajian/201",
    handle: "sijadwalkajian",
    region: "jakarta",
    category: ["kajian", "jadwal"],
    tags: ["telegram-topic"],
    evidence_url: "https://t.me/sijadwalkajian/201",
    submitted_by: "tester",
  };
}

async function setupFixture() {
  const dir = await mkdtemp(join(tmpdir(), "vibathon-contrib-test-"));
  const pendingDir = join(dir, "pending");
  const archiveDir = join(dir, "archive", "promoted");
  const sourcesPath = join(dir, "sources.json");
  await mkdir(pendingDir, { recursive: true });
  await mkdir(archiveDir, { recursive: true });
  await writeJson(sourcesPath, baseSourcesFile());
  return { dir, pendingDir, archiveDir, sourcesPath };
}

async function writeJson(path, value) {
  await mkdir(resolve(path, ".."), { recursive: true }).catch(() => undefined);
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function run(script, args, fixture) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: ROOT,
    env: {
      ...process.env,
      SOURCES_PATH: fixture.sourcesPath,
      CONTRIBUTIONS_PENDING_DIR: fixture.pendingDir,
      CONTRIBUTIONS_ARCHIVE_PROMOTED_DIR: fixture.archiveDir,
    },
    encoding: "utf-8",
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectStatus(result, expected, name) {
  if (result.status !== expected) {
    console.error(result.stdout);
    console.error(result.stderr);
    throw new Error(`${name}: expected exit ${expected}, got ${result.status}`);
  }
}

async function test(name, fn) {
  const fixture = await setupFixture();
  try {
    await fn(fixture);
    console.log(`✅ ${name}`);
  } finally {
    await rm(fixture.dir, { recursive: true, force: true });
  }
}

await test("review: no pending files succeeds with warning", async (fixture) => {
  const result = run(REVIEW_SCRIPT, [], fixture);
  expectStatus(result, 0, "review no pending");
  assert(result.stderr.includes("No pending contribution") || result.stdout.includes("No pending contribution"), "expected no pending warning");
});

await test("review: valid channel pending is ready", async (fixture) => {
  await writeJson(join(fixture.pendingDir, "kajiancontoh.json"), validChannelContribution());
  const result = run(REVIEW_SCRIPT, [], fixture);
  expectStatus(result, 0, "review valid channel");
  assert(result.stdout.includes("readiness: ready"), "expected ready output");
});

await test("review: valid topic pending is ready", async (fixture) => {
  await writeJson(join(fixture.pendingDir, "topic.json"), validTopicContribution());
  const result = run(REVIEW_SCRIPT, [], fixture);
  expectStatus(result, 0, "review valid topic");
  assert(result.stdout.includes("parent/topic: tg-sijadwalkajian/201"), "expected topic summary");
});

await test("review: invalid JSON fails", async (fixture) => {
  await writeFile(join(fixture.pendingDir, "bad.json"), "{ nope", "utf-8");
  const result = run(REVIEW_SCRIPT, [], fixture);
  expectStatus(result, 1, "review invalid JSON");
});

await test("review: duplicate URL fails", async (fixture) => {
  const item = validChannelContribution();
  item.url = "https://t.me/sijadwalkajian";
  await writeJson(join(fixture.pendingDir, "duplicate.json"), item);
  const result = run(REVIEW_SCRIPT, [], fixture);
  expectStatus(result, 1, "review duplicate URL");
  assert(result.stdout.includes("duplicates existing source"), "expected duplicate message");
});

await test("review: topic parent missing fails", async (fixture) => {
  const item = validTopicContribution();
  item.parent_id = "tg-missing";
  await writeJson(join(fixture.pendingDir, "topic.json"), item);
  const result = run(REVIEW_SCRIPT, [], fixture);
  expectStatus(result, 1, "review missing parent");
});

await test("promote: missing file fails", async (fixture) => {
  const result = run(PROMOTE_SCRIPT, [join(fixture.pendingDir, "missing.json")], fixture);
  expectStatus(result, 1, "promote missing file");
});

await test("promote: duplicate handle fails with no writes", async (fixture) => {
  const item = validChannelContribution();
  item.url = "https://t.me/another-url";
  item.handle = "sijadwalkajian";
  const input = join(fixture.pendingDir, "duplicate-handle.json");
  await writeJson(input, item);
  const before = await readFile(fixture.sourcesPath, "utf-8");
  const result = run(PROMOTE_SCRIPT, [input, "--apply"], fixture);
  expectStatus(result, 1, "promote duplicate handle");
  const after = await readFile(fixture.sourcesPath, "utf-8");
  assert(before === after, "sources should not change on duplicate handle");
  assert(existsSync(input), "pending should not be archived on failure");
});

await test("promote: dry-run valid channel previews with no writes", async (fixture) => {
  const input = join(fixture.pendingDir, "kajiancontoh.json");
  await writeJson(input, validChannelContribution());
  const before = await readFile(fixture.sourcesPath, "utf-8");
  const result = run(PROMOTE_SCRIPT, [input], fixture);
  expectStatus(result, 0, "promote dry run channel");
  assert(result.stdout.includes('"id": "tg-kajiancontoh"'), "expected generated id");
  const after = await readFile(fixture.sourcesPath, "utf-8");
  assert(before === after, "dry-run should not mutate sources");
  assert(existsSync(input), "dry-run should not archive pending file");
});

await test("promote: dry-run valid topic uses topic-aware id", async (fixture) => {
  const input = join(fixture.pendingDir, "topic.json");
  await writeJson(input, validTopicContribution());
  const result = run(PROMOTE_SCRIPT, [input], fixture);
  expectStatus(result, 0, "promote dry run topic");
  assert(result.stdout.includes('"id": "tg-sijadwalkajian-topic-201"'), "expected topic-aware generated id");
});

await test("promote: apply valid channel appends source and archives pending", async (fixture) => {
  const input = join(fixture.pendingDir, "kajiancontoh.json");
  await writeJson(input, validChannelContribution());
  const result = run(PROMOTE_SCRIPT, [input, "--apply"], fixture);
  expectStatus(result, 0, "promote apply channel");
  const sourcesFile = JSON.parse(await readFile(fixture.sourcesPath, "utf-8"));
  assert(sourcesFile.sources.some((source) => source.id === "tg-kajiancontoh"), "expected promoted source");
  assert(sourcesFile.updated_at !== "2026-06-01", "expected updated_at to change");
  assert(!existsSync(input), "expected pending file to move");
  assert(existsSync(join(fixture.archiveDir, "kajiancontoh.json")), "expected archived pending file");
  const pendingEntries = await readdir(fixture.pendingDir);
  assert(pendingEntries.length === 0, "expected empty pending dir after archive");
});

// ===== E2: in-app form intake helpers =====

await test("form: buildIntakeJSON channel output passes real validator", async (fixture) => {
  const item = validChannelContribution();
  await writeFile(join(fixture.pendingDir, `${buildSlug(item)}.json`), buildIntakeJSON(item), "utf-8");
  const result = run(VALIDATE_SCRIPT, [], fixture);
  expectStatus(result, 0, "validate form channel JSON");
});

await test("form: buildIntakeJSON topic output passes real validator", async (fixture) => {
  const item = validTopicContribution();
  await writeFile(join(fixture.pendingDir, `${buildSlug(item)}.json`), buildIntakeJSON(item), "utf-8");
  const result = run(VALIDATE_SCRIPT, [], fixture);
  expectStatus(result, 0, "validate form topic JSON");
});

// Unit tests for the shared rules (no fixture needed).
function unit(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

const SAMPLE_SOURCES = baseSourcesFile().sources;

unit("validateIntake: valid channel has no errors", () => {
  const { errors } = validateIntake(validChannelContribution(), { sources: SAMPLE_SOURCES });
  assert(errors.length === 0, `expected no errors, got ${JSON.stringify(errors)}`);
});

unit("validateIntake: each missing required field is an error", () => {
  for (const field of ["name", "platform", "source_type", "url", "handle", "region", "evidence_url", "submitted_by"]) {
    const item = validChannelContribution();
    delete item[field];
    const { errors } = validateIntake(item, { sources: SAMPLE_SOURCES });
    assert(errors.some((e) => e.includes(field)), `expected error for missing '${field}'`);
  }
});

unit("validateIntake: bad platform and source_type are errors", () => {
  const item = { ...validChannelContribution(), platform: "xx", source_type: "weird" };
  const { errors } = validateIntake(item, { sources: SAMPLE_SOURCES });
  assert(errors.some((e) => e.includes("platform")), "expected platform error");
  assert(errors.some((e) => e.includes("source_type")), "expected source_type error");
});

unit("validateIntake: non-http url and evidence_url are errors", () => {
  const item = { ...validChannelContribution(), url: "ftp://x", evidence_url: "not-a-url" };
  const { errors } = validateIntake(item, { sources: SAMPLE_SOURCES });
  assert(errors.some((e) => e.startsWith("url")), "expected url error");
  assert(errors.some((e) => e.startsWith("evidence_url")), "expected evidence_url error");
});

unit("validateIntake: category/tags must be arrays of strings", () => {
  const item = { ...validChannelContribution(), category: "notarray", tags: ["", "ok"] };
  const { errors } = validateIntake(item, { sources: SAMPLE_SOURCES });
  assert(errors.some((e) => e.startsWith("category")), "expected category error");
  assert(errors.some((e) => e.startsWith("tags")), "expected tags error");
});

unit("validateIntake: topic rules (parent missing, parent unknown, topic_id numeric)", () => {
  const noParent = { ...validTopicContribution() };
  delete noParent.parent_id;
  assert(validateIntake(noParent, { sources: SAMPLE_SOURCES }).errors.some((e) => e.includes("parent_id")), "expected parent_id required");

  const badParent = { ...validTopicContribution(), parent_id: "tg-missing" };
  assert(validateIntake(badParent, { sources: SAMPLE_SOURCES }).errors.some((e) => e.includes("does not exist")), "expected parent not found");

  const badTopicId = { ...validTopicContribution(), topic_id: "20a" };
  assert(validateIntake(badTopicId, { sources: SAMPLE_SOURCES }).errors.some((e) => e.includes("topic_id")), "expected numeric topic_id error");
});

unit("validateIntake: duplicate url/handle are warnings not errors", () => {
  const dupUrl = { ...validChannelContribution(), url: "https://t.me/sijadwalkajian" };
  const r1 = validateIntake(dupUrl, { sources: SAMPLE_SOURCES });
  assert(r1.errors.length === 0, "duplicate url should not be an error");
  assert(r1.warnings.some((w) => w.includes("duplicates existing source")), "expected url warning");

  const dupHandle = { ...validChannelContribution(), url: "https://t.me/other", handle: "sijadwalkajian" };
  const r2 = validateIntake(dupHandle, { sources: SAMPLE_SOURCES });
  assert(r2.warnings.some((w) => w.startsWith("handle")), "expected handle warning");
});

unit("buildSlug: non-topic uses canonical handle; topic uses parent-topic-id", () => {
  assert(buildSlug(validChannelContribution()) === "kajiancontoh", "channel slug");
  assert(buildSlug({ ...validChannelContribution(), handle: "@Kajian Contoh!" }) === "kajian-contoh", "canonicalized slug");
  assert(buildSlug(validTopicContribution()) === "sijadwalkajian-topic-201", "topic slug");
});

unit("buildGithubNewFileUrl: encodes filename + JSON round-trip", () => {
  const item = validChannelContribution();
  const json = buildIntakeJSON(item);
  const url = buildGithubNewFileUrl(buildSlug(item), json);
  const parsed = new URL(url);
  assert(parsed.searchParams.get("filename") === "data/contributions/pending/kajiancontoh.json", "filename param");
  assert(parsed.searchParams.get("value") === json, "value round-trips to original JSON");
});

console.log("\n✅ contribution script smoke tests passed");
