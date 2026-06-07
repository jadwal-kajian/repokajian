# DATA FLOW — Technical Architecture & Data Flow
## Source List Kajian Sunnah Indonesia

**Versi:** 1.0  
**Tanggal:** 7 Juni 2026  
**Status:** Draft  
**Penulis:** Tim Vibathon 2026

---

## 1. Arsitektur Layer (L0–L3)

```
┌─────────────────────────────────────────────────────────────┐
│  L0 — SUMBER ASLI (Platform Digital)                        │
│  Telegram · WhatsApp · YouTube · Instagram · Website        │
└────────────────────────┬────────────────────────────────────┘
                         │ scraping / API / manual
┌────────────────────────▼────────────────────────────────────┐
│  L1 — SOURCE LIST KAJIAN SUNNAH (PROYEK INI)                │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Registry    │  │ Health       │  │ Contribution     │   │
│  │ sources.json│  │ Monitoring   │  │ Intake           │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
│                                                             │
│  Static API: /v1/sources.json · /v1/latest.json            │
│             /v1/active.json                                 │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP GET /v1/*.json
┌────────────────────────▼────────────────────────────────────┐
│  L2 — AGGREGATOR / MIDDLEWARE                               │
│  Sijadwal · Kajian Finder · Custom middleware               │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  L3 — APLIKASI KONSUMEN                                     │
│  Jadwal kajian apps · Chatbot · Portal konten               │
└─────────────────────────────────────────────────────────────┘
```

### Peran Setiap Layer

| Layer | Peran | Contoh |
|-------|-------|--------|
| L0 | Platform digital tempat kajian berlangsung | Telegram, WhatsApp |
| L1 | Registry + monitoring (proyek ini) | source-list |
| L2 | Aggregator yang consume data L1 | Sijadwal, Kajian Finder |
| L3 | Aplikasi yang melayani pengguna akhir | App jadwal kajian harian |

---

## 2. Data Sources & Model

Semua data disimpan sebagai file JSON berbasis Git. Tidak ada database.

### Inventaris Data Files

| File / Direktori | Format | Update By | Deskripsi |
|-----------------|--------|-----------|-----------|
| `data/sources.json` | `Source[]` | Maintainer / promote script | Registry utama semua sumber |
| `data/latest.json` | `LatestSummary` | GitHub Actions (harian) | Snapshot kesehatan terbaru |
| `data/health/YYYY-MM-DD.json` | `HealthHistoryPoint` | GitHub Actions (harian) | Arsip snapshot per hari |
| `data/spikes/telegram-topic-freshness-evaluated.json` | `TopicDiscoveryTopic[]` | Spike scripts manual | Track B: kandidat topik Telegram |
| `data/contributions/pending/*.json` | `IntakeItem` | Kontributor (PR) | Kontribusi pending review |
| `docs/in-app/*.md` | Markdown | Maintainer | Dokumentasi in-app drawer |

---

## 3. Type Definitions

Semua tipe didefinisikan di `src/shared/types.ts`.

### Source — Entitas Registry Utama

```typescript
interface Source {
  id: string;           // Immutable. Format: "<platform>-<slug>". Contoh: "tg-kajianmedina"
  name: string;         // Nama tampilan sumber
  platform: "tg" | "yt" | "ig" | "web" | "wa";
  source_type: string;  // "channel" | "group" | "topic" | "site" | "profile"
  url: string;          // URL lengkap sumber
  handle: string;       // Username/handle platform
  region: string;       // "nasional" | "yogyakarta" | "bandung" | "surabaya" | dst.
  language: string;     // "id" | "ar" | dst.
  priority: number;     // Ranking prioritas (semakin kecil = semakin penting)
  category?: string[];  // ["kajian", "akhwat", "ustadz", dst.]
  tags?: string[];
  verified?: boolean;
  added_at: string;     // ISO 8601 datetime
  parent_id?: string;   // Source ID parent (untuk Telegram topic)
  topic_id?: string;    // Numeric ID Telegram topic
  notes?: string;
  partnership_status?: string;
  has_api?: boolean;
  monitor_status?: "not_yet_monitored";
}
```

**Aturan ID:**
- Format: `<platform>-<slug>` (contoh: `tg-kajianmedina`, `yt-islamicguidance`)
- Immutable — tidak boleh berubah setelah source terdaftar
- Harus unik di seluruh registry

### Snapshot — Hasil Health Check Per Sumber

