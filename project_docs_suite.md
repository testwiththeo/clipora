# Podcast-to-Clips App — Documentation Suite

## Contents

1. PRD
2. Frontend design system spec
3. Backend API spec
4. Database schema doc
5. Implementation roadmap and sprint plan

---

# 1. PRD

## 1.1 Product name
Clipora

## 1.2 Product summary

A personal-use web application that converts long-form podcast videos into short, high-quality clips optimized for YouTube Shorts, TikTok, and Instagram Reels. The product helps a single creator import an episode, retrieve or generate a transcript, identify strong moments, edit clips quickly, apply captions and visual polish, and export platform-ready outputs.

## 1.3 Problem statement

Turning long podcasts into short clips manually is slow and repetitive. The creator must scrub through hours of footage, find quotable moments, trim clips, write captions, format for vertical video, and export in platform-specific formats. Existing tools are often too manual, too bloated, or too SaaS-oriented for a single-user workflow.

## 1.4 Goals

- Reduce time from episode import to first usable clip.
- Automatically identify promising highlight candidates from transcript and content analysis.
- Provide a fast, calm, editor-style interface for refining clips.
- Support transcript retrieval, fallback transcription, subtitle styling, reframing, and export.
- Keep the system lightweight enough for local or private deployment.
- Support optional color grading presets and simple manual controls.

## 1.5 Non-goals

- Multi-tenant SaaS features
- Billing, subscriptions, or public account signup
- Team collaboration and permissions
- Enterprise-scale orchestration
- Full professional NLE features comparable to Resolve or Premiere
- Social publishing integrations in v1

## 1.6 Target user

Primary user: one creator or operator who regularly converts podcast episodes into short-form clips and values speed, consistency, and control more than multi-user collaboration.

## 1.7 Key use cases

- Import a YouTube podcast episode by URL.
- Retrieve the official transcript when available.
- Fall back to Whisper transcription when needed.
- Review transcript chunks and AI-ranked highlight suggestions.
- Open a clip in an editor and adjust timing.
- Apply subtitles, framing, and grading.
- Render preview and export final vertical clip.

## 1.8 Core features

### Ingestion

- YouTube URL import
- Local media upload
- Metadata retrieval
- Thumbnail and duration extraction

### Transcript pipeline

- Transcript fetch via `youtube-transcript-api`
- Fallback via `yt-dlp` + Whisper/faster-whisper
- Timestamp normalization and storage

### Highlight discovery

- Transcript segmentation
- Embedding-based semantic analysis
- Keyphrase extraction
- Candidate highlight ranking

### Clip editing

- Clip start/end adjustment
- Video preview
- Transcript-linked seeking
- Candidate-to-clip conversion

### Styling

- Subtitle presets and customization
- Platform aspect ratios
- Reframing/cropping
- Optional color grading presets and controls

### Rendering and export

- Preview render
- Final export
- Platform presets for Shorts/Reels/TikTok
- Render queue and status monitoring

## 1.9 Functional requirements

### FR-1 Ingest episode

The user can create an episode from a YouTube URL or file upload.

### FR-2 Retrieve transcript

The system attempts transcript retrieval from YouTube first and stores the result if successful.

### FR-3 Fallback transcription

If retrieval fails or is poor quality, the system downloads audio and transcribes with Whisper.

### FR-4 Segment transcript

The system converts raw transcript content into semantically coherent segments.

### FR-5 Rank highlights

The system computes insight scores and proposes candidate highlight windows.

### FR-6 Create clip

The user can turn a candidate into an editable clip and manually adjust timestamps.

### FR-7 Render preview

The system can render a low- or medium-resolution preview with selected styling settings.

### FR-8 Export final clip

The system can export a final platform-ready video with captions and transformations applied.

### FR-9 Persist project state

The system saves episode, transcript, candidate, clip, and render metadata for later return.

## 1.10 Non-functional requirements

- Fast perceived responsiveness in UI
- Reliable local/private operation
- Clear logs and error visibility
- Minimal deployment complexity
- Easy debugging with file-based artifacts
- Efficient handling of long video files

