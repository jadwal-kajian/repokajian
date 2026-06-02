import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type PromotionAction = "create" | "update_existing";
type TopicDiscoveryStatus = "active" | "stale" | "dead" | "blocked" | "ignored" | "error";

type PromotionCandidate = {
  action: PromotionAction;
  topic: {
    topic_id: string;
    topic_title: string;
    evaluated_status: TopicDiscoveryStatus;
    last_post_at: string | null;
  };
  source: {
    id: string;
    name: string;
    region: string;
    topic_id?: string;
    url: string;
  };
};

type PromotionDraft = {
  generated_at: string;
  summary: {
    candidates: number;
    create: number;
    update_existing: number;
  };
  candidates: PromotionCandidate[];
};

type ReviewItem = {
  source_id: string;
  action: PromotionAction;
  topic_id: string;
  topic_title: string;
  region: string;
  status: TopicDiscoveryStatus;
  url: string;
  approved: boolean;
  reviewer_note: string;
};

type PromotionReview = {
  generated_at: string;
  candidates_file: string;
  confirm_promote: false;
  review_instruction: string;
  summary: {
    candidates: number;
    create: number;
    update_existing: number;
  };
  review: ReviewItem[];
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

const INPUT_PATH = process.env.TOPIC_PROMOTION_INPUT_PATH ?? join(ROOT, "data", "spikes", "topic-promotion-candidates.json");
const OUTPUT_PATH = process.env.TOPIC_PROMOTION_REVIEW_PATH ?? join(ROOT, "data", "spikes", "topic-promotion-review.json");

async function main() {
  const inputRaw = await readFile(INPUT_PATH, "utf-8");
  const input = JSON.parse(inputRaw) as PromotionDraft;

  const review: PromotionReview = {
    generated_at: new Date().toISOString(),
    candidates_file: INPUT_PATH,
    confirm_promote: false,
    review_instruction: "Set approved=true for selected rows, then set confirm_promote=true before running spike:topic-promote-apply.",
    summary: input.summary,
    review: (input.candidates ?? []).map((candidate) => ({
      source_id: candidate.source.id,
      action: candidate.action,
      topic_id: candidate.topic.topic_id,
      topic_title: candidate.topic.topic_title,
      region: candidate.source.region,
      status: candidate.topic.evaluated_status,
      url: candidate.source.url,
      approved: false,
      reviewer_note: "",
    })),
  };

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(review, null, 2), "utf-8");

  console.log("[track-b-review-init] input:", INPUT_PATH);
  console.log("[track-b-review-init] output:", OUTPUT_PATH);
  console.log("[track-b-review-init] summary:", review.summary);
}

main().catch((err) => {
  console.error("[track-b-review-init] FAILED:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