```typescript
interface Snapshot {
  source_id: string;          // Referensi ke Source.id
  last_checked_at: string;    // ISO 8601 datetime saat cek dilakukan
  platform: Platform;
  status: HealthStatus;       // Lihat HealthStatus di bawah
  confidence_score?: number;  // 0.0 – 1.0 (formula: lihat seksi 9)
  reliability_score?: number;
  checks: CheckItem[];        // Hasil per komponen cek
  metrics: {
    subscribers?: number | null;
    last_post_at?: string | null;
    last_post_age_hours?: number | null;
  };
  error?: string;             // Pesan error jika cek gagal
}

type HealthStatus =
  | "active"        // Sumber aktif, konten terbaru < 7 hari
  | "stale"         // Sumber aktif tapi jarang posting (7–30 hari)
  | "dead"          // Sumber tidak posting > 30 hari atau tidak bisa diakses
  | "blocked"       // Akses diblokir oleh platform
  | "error"         // Error teknis saat health check
  | "unmonitored";  // Belum pernah dicek

interface CheckItem {
  name: string;    // "http_fetch" | "content_parse" | "freshness"
  ok: boolean;     // True jika check berhasil
  details?: string;
}
```

### LatestSummary — Agregasi Snapshot Terbaru

```typescript
interface LatestSummary {
  generated_at: string;          // ISO 8601 kapan summary dibuat
  version: string;               // Versi format
  total_sources: number;
  monitored_sources: number;
  by_status: Record<HealthStatus, number>;  // Count per status
  snapshots: Snapshot[];         // Array semua snapshot terbaru
}
```

### HealthHistoryPoint — Snapshot Harian (Arsip)

```typescript
interface HealthHistoryPoint {
  date: string;            // Format YYYY-MM-DD
  generated_at: string;
  avg_score: number;       // Rata-rata confidence score semua sumber
  active_count: number;
  dead_count: number;
  total_sources: number;
}
```

### TopicDiscoveryTopic — Track B Kandidat

```typescript
interface TopicDiscoveryTopic {
  topic_id: string;
  topic_title: string;
  last_post_at: string | null;
  mapped: boolean;                           // Sudah terdaftar di registry?
  mapped_region: string | null;
  mapped_source_id: string | null;
  ignored?: boolean;
  evaluated_status: TopicDiscoveryStatus;   // "mapped" | "ignored" | "candidate"
  evaluation_reason: string;
  freshness_age_hours: number | null;
}
```

### IntakeItem — Form Kontribusi

```typescript
interface IntakeItem {
  name: string;
  platform: string;
  source_type: string;
  url: string;
  handle: string;
  region: string;
  evidence_url: string;    // Bukti keaktifan sumber
  submitted_by: string;    // Nama/alias kontributor
  category?: string[];
  tags?: string[];
  notes?: string;
  parent_id?: string;      // Untuk Telegram topic
  topic_id?: string;
}
```

---

## 4. Build-Time Pipeline

Saat `next build` dijalankan, data dimuat dari file JSON dan di-embed ke dalam halaman HTML statis.

```
┌─────────────────────────────────────────────────────────┐
│  BUILD TIME (npm run build)                             │
│                                                         │
│  1. generate:api runs first                             │
│     scripts/generate-api.mjs                            │
│     → copies data/*.json → public/v1/*.json             │
│                                                         │
│  2. next build                                          │
│     src/app/page.tsx (Server Component)                 │
│       ↓ calls                                           │
│     src/app/lib/data.ts                                 │
│       ├── loadSources()    → data/sources.json          │
│       ├── loadLatest()     → data/latest.json           │
│       ├── loadHealthHistory() → data/health/*.json      │
│       ├── loadTopicDiscovery() → data/spikes/*.json     │
│       └── loadDocs()       → docs/in-app/*.md           │
│       ↓ data injected as props                          │
│     React Components render to static HTML              │
│                                                         │
│  Output: .next/ (static HTML + JS chunks)               │
└─────────────────────────────────────────────────────────┘
```

### Data Loading Functions (`src/app/lib/data.ts`)

| Fungsi | File Sumber | Return Type |
|--------|------------|-------------|
| `loadSources()` | `data/sources.json` | `Source[]` |
| `loadLatest()` | `data/latest.json` | `LatestSummary` |
| `loadHealthHistory()` | `data/health/YYYY-MM-DD.json` (semua) | `HealthHistoryPoint[]` |
| `loadTopicDiscovery()` | `data/spikes/telegram-topic-freshness-evaluated.json` | `TopicDiscoveryTopic[]` |
| `loadDocs()` | `docs/in-app/*.md` | `{ slug, content }[]` |