## 1.11 Success metrics

- Time from import to first clip candidate
- Time from candidate selection to final export
- Percentage of usable highlight suggestions per episode
- Number of manual edits required per accepted clip
- Preview render turnaround time
- Final export success rate

## 1.12 Constraints

- Personal-use scope only
- Local or private server deployment preferred
- Open-source friendly stack
- FFmpeg and Whisper are core dependencies

## 1.13 Risks

- Transcript quality varies by source
- Whisper inference can be slow on weak hardware
- Browser preview can diverge from FFmpeg final render
- Overcomplicated UI can reduce speed and trust

## 1.14 MVP definition

The MVP is complete when a single user can import a YouTube podcast, retrieve or generate a transcript, receive highlight suggestions, edit one suggested clip, apply captions and platform framing, and export a final short-form video.

---

# 2. Frontend design system spec

## 2.1 Design intent

The frontend should feel like a calm professional editing tool rather than a flashy AI dashboard. The visual language should be clean, sleek, minimal, compact, and precise.

## 2.2 Design principles

- Use structure over decoration.
- Use typography to establish hierarchy.
- Prefer borders over heavy shadows.
- Keep surfaces quiet and neutral.
- Use one accent color sparingly.
- Favor medium-density workspace layouts.
- Design for editing workflows, not landing-page aesthetics.

## 2.3 Anti-slop rules

Avoid by default:

- giant gradients
- glassmorphism
- oversized shadows
- too many floating cards
- huge pill shapes everywhere
- multiple accent color families
- landing-page hero composition inside app screens
- oversized stat cards with little utility

Require by default:

- neutral-first palette
- subtle borders
- compact controls
- restrained radius
- list and panel layouts
- split-pane editor patterns
- low-noise interaction states

## 2.4 Visual tokens

### Color tokens

- `bg.app`
- `bg.surface`
- `bg.surfaceElevated`
- `border.default`
- `text.primary`
- `text.secondary`
- `text.muted`
- `accent.default`
- `accent.foreground`
- `status.success`
- `status.warning`
- `status.error`

### Recommended direction

- 85 to 90 percent neutrals
- 10 to 15 percent accent and semantic color
- one blue, indigo, or emerald accent family

### Typography scale

- Page title: 28 / semibold
- Section title: 18 / semibold
- Body: 14 to 15 / regular
- Label: 13 to 14 / medium
- Meta/helper: 12 to 13 / regular

### Radius

- Buttons and inputs: 8 to 10 px
- Panels: 12 to 16 px
- Overlays: 12 to 16 px

### Spacing rhythm

Use a 4 px / 8 px scale.

- 4: tight gaps
- 8: control spacing
- 12: small groups
- 16: default padding
- 24: section spacing
- 32: larger layout gaps

## 2.5 Layout primitives

- `AppShell`
- `SidebarNav`
- `Topbar`
- `PageHeader`
- `SplitPane`
- `InspectorPanel`
- `SectionHeader`
- `CommandBar`
- `FilterBar`

These primitives should be reused across most pages to maintain consistency.

## 2.6 Core components

### Base controls

- `Button`
- `IconButton`
- `Input`
- `Textarea`
- `Select`
- `Tabs`
- `Checkbox`
- `Switch`
- `Badge`
- `Tooltip`
- `Divider`
- `Dialog`
- `DropdownMenu`
- `Toast`
- `Skeleton`
- `EmptyState`

### Structural components

- `Panel`
- `Card` only where necessary
- `DataRow`
- `MetadataPair`
- `StatusPill`
- `Toolbar`

### Domain components

- `EpisodeListRow`
- `EpisodeHeader`
- `TranscriptSegment`
- `HighlightCandidateRow`
- `TimestampTag`
- `InsightScoreBadge`
- `VideoPreviewPanel`
- `ClipTimeline`
- `SubtitleStylePanel`
- `ColorGradeControls`
- `ExportPresetPanel`
- `RenderJobItem`