---

## 5. Daily Automation Pipeline

GitHub Actions menjalankan health check otomatis setiap hari.

```
┌───────────────────────────────────────────────────────────────┐
│  DAILY CRON (00:01 WIB = 17:01 UTC)                          │
│  .github/workflows/health-check.yml                          │
│                                                               │
│  Trigger: schedule (cron: '1 17 * * *')                      │
│                                                               │
│  Step 1: Checkout repository                                  │
│                                                               │
│  Step 2: npm run check:telegram                               │
│    scripts/check-telegram.ts                                  │
│      ├── Baca data/sources.json → filter platform: "tg"       │
│      ├── Untuk setiap sumber Telegram:                        │
│      │     scripts/lib/fetch-telegram.ts                      │
│      │       ├── HTTP GET https://t.me/<handle>               │
│      │       ├── Cheerio parse HTML                           │
│      │       ├── Ekstrak: subscriber_count, last_post_at      │
│      │       └── Hitung confidence_score                      │
│      ├── Build Snapshot[] untuk semua sumber                  │
│      ├── Build LatestSummary                                  │
│      ├── Simpan → data/latest.json                            │
│      └── Simpan → data/health/YYYY-MM-DD.json                │
│                                                               │
│  Step 3: npm run generate:api                                 │
│    scripts/generate-api.mjs                                   │
│      ├── Copy data/sources.json → public/v1/sources.json      │
│      ├── Copy data/latest.json  → public/v1/latest.json       │
│      └── Filter aktif          → public/v1/active.json        │
│                                                               │
│  Step 4: git diff --quiet || git commit + git push            │
│    Commit hanya jika ada perubahan snapshot                   │
│                                                               │
│  Step 5: Netlify auto-deploy triggered by git push            │
└───────────────────────────────────────────────────────────────┘
```

### Health Check Flow Per Sumber

```
Sumber Telegram
      │
      ▼
HTTP GET t.me/<handle>
      │
      ├── [GAGAL] → status: "error", confidence: 0.0
      │
      ▼
Cheerio parse HTML response
      │
      ├── [GAGAL] → status: "blocked" atau "error"
      │
      ▼
Ekstrak: subscribers, last_post_at
      │
      ▼
Hitung freshness_age_hours
      │
      ├── < 168 jam (7 hari)   → freshness check: OK
      ├── 168–720 jam (30 hari) → freshness check: WARN
      └── > 720 jam            → freshness check: FAIL
      │
      ▼
Tentukan status:
      ├── semua check OK, freshness < 7 hari  → "active"
      ├── aktif tapi freshness 7–30 hari      → "stale"
      └── freshness > 30 hari atau gagal      → "dead"
```

---

## 6. Contribution Intake Flow

```
Pengguna
  │
  ▼
Tab Contribute → ContributionForm.tsx
  │ User mengisi semua field
  ▼
Real-time validation (client-side)
  │ Semua field wajib terisi dan valid
  ▼
Generate JSON (IntakeItem)
  │
  ├── [GitHub PR] ──────────────────────────────────────────┐
  │   Buka browser: github.com/new/issue?template=...        │
  │   Body pre-filled dengan JSON content                    │
  │                                                          │
  ├── [Email] ──────────────────────────────────────────────┤
  │   mailto: link dengan JSON di email body                 │
  │                                                          │
  └── [Netlify Form] ────────────────────────────────────────┤
      POST ke Netlify Forms endpoint                         │
                                                             │
                                                             ▼
                                             File masuk ke:
                                             data/contributions/pending/<slug>.json
                                                             │
                                             Trigger: validate-contributions.yml
                                             (GitHub Actions CI pada PR)
                                                             │
                                             ├── Skema valid?
                                             ├── URL valid?
                                             ├── Parent ID ada? (jika diisi)
                                             └── Tidak duplikat?
                                                             │
                                             Maintainer review via PR
                                                             │
                                             Approve + merge
                                                             │
                                             Maintainer jalankan:
                                             npm run promote-contribution -- <slug>
                                                             │
                                             Source masuk ke data/sources.json
                                             File pending dihapus
```

---

## 7. Static API Contract

### Endpoint: `GET /v1/sources.json`

Seluruh registry sumber.

```json
[
  {
    "id": "tg-kajianmedina",
    "name": "Kajian Medina",
    "platform": "tg",
    "source_type": "channel",
    "url": "https://t.me/kajianmedina",
    "handle": "kajianmedina",
    "region": "nasional",
    "language": "id",
    "priority": 1,
    "category": ["kajian", "aqidah"],
    "added_at": "2026-01-15T10:00:00Z"
  }
]
```

### Endpoint: `GET /v1/latest.json`

Snapshot kesehatan terbaru dari semua sumber yang dimonitor.

```json
{
  "generated_at": "2026-06-07T17:05:00Z",
  "version": "1",
  "total_sources": 45,
  "monitored_sources": 42,
  "by_status": {
    "active": 35,
    "stale": 4,
    "dead": 2,
    "unmonitored": 3,
    "error": 1,
    "blocked": 0
  },
  "snapshots": [
    {
      "source_id": "tg-kajianmedina",
      "last_checked_at": "2026-06-07T17:03:00Z",
      "platform": "tg",
      "status": "active",
      "confidence_score": 0.92,
      "checks": [
        { "name": "http_fetch", "ok": true },
        { "name": "content_parse", "ok": true },
        { "name": "freshness", "ok": true }
      ],
      "metrics": {
        "subscribers": 12500,
        "last_post_at": "2026-06-07T08:30:00Z",
        "last_post_age_hours": 8.5
      }
    }
  ]
}
```

### Endpoint: `GET /v1/active.json`

Hanya sumber dengan status `active`. Format sama dengan `/v1/sources.json` tapi difilter.

---

## 8. Platform Monitoring Architecture

### Desain Adapter Pattern

Setiap platform memiliki adapter sendiri yang menghasilkan output bertipe `Snapshot` — interface yang sama untuk semua platform.

```
scripts/
├── check-telegram.ts          ← Orchestrator Telegram
├── lib/
│   ├── fetch-telegram.ts      ← Adapter Telegram (deployed ✅)
│   ├── fetch-website.ts       ← Adapter Website (planned 🔜)
│   └── fetch-whatsapp.ts      ← Adapter WhatsApp (planned 🔜)
└── check-all-platforms.ts     ← Orchestrator multi-platform (future)
```

### Interface Adapter

```typescript
// Setiap adapter harus mengimplementasikan interface ini
interface PlatformAdapter {
  fetchHealth(source: Source): Promise<Snapshot>;
  platform: Platform;
}
```

Dengan pattern ini, menambah platform baru hanya memerlukan:
1. Membuat file `fetch-<platform>.ts` yang implement `PlatformAdapter`
2. Mendaftarkan adapter di orchestrator
3. Tidak ada perubahan pada skema data, UI, atau API

### Status Platform Saat Ini

| Platform | Adapter | Metode Monitoring | Status |
|----------|---------|-------------------|--------|
| Telegram channel | `fetch-telegram.ts` | Cheerio HTML scraping | ✅ Deployed |
| Telegram topic | `fetch-telegram.ts` | HTML scraping + topic ID | ✅ Deployed |
| Website | `fetch-website.ts` | HTTP health + content parse | 🔜 Q3 2026 |
| WhatsApp | `fetch-whatsapp.ts` | TBD (API / partner) | 🔜 Q4 2026 |
| YouTube | — | YouTube Data API | 📋 Backlog |
| Instagram | — | Public scraping | 📋 Backlog |

---

## 9. Confidence Score Algorithm

Setiap sumber mendapatkan `confidence_score` antara 0.0 dan 1.0 yang merepresentasikan tingkat kepercayaan bahwa sumber tersebut masih aktif dan dapat diakses.

### Formula v1 (Telegram)

```
confidence_score = (0.40 × http_fetch) + (0.35 × content_parse) + (0.25 × freshness)
```

| Komponen | Bobot | OK Jika |
|----------|-------|---------|
| `http_fetch` | 40% | HTTP status 200 dari `t.me/<handle>` |
| `content_parse` | 35% | Berhasil mengekstrak subscriber count dan metadata |
| `freshness` | 25% | Last post < 7 hari (168 jam) |

### Contoh Kalkulasi

```
Sumber: tg-kajianmedina
  http_fetch:    OK  → 1.0 × 0.40 = 0.40
  content_parse: OK  → 1.0 × 0.35 = 0.35
  freshness:     OK  → 1.0 × 0.25 = 0.25
  ─────────────────────────────────────────
  confidence_score = 0.40 + 0.35 + 0.25 = 1.00

Sumber: tg-kajianstale
  http_fetch:    OK  → 1.0 × 0.40 = 0.40
  content_parse: OK  → 1.0 × 0.35 = 0.35
  freshness:     FAIL→ 0.0 × 0.25 = 0.00
  ─────────────────────────────────────────
  confidence_score = 0.40 + 0.35 + 0.00 = 0.75 → status: "stale"
```