## 2.7 Component behavior guidelines

### Buttons

- Compact height
- Clear hierarchy: primary, secondary, ghost
- No dramatic shadows or gradients
- Accent reserved mainly for primary action and active states

### Inputs

- Quiet neutral background
- Clear border
- Subtle focus ring
- Compact sizing
- Placeholder text muted but readable

### Panels

- Use border and subtle background contrast
- Minimal shadow
- Low chrome
- Modest padding

### Lists and rows

- Prefer rows over oversized cards
- Hover state should be subtle
- Selection state must be clearly visible
- Metadata aligned consistently

## 2.8 Page templates

### Dashboard

Use a simple header with quick import, then lists for recent episodes, drafts, and recent renders. Avoid generic analytics-dashboard patterns.

### Episode detail

Top metadata strip, transcript as primary content, candidate highlights in adjacent panel, and quick actions in a compact toolbar.

### Clip editor

Main preview area, lower timeline strip, right-side inspector with tabs for captions, reframing, grading, and export.

### Settings

Grouped vertical sections with minimal nesting. No excessive cards.

## 2.9 Accessibility requirements

- Adequate text contrast
- Keyboard navigable controls
- Visible focus states
- Semantic labels for form controls
- Accessible dialog and menu patterns

## 2.10 Tailwind implementation guidance

- Use tokenized utility patterns consistently.
- Prefer reusable class recipes or component wrappers.
- Avoid arbitrary one-off styling whenever possible.
- Keep the UI looking strong in grayscale.

## 2.11 Acceptance criteria

The frontend design system is acceptable when new screens can be built from the existing primitives without visual drift, and the product feels consistent, calm, and editing-focused rather than decorative.

---

# 3. Backend API spec

## 3.1 API style

- RESTful JSON API
- FastAPI implementation
- Background-job driven for long-running tasks
- Clear status and error responses

## 3.2 Base URL

```text
/api/v1
```

## 3.3 Common response shape

### Success

```json
{
  "success": true,
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message"
  }
}
```

## 3.4 Episode endpoints

### POST `/episodes/import/youtube`

Create an episode from a YouTube URL and start import.

Request:

```json
{
  "url": "https://www.youtube.com/watch?v=..."
}
```

Response:

```json
{
  "success": true,
  "data": {
    "episode_id": "ep_123",
    "status": "queued"
  }
}
```

### POST `/episodes/upload`

Create an episode from uploaded media.

### GET `/episodes`

List episodes.

Query params:

- `status`
- `limit`
- `offset`
- `search`

### GET `/episodes/{episode_id}`

Return full episode metadata.

### DELETE `/episodes/{episode_id}`

Delete episode metadata and optionally related local assets.

## 3.5 Transcript endpoints

### GET `/episodes/{episode_id}/transcript`

Returns transcript segments.

### POST `/episodes/{episode_id}/transcript/rebuild`

Re-run normalization or rebuild transcript artifacts.

### POST `/episodes/{episode_id}/transcript/whisper`

Force Whisper transcription path.

Request:

```json
{
  "model": "base"
}
```

## 3.6 Analysis endpoints

### POST `/episodes/{episode_id}/analyze`

Run segmentation and highlight scoring.

Request:

```json
{
  "target_clip_duration_min": 20,
  "target_clip_duration_max": 60
}
```

### GET `/episodes/{episode_id}/highlights`

Get ranked candidate highlight windows.

Response item example:

```json
{
  "id": "hc_001",
  "start_ms": 125000,
  "end_ms": 167000,
  "title": "Why distribution beats talent",
  "score": 0.87,
  "summary": "A concise explanation of why consistent distribution matters more than raw talent."
}
```

## 3.7 Clip endpoints

### POST `/clips`

Create a clip from candidate or manual timestamps.

Request:

```json
{
  "episode_id": "ep_123",
  "candidate_id": "hc_001",
  "start_ms": 125000,
  "end_ms": 167000,
  "title": "Why distribution beats talent"
}
```