### Interpretasi Score

| Score | Interpretasi |
|-------|-------------|
| 0.85 – 1.00 | Sangat aktif dan dapat diakses |
| 0.65 – 0.84 | Aktif tapi ada kelemahan (stale atau parse parsial) |
| 0.40 – 0.64 | Bermasalah, perlu investigasi |
| 0.00 – 0.39 | Tidak aktif atau tidak dapat diakses |

---

## 10. Script Inventory

Semua script berada di direktori `scripts/`.

### Script Produksi

| Script | Command | Fungsi |
|--------|---------|--------|
| `check-telegram.ts` | `npm run check:telegram` | Jalankan health check semua sumber Telegram |
| `generate-api.mjs` | `npm run generate:api` | Copy data ke `public/v1/*.json` |
| `validate-sources.mjs` | `npm run validate:sources` | Validasi skema dan integritas `sources.json` |
| `validate-contributions.mjs` | `npm run validate:contributions` | Validasi semua file di `contributions/pending/` |
| `promote-contribution.mjs` | `npm run promote-contribution -- <slug>` | Promosi satu kontribusi ke registry |
| `check-source-links.mjs` | `npm run check:links` | Validasi URL semua sumber masih bisa diakses |
| `check-snapshot-relations.mjs` | `npm run check:relations` | Pastikan semua snapshot_id ada di registry |

### Script Spike / Research (Track B)

| Script | Command | Fungsi |
|--------|---------|--------|
| `spike-topic-freshness.ts` | `npm run spike:topic-freshness` | Analisa freshness Telegram topics |
| `spike-topic-mapping.ts` | `npm run spike:topic-mapping` | Mapping topik ke region |
| `spike-topic-evaluate.ts` | `npm run spike:topic-evaluate` | Evaluasi topik untuk promosi |
| `spike-topic-promote-*.ts` | `npm run spike:topic-promote-*` | Workflow promosi topik ke registry |
| `spike-session-gen.ts` | `npm run spike:session-gen` | Generate Telegram session (research auth) |

### Script Validasi (CI)

Dijalankan otomatis oleh GitHub Actions pada setiap PR:

| Workflow | Trigger | Script |
|----------|---------|--------|
| `validate-sources.yml` | PR yang mengubah `data/sources.json` | `validate-sources.mjs` |
| `validate-sources.yml` | PR yang mengubah `data/contributions/` | `validate-contributions.mjs` |
| `health-check.yml` | Cron harian 17:01 UTC | `check-telegram.ts` + `generate-api.mjs` |

---

## 11. State Management di UI

Tidak ada state management library (Redux, Zustand, dll.). Semua state adalah React hooks lokal.

### AppShell State

```typescript
const [tab, setTab] = useState<TabId>("overview");
const [docsOpen, setDocsOpen] = useState(false);
const [dark, setDark] = useState(() =>
  localStorage.getItem("theme") === "dark"
);
```

### AppTab State (Dashboard Utama)

```typescript
// Filter state
const [statusFilter, setStatusFilter] = useState<HealthStatus | "all">("all");
const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
const [regionFilter, setRegionFilter] = useState<string>("all");
const [search, setSearch] = useState("");
const [sortBy, setSortBy] = useState<"score" | "name" | "subs">("score");

// UI state
const [loading, setLoading] = useState(true);
const [filterOpen, setFilterOpen] = useState(false);
const [hoverIdx, setHoverIdx] = useState<number | null>(null);
```

### Derived State (useMemo)

```typescript
// O(1) snapshot lookup
const snapshotMap = useMemo(
  () => new Map(snapshots.map(s => [s.source_id, s])),
  [snapshots]
);

// Gabungan source + snapshot
const rows = useMemo(
  () => sources.map(s => ({ source: s, snapshot: snapshotMap.get(s.id) })),
  [sources, snapshotMap]
);

// Hasil filter + sort
const filtered = useMemo(
  () => rows
    .filter(row => matchesFilters(row, statusFilter, platformFilter, regionFilter, search))
    .sort((a, b) => compareBy(a, b, sortBy)),
  [rows, statusFilter, platformFilter, regionFilter, search, sortBy]
);
```

Data mengalir **top-down** via props. Tidak ada global state atau context. Semua data bersifat read-only (immutable dari file system).