### GET `/clips/{clip_id}`

Return clip metadata and styling settings.

### PATCH `/clips/{clip_id}`

Update clip timing or styling settings.

Request example:

```json
{
  "start_ms": 123000,
  "end_ms": 168500,
  "subtitle_style": {
    "preset": "bold_clean"
  },
  "grade": {
    "preset": "podcast_studio",
    "contrast": 1.08,
    "saturation": 1.05
  }
}
```

## 3.8 Render endpoints

### POST `/clips/{clip_id}/preview-render`

Queue a preview render.

Request:

```json
{
  "resolution": "720x1280"
}
```

### POST `/clips/{clip_id}/final-render`

Queue final export render.

Request:

```json
{
  "export_preset": "youtube_shorts"
}
```

### GET `/render-jobs`

List render jobs.

### GET `/render-jobs/{job_id}`

Get render job status and output metadata.

Response:

```json
{
  "success": true,
  "data": {
    "job_id": "job_123",
    "status": "processing",
    "progress": 62,
    "output_path": null
  }
}
```

## 3.9 Preset endpoints

### GET `/presets/export`

List export presets.

### GET `/presets/subtitles`

List subtitle presets.

### GET `/presets/grading`

List grading presets.

### POST `/presets/grading`

Create or save a custom grading preset.

## 3.10 Status lifecycle

### Episode status

- `created`
- `importing`
- `transcript_ready`
- `analyzing`
- `ready`
- `failed`

### Render job status

- `queued`
- `processing`
- `completed`
- `failed`
- `cancelled`

## 3.11 Error codes

Examples:

- `INVALID_URL`
- `TRANSCRIPT_NOT_FOUND`
- `MEDIA_DOWNLOAD_FAILED`
- `TRANSCRIPTION_FAILED`
- `RENDER_FAILED`
- `EPISODE_NOT_FOUND`
- `CLIP_NOT_FOUND`

## 3.12 API acceptance criteria

The API is acceptable when the frontend can complete the full flow of import, transcript retrieval, analysis, clip creation, preview render, and final export using documented endpoints only.

---

# 4. Database schema doc

## 4.1 Database choice

Use SQLite for MVP. It is simple, local-friendly, and adequate for a single-user workflow. Move to Postgres only if later needs justify it.

## 4.2 Entity overview

Main entities:

- episodes
- transcript_segments
- highlight_candidates
- clips
- render_jobs
- presets

## 4.3 Table: `episodes`

Purpose: stores imported source metadata and lifecycle state.

Columns:

- `id` TEXT PRIMARY KEY
- `source_type` TEXT NOT NULL
- `source_url` TEXT
- `title` TEXT NOT NULL
- `channel_name` TEXT
- `description` TEXT
- `duration_seconds` INTEGER
- `thumbnail_url` TEXT
- `local_media_path` TEXT
- `audio_path` TEXT
- `transcript_status` TEXT NOT NULL
- `analysis_status` TEXT NOT NULL
- `error_message` TEXT
- `created_at` DATETIME NOT NULL
- `updated_at` DATETIME NOT NULL

## 4.4 Table: `transcript_segments`

Purpose: stores normalized transcript chunks or segments.

Columns:

- `id` TEXT PRIMARY KEY
- `episode_id` TEXT NOT NULL
- `sequence_index` INTEGER NOT NULL
- `start_ms` INTEGER NOT NULL
- `end_ms` INTEGER NOT NULL
- `text` TEXT NOT NULL
- `speaker_label` TEXT
- `source_kind` TEXT NOT NULL
- `created_at` DATETIME NOT NULL

Foreign keys:

- `episode_id` references `episodes(id)`

Indexes:

- `(episode_id, sequence_index)`
- `(episode_id, start_ms)`

## 4.5 Table: `highlight_candidates`

Purpose: stores ranked candidate clips derived from analysis.

Columns:

- `id` TEXT PRIMARY KEY
- `episode_id` TEXT NOT NULL
- `start_ms` INTEGER NOT NULL
- `end_ms` INTEGER NOT NULL
- `title` TEXT
- `summary` TEXT
- `score` REAL NOT NULL
- `rationale_json` TEXT
- `created_at` DATETIME NOT NULL

Foreign keys:

- `episode_id` references `episodes(id)`

Indexes:

- `(episode_id, score DESC)`
- `(episode_id, start_ms)`

## 4.6 Table: `clips`

Purpose: stores editable clip records and styling state.

Columns:

- `id` TEXT PRIMARY KEY
- `episode_id` TEXT NOT NULL
- `candidate_id` TEXT
- `title` TEXT
- `start_ms` INTEGER NOT NULL
- `end_ms` INTEGER NOT NULL
- `subtitle_style_json` TEXT
- `framing_json` TEXT
- `grade_json` TEXT
- `preview_path` TEXT
- `output_path` TEXT
- `export_status` TEXT NOT NULL
- `created_at` DATETIME NOT NULL
- `updated_at` DATETIME NOT NULL

Foreign keys:

- `episode_id` references `episodes(id)`
- `candidate_id` references `highlight_candidates(id)`

Indexes:

- `(episode_id, created_at DESC)`
- `(candidate_id)`

## 4.7 Table: `render_jobs`

Purpose: stores preview and final render tasks.

Columns:

- `id` TEXT PRIMARY KEY
- `clip_id` TEXT NOT NULL
- `job_type` TEXT NOT NULL
- `status` TEXT NOT NULL
- `progress` INTEGER DEFAULT 0
- `log_path` TEXT
- `output_path` TEXT
- `error_message` TEXT
- `created_at` DATETIME NOT NULL
- `updated_at` DATETIME NOT NULL

Foreign keys:

- `clip_id` references `clips(id)`

Indexes:

- `(clip_id, created_at DESC)`
- `(status, created_at DESC)`

## 4.8 Table: `presets`

Purpose: stores reusable subtitle, export, or grading presets.

Columns:

- `id` TEXT PRIMARY KEY
- `preset_type` TEXT NOT NULL
- `name` TEXT NOT NULL
- `config_json` TEXT NOT NULL
- `is_system` BOOLEAN NOT NULL DEFAULT 0
- `created_at` DATETIME NOT NULL
- `updated_at` DATETIME NOT NULL

Indexes:

- `(preset_type, name)`

## 4.9 Example JSON fields

### `subtitle_style_json`

```json
{
  "preset": "bold_clean",
  "font_size": 54,
  "position": "bottom",
  "highlight_words": true
}
```

### `framing_json`

```json
{
  "aspect_ratio": "9:16",
  "crop_mode": "speaker_focus",
  "safe_margin": true
}
```

### `grade_json`

```json
{
  "preset": "podcast_studio",
  "brightness": 0.03,
  "contrast": 1.08,
  "saturation": 1.06,
  "temperature": 0.02
}
```

## 4.10 File storage convention

Use DB for metadata and filesystem for heavy media artifacts.

Suggested layout:

```text
data/
  episodes/{episode_id}/source/
  episodes/{episode_id}/audio/
  episodes/{episode_id}/transcript/
  episodes/{episode_id}/analysis/
  episodes/{episode_id}/clips/
  episodes/{episode_id}/previews/
  episodes/{episode_id}/exports/
```

## 4.11 Schema acceptance criteria

The schema is acceptable when it can support import, transcript retrieval, analysis, clip editing, preview rendering, final export, and preset reuse without ad hoc storage hacks.

---

# 5. Implementation roadmap and sprint plan

## 5.1 Delivery approach

Build in thin vertical slices. Each sprint should produce an end-to-end capability rather than isolated technical work.

## 5.2 Suggested sprint length

- 1 week for solo rapid execution, or
- 2 weeks if balancing with other work

## 5.3 Phase overview

- Phase 0: setup and foundation
- Phase 1: ingestion and transcript
- Phase 2: analysis and suggestions
- Phase 3: clip editing and previews
- Phase 4: export and presets
- Phase 5: grading and polish

## 5.4 Sprint 0 — project setup

Goal: establish the repo, stack, and dev ergonomics.

Deliverables:

- Next.js frontend scaffold
- FastAPI backend scaffold
- Docker Compose setup
- SQLite connection
- local data directory conventions
- logging and config setup
- shared environment variables

Exit criteria:

- frontend and backend run locally
- basic health endpoints work
- project structure is finalized

## 5.5 Sprint 1 — YouTube import and metadata

Goal: ingest an episode source.

Deliverables:

- YouTube URL form in frontend
- API endpoint for import request
- `yt-dlp` metadata retrieval
- episode record creation
- episode list page
- episode detail shell page

Exit criteria:

- user can paste a YouTube URL and see an episode record appear

## 5.6 Sprint 2 — transcript retrieval and fallback transcription

Goal: obtain reliable transcript data.

Deliverables:

- transcript fetch via `youtube-transcript-api`
- fallback path via `yt-dlp` + Whisper
- transcript storage in DB
- transcript normalization logic
- transcript viewer in frontend

Exit criteria:

- at least one imported episode reliably shows transcript content with timestamps

## 5.7 Sprint 3 — segmentation and highlight ranking

Goal: generate candidate clip moments.

Deliverables:

- semantic chunking service
- embeddings pipeline
- keyphrase extraction
- candidate ranking logic
- highlight candidate list UI
- candidate detail preview linking

Exit criteria:

- user can review ranked highlight candidates for an episode

## 5.8 Sprint 4 — clip creation and editing

Goal: turn candidates into editable clips.

Deliverables:

- create clip from candidate
- manual timing adjustment
- transcript-linked seeking
- clip detail page
- clip editor layout with preview and inspector shell

Exit criteria:

- user can create a clip and update start/end timestamps

## 5.9 Sprint 5 — subtitle styling and preview render

Goal: make clips visually usable.

Deliverables:

- subtitle style presets
- subtitle style controls in inspector
- preview render endpoint
- preview render job status UI
- preview playback in editor

Exit criteria:

- user can preview a styled clip with captions

## 5.10 Sprint 6 — export presets and final render

Goal: produce final deliverables.

Deliverables:

- export presets for Shorts/Reels/TikTok
- final render job endpoint
- output file management
- download/export UI
- render job history

Exit criteria:

- user can export a final platform-ready clip and download it

## 5.11 Sprint 7 — color grading MVP

Goal: add lightweight visual polish.

Deliverables:

- grading preset model
- grading controls UI
- FFmpeg grading filter integration
- preview and final export support for grading

Exit criteria:

- user can apply a grading preset and export with it

## 5.12 Sprint 8 — UX polish and quality pass

Goal: make the app feel cohesive and production-ready for personal use.

Deliverables:

- frontend consistency cleanup
- design token hardening
- better empty states and error states
- performance tuning
- improved logs and troubleshooting visibility

Exit criteria:

- workflow is stable and pleasant for repeated use

## 5.13 Backlog after MVP

- custom reusable grading presets
- waveform visualization
- face-aware smart reframing
- multilingual transcript support
- better speaker detection
- bulk episode processing
- keyboard shortcuts in editor
- smarter candidate deduplication

## 5.14 Prioritization rules

When in doubt, prioritize:

1. End-to-end workflow completion
2. Reliability of transcript and render pipeline
3. Editor usability
4. Visual polish
5. Advanced AI features

## 5.15 Definition of done

A sprint item is done when:

- code is committed
- local dev flow works
- happy path is manually verified
- key edge cases are handled or logged clearly
- no major UI drift from design system

## 5.16 Roadmap acceptance criteria

The roadmap is acceptable when each sprint clearly advances the user from raw episode import toward finished short-form export without unnecessary detours.

---

# Final note

This suite is intended to act as the practical starting documentation set for the project. It is intentionally optimized for a single-user, high-leverage workflow and should be kept disciplined: simple architecture, clear API boundaries, restrained UI system, and reliable media processing pipeline.
