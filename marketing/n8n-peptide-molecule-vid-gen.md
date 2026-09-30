# peptide_molecule_vid_gen

**New workflow** — chemical-breakdown molecule videos.  
**Not** the lab-vial daily path. Creatomate is last-frame + 30s concat only (no text template). Hop 1/2 use Switch for done / wait / quota.

**Sheet:** `13-chem-breakdown-54` (same columns as Sheet 9)  
**Name the workflow exactly:** `peptide_molecule_vid_gen`  
**Live (unpublished):** https://stockjohnson.app.n8n.cloud/workflow/EcGTbpZ9VG3C69pq  
**Smoke test (unpublished):** `peptide_molecule_vid_gen_v2`, https://stockjohnson.app.n8n.cloud/workflow/Hc1US0JgKRvM2opn. Row 1 has a finished 30s video. `grok_imagine_molecule_still` is deactivated. See *Smoke test* below.  
**Workbook:** https://docs.google.com/spreadsheets/d/1XiCR6vs0tb4EawPE5hVlqYn3JElsOKsTDaH6HLbyHY0 — tab `13-chem-breakdown-54`.

**Vibe (mandatory):** dark cinematic 3D **medical animation of a cellular chemical reaction** — living cells + amino acids forming peptide bonds at microscopic scale. Not a sunlit studio. Not a glass pedestal. Not the pen workflow. **No logo. No text. No sound** (add those after vid gen). Clip is muted (`audio: false`).

Sister workflow (pens, separate import): `peptide_pen_vid_gen` → Sheet `14-pen-creations-150`. Do not mix sheets.

**fx:** **ON** = Expression · **OFF** = Fixed

---

## Audit — 2026-09-29 (read-only; no node, sheet row, or run was changed)

**Status: blocked by the 720p ban.** All 54 Sheet 13 rows read `resolution=720p` and `model_video=kwaivgi/kling-v3.0-pro`, and OpenRouter serves that model at **720p only** (`supported_resolutions: ["720p"]`). The one finished 30s clip, CHEM-007 Sermorelin, measures **720 × 1280** (header of the Creatomate concat MP4). Nothing this workflow makes today can ship.

**Why Creatomate is here — two jobs, both only because Kling caps at 15s:**

1. `creatomate_last_frame` renders a JPG of hop 1 at `duration − 0.1s`. That JPG is hop 2's first frame.
2. `creatomate_concat` joins hop 1 + hop 2 into the 30s MP4 that is written to `video_url`.

It adds no text, logo, or music. Creatomate cannot fetch OpenRouter's auth-gated `unsigned_urls`, so each hop is downloaded and re-uploaded to litterbox (72h) first.

**Node count.** 42 on canvas = 41 working nodes + 1 sticky. 23 exist only to turn two 15s clips into one 30s clip (hop 1 rehost 3, last frame 4, hop 2 9, hop 2 rehost 3, concat 4). 2 more are the Kling quota resubmit on hop 1.

**Hardcodes (AGENTS.md no-hardcode rule):**

| Node | Hardcoded |
|---|---|
| `prep_kling_extend` | Creative prompt block prefixed to hop 2 (“Continue from the last frame … NO pens.”) plus `Same '<compound>' reaction subject, never printed.`; `\|\| '9:16'`, `\|\| 15`, `\|\| 180` |
| `prep_last_frame`, `prep_creatomate_concat` | `\|\| '720p'`, `\|\| '9:16'`, `\|\| 15`; 720 × 1280 frame default |
| `creatomate_concat` | `\|\| 1080` / `\|\| 1920` in its own inline body (`prep_creatomate_concat`'s `creatomate_body_json` is never read) |
| `prep_molecule_video_start` | `wait_seconds \|\| 180` (Sheet 13 has no `wait_seconds` column) |
| `route_hop1` / `route_hop2` | 600s budget, 45s poll math, 5 quota retries |
| Wait nodes | 45s / 90s / 20s |
| `grok_imagine_molecule_still` | `n: 1` |
| `save_video_url` | `duration_seconds: 30` |
| `pick_molecule_creation` | Invents `PBVita-Chem-###` when `creation_id` is blank; blank `status` counts as Active; silent cut at 7,900 chars; Kling's 3–15s limit |
| `prep_molecule_video_start` / `prep_kling_extend` | Silent cut at 2,500 chars; Kling's 3–15s limit (blocks a 30s row) |

**Uniqueness.** 54 rows, **6 looks**. `look_for_rank` in `build_chem_breakdown_54.py` moves shot, surface, lighting, and grade off one counter (`i % 6`, `(i+1) % 6`, …), so ranks 1, 7, 13, … share one look. There are 6 distinct `video_motion_prompt`s, and 5 of them tell the camera to “then hold”. Hop 2 reuses hop 1's motion prompt. All 54 still prompts quote a compound name (`'Tirzepatide' is never printed as text`). This doc says `pick_molecule_creation` never repeats the last 5 compounds; the code only sorts by use count, then rank.

**Row burn.** `sheets_update_chem` bumps `times_used` before the still. CHEM-001 … 009 read `times_used=1`; only CHEM-007 has a `video_url`. Exec 2579 (2026-09-29) claimed CHEM-009 Tirzepatide and made a still (1584 × 2816, no text), then stopped by design. Proposed: one sheet write after the video is saved, so a still-only partial run or a failed run does not burn the row and a pinned still stays matched to its row. **Sal: YES (2026-09-30)** — count a use only after the video is saved, and reset CHEM-001 … 009 to unused.

**Mirrors.** `marketing/workflows/peptide_molecule_vid_gen.json` is an old 18-node Grok-video export, not the live 42-node workflow. The Sheet 13 CSV trails live on use counts, and CHEM-027 / -041 read `CJC/Ipamorelin` live but `CJC (no DAC)/Ipamorelin` inside their prompt text.

**Model pick — superseded 2026-09-30.** Sal chose Kling v3 Pro, 15s + 15s, joined in Creatomate, with Grok Imagine 2.0 kept and GPT Image 2.5 added for a smoke test. See *Smoke test — `23-molecule-smoke-2`* below. The Wan 3.0 notes stay for reference. Video: **Wan 3.0** (`alibaba/wan-3.0`) is the only native-1080p model on OpenRouter's full video list that renders 30s in one pass (Wan 3.0 Prime is the same model, faster, at $0.28/s). fal hosts it too (`alibaba/wan-3.0/image-to-video`, same price). It is #2 on Artificial Analysis image-to-video (2026-09-18) and holds the first frame well; the known risk is an uncommanded cut or dissolve inside long clips. Alibaba's Wan 3.0 guide lists single-shot and multi-shot modes (multi-shot = 4–6s shots marked with timestamps) and opens its single-take example with `[One continuous take, … no cuts, …-second long shot, …]`. Rebuilt motion prompts should open the same way and carry no timestamps. `1080P` is Wan 3.0's default tier in Alibaba's own API reference. $0.20/s at 1080p = **$6.00 per 30s**. Seedance 2.5 also does 30s in one pass, but it renders natively at 720p (fal's `1080p` option counts as an upscale). Still: keep Grok Imagine Image 2.0 (real 2K 9:16, top 5 on both image boards); A/B GPT Image 2.5 on one row before switching.

**Proposed rebuild (Wan 3.0) — superseded 2026-09-30 by the smoke-test plan below. Nothing was built.**

```text
manual_trigger → get_chem_creations (filter status = Active) → pick_molecule_creation
  → grok_imagine_molecule_still → save_still_url
  → video_start (Wan 3.0; model, prompt, 30s, 1080p, 9:16 from the sheet; audio off) → wait_video → video_poll → route_video
       done    → fal: video_result  |  OpenRouter: download_video → drive_upload_video
               → sheets_update_chem (times_used + 1, last_used_at, video_url, seed) → end
       running → wait_video
       failed or over the sheet's poll budget → stop_video_failed → end
```

12 nodes on fal (public `video.url`), 13 on OpenRouter (the content URL needs a rehost). Sheet 13 needs the new `model_video`, `resolution=1080p`, `duration_seconds=30`, poll seconds + budget columns, and 54 rebuilt rows with unique looks and 30s motion scripts.

---

## Smoke test — `23-molecule-smoke-2` (built 2026-09-30 as `peptide_molecule_vid_gen_v2`)

**Built as a new workflow.** Sal chose a new workflow over editing the old one, so `peptide_molecule_vid_gen` keeps all 42 nodes at version `80cb697c-b426-4f0f-aa76-8b68aa10e4ea`, untouched. Row 1's 30s video is saved (exec 2585).

**Live sheet (2026-09-30, after both smokes):** `peptide_molecule_vid_gen_v2` now reads **`14-chem-breakdown-54`**, not the 2-row smoke tab. Sheet 13 is untouched, so the old workflow still has its own library. The new tab is the smoke-test shape: GPT Image 2.5 Sunburst stills, fal Kling v3 Pro 15s+15s at 1080p, 1080×1920, `times_used` 0 on every row.

- **Workflow:** `peptide_molecule_vid_gen_v2`, ID `Hc1US0JgKRvM2opn`, unpublished, in the root of Sal's personal project. [Open it](https://stockjohnson.app.n8n.cloud/workflow/Hc1US0JgKRvM2opn).
- **Source:** `python3 marketing/scripts/build_molecule_vid_gen_v2.py --notes-sha <commit>` writes `marketing/workflows/peptide_molecule_vid_gen_v2.sdk.js`, the Workflow SDK code the workflow was created from.
- **Checked after creation:** 33 nodes (29 working + 4 notes), every credential attached, no pinned data, and every Code node byte-for-byte equal to its file in `marketing/n8n-molecule-smoke/`.
- **2026-09-30, after the first smoke run:** `grok_imagine_molecule_still` is deactivated (still on the canvas, not deleted). The nodes sit on one row, the same spacing as the other vid-gen workflows, and the note text is half the first size.

**Sal's calls (2026-09-30):**
1. Kling v3 Pro, 15s + 15s, stitched in Creatomate.
2. Keep the Grok Imagine 2.0 still node and add GPT Image 2.5 for a smoke test.
3. Hyperreal but sci-fi — it has to look cool, not like microscope footage. Start with a new sheet of 2 rows; rebuild Sheet 13 only if he likes the result.
4. Count a use only after the video is saved, and reset CHEM-001 … 009 to unused.
5. Build it as a new workflow and leave the old one alone.
6. Make the sticky-note text 4× bigger.

### Sheet

`23-molecule-smoke-2`:
- Doc `1QQggXUyfbLTeQDzNN-HwHJ7lZwDN8y2qSyyIcFHVsLs`, tab gid `105980795`. [Open the sheet](https://docs.google.com/spreadsheets/d/1QQggXUyfbLTeQDzNN-HwHJ7lZwDN8y2qSyyIcFHVsLs/edit).
- Mirror: `marketing/sheets/23-molecule-smoke-2.csv`, built by `python3 marketing/scripts/build_molecule_smoke_2.py` (`--xlsx` also writes the upload copy).
- 37 columns. Every generation value is a cell.
- The output columns (`still_url`, `hop1_video_url`, `last_frame_url`, `hop2_video_url`, `video_url`, `last_used_at`) start blank.

| Row | Compound | Look | Still engine |
|---|---|---|---|
| `PBVita-MolSmoke-01` | GHK-Cu | Copper star (teal + copper) | `openai/gpt-image-2.5-sunburst` on OpenRouter, `still_size` 1440x2560, `still_quality` high |
| `PBVita-MolSmoke-02` | BPC-157 | Rising chain (cyan + violet + white-gold) | `openai/gpt-image-2.5-sunburst` on OpenRouter, `still_size` 1440x2560, `still_quality` high |

**Both rows:**
- Video: `fal-ai/kling-video/v3/pro/image-to-video`, `resolution` 1080p, 15s + 15s, `cfg_scale` 0.5.
- Render: 1080 × 1920 at 24 fps, mp4 out, with a png hand-off frame.
- **A/B:** both engines' columns are filled on both rows. That comparison is parked while `grok_imagine_molecule_still` is deactivated. On 2026-09-30 row 2's `model_still` was set to `openai/gpt-image-2.5-sunburst`, so the next pick takes the true branch.

**Prompt shape:**
- **Still:** one shared hyperreal sci-fi header, then HERO, WORLD, LIGHT, CAMERA and COLOR, then a lock line (no text, no people, no vials or pens).
- **Motion:** each motion prompt is one continuous take that is still moving on its last frame, and hop 2 continues hop 1's move.
- **Negative:** one `negative_prompt` shared by both rows.

Characters sent (video prompts include the silent lock); Kling's cap is 2,500:

| Row | Still | Hop 1 | Hop 2 |
|---|---|---|---|
| Row 1 | 1,851 | 784 | 671 |
| Row 2 | 1,776 | 677 | 652 |

### Why these hosts

**Kling on fal, not OpenRouter.**
- OpenRouter lists Kling v3 Pro at 720p only, which is banned.
- fal returns 1080 × 1920 (measured: 24 fps, 15.04s), with public `video.url`s Creatomate can fetch directly, so no rehost.
- The lab, landscape and pen workflows already run it.
- $0.112/s with audio off: $1.68 per hop, **$3.36 per 30s**.
- Concurrency is 1, so don't run two Kling jobs at once.

**GPT Image 2.5 on OpenRouter** (`POST https://openrouter.ai/api/v1/images`, credential **OpenRouter account**).
- **`size` is required.** The model's endpoint record doesn't list `size`, but the API reference does: explicit pixels are authoritative, and a mismatched `aspect_ratio` alongside returns a 400. 1440x2560 is exactly 9:16. OpenRouter's own gpt-image-2 example asked for 16:9 with no size and got 1536 × 864, so a 9:16 still without `size` would come back about 864 × 1536, narrower than the video.
- **Size check:** `check_gpt_still` measures the returned image and stops the run before any video spend unless it is exactly `still_size`.
- **Format:** no `output_format` is sent, so the provider default comes back (PNG for OpenAI). JPEG and WebP are read too.
- **Cost:** failed generations (400/502) aren't billed. Estimate $0.2–0.5 per still at `high`.

**Creatomate v2 with Bearer Auth account 2** (`02s8mB0EmuoResHc`, httpBearerAuth).
- **Why this credential:** that key made Creatomate v2 calls for Hook 15s and Study 30s (2026-09-24/26). **Creatomate PbVita** (`UkuSlYOEACCWm5rB`) was last seen returning `401 The provided API key is invalid` (exec 2140).
- **Resolution cap:** free plans clamp renders to ≤ 480 px, and this account's past output is above that. The CHEM-007 join is 720 × 1280 only because its OpenRouter hops were 720p; the Study snapshots from 2026-09-25 are 1080 × 1920. `route_render` also stops the run if a render comes back smaller than the sheet's size.
- **Credits:** about 16 per run (1 for the frame, about 15 for the 30s join).

### Seam

- **Cut point:** `hop1_duration_seconds − 1 / render_frame_rate` = 15 − 1/24 = 14.958333 s, which is exactly frame 359 of hop 1.
- **Hand-off:** `creatomate_last_frame` snapshots that frame as hop 2's start image. `creatomate_concat` trims hop 1 at the same point and plays hop 2 right after it on one track, so no frame is repeated or skipped.
- **Check by eye at 0:15:** hop 2's first frame is Kling's re-render of the hand-off frame, not a pixel copy.
- **Dry run:** both Creatomate bodies passed `dry_run` (valid, no warnings, no credits).

### Wire

```text
manual_trigger → get_chem_creations → filter_chem_active → pick_molecule_creation → route_still_model
  true  (openai/gpt-image-*)   → gpt_image_molecule_still → check_gpt_still → gpt_still_to_file → upload_gpt_still → save_still_url
  false (grok-imagine-image-*) → grok_imagine_molecule_still (deactivated) → save_still_url
→ prep_molecule_video_start → fal_kling_hop1 → prep_last_frame
→ creatomate_last_frame → wait_last_frame → creatomate_last_frame_poll → route_last_frame → switch_last_frame
     true → prep_kling_extend        false → wait_last_frame
→ fal_kling_hop2 → prep_creatomate_concat
→ creatomate_concat → wait_concat → creatomate_poll → route_concat → switch_concat
     true → save_video_url           false → wait_concat
→ sheets_update_video → end
```

The canvas has 33 nodes: 29 working + 4 notes. Compared with the old workflow's 42 (41 working + 1 note):

- **Dropped (23):**
  - `sheets_update_chem`
  - OpenRouter video: `openrouter_i2v_start`, `openrouter_i2v_poll`, `openrouter_i2v_extend`, `openrouter_i2v_extend_poll`
  - OpenRouter waits: `wait_i2v`, `wait_i2v_again`, `wait_i2v_quota`, `wait_i2v_extend`, `wait_i2v_extend_again`, `wait_i2v_extend_quota`
  - Quota retry and routing: `retry_hop1_body`, `retry_hop2_body`, `route_hop1`, `route_hop2`, `switch_hop1`, `switch_hop2`
  - Rehost: `download_hop1`, `upload_hop1_public`, `parse_hop1_public`, `download_hop2`, `upload_hop2_public`, `parse_hop2_public`
- **New (11):**
  - Still branch: `route_still_model`, `gpt_image_molecule_still`, `check_gpt_still`, `gpt_still_to_file`, `upload_gpt_still`
  - Video: `fal_kling_hop1`, `fal_kling_hop2`
  - Creatomate loops: `route_last_frame`, `switch_last_frame`, `route_concat`, `switch_concat`
- **Same as the old workflow:** `manual_trigger`, `filter_chem_active`. In the headings below, (edit) means the node differs from the old node of the same name as described.

Code for every Code node is in `marketing/n8n-molecule-smoke/`, pasted unchanged into v2. `route_last_frame` and `route_concat` share `route_render.js`. All Code nodes run Once for All Items with Execute Once **OFF**.

#### `get_chem_creations` (edit)

**Before → this → After:** `manual_trigger` → **get_chem_creations** → `filter_chem_active`

Google Sheets 4.7, Get Row(s).
- Document **By ID** `1XiCR6vs0tb4EawPE5hVlqYn3JElsOKsTDaH6HLbyHY0`.
- Sheet **From list** `14-chem-breakdown-54` (gid `425569919`).
- Options empty. Execute Once stays ON.

#### `pick_molecule_creation` (edit)

**Before → this → After:** `filter_chem_active` → **pick_molecule_creation** → `route_still_model`

Paste `pick_molecule_creation.js`. It picks the least-used Active row (by `times_used`, then `rank`) and throws on any of these:
- an empty or malformed cell
- a 720p value
- a Kling slug other than fal's v3 Pro
- a hop outside 3–15s
- a frame that isn't 9:16
- a GPT `still_size` narrower than the video

#### `route_still_model` (new)

**Before → this → After:** `pick_molecule_creation` → **route_still_model** → true `gpt_image_molecule_still` / false `grok_imagine_molecule_still`

IF 2.3. `={{ $json.model_still }}`, String **starts with** `openai/gpt-image-` (case sensitive, strict type validation).

#### `gpt_image_molecule_still` (new)

**Before → this → After:** `route_still_model` (true) → **gpt_image_molecule_still** → `check_gpt_still`

HTTP Request 4.5.
- POST `https://openrouter.ai/api/v1/images`.
- Predefined Credential Type **OpenRouter API**, credential **OpenRouter account** (`zDmHXnCHbj14yIvl`).
- Body JSON:

```text
={{ JSON.stringify({ model: $json.model_still, prompt: $json.still_prompt, n: $json.still_n, size: $json.still_size, aspect_ratio: $json.aspect_ratio, quality: $json.still_quality }) }}
```

Options → Timeout `={{ $json.still_timeout_seconds * 1000 }}`.

#### `check_gpt_still` (new)

**Before → this → After:** `gpt_image_molecule_still` → **check_gpt_still** → `gpt_still_to_file`

Paste `check_gpt_still.js`. Outputs `still_b64`, `still_mime`, `still_ext`, `still_width`, `still_height`, `still_cost_usd`.

#### `gpt_still_to_file` (new)

**Before → this → After:** `check_gpt_still` → **gpt_still_to_file** → `upload_gpt_still`

Convert to File 1.1, Move Base64 String to File.

| Setting | fx | Value |
|---|---|---|
| Base64 Input Field | OFF | `still_b64` |
| Put Output File in Field | OFF | `data` |
| File Name | ON | `={{ $('pick_molecule_creation').first().json.creation_id }}.{{ $json.still_ext }}` |
| MIME Type | ON | `={{ $json.still_mime }}` |

#### `upload_gpt_still` (new)

**Before → this → After:** `gpt_still_to_file` → **upload_gpt_still** → `save_still_url`

HTTP Request 4.5.
- POST `https://litterbox.catbox.moe/resources/internals/api.php`.
- Form-Data: `reqtype` = `fileupload`, `time` = `72h`, and `fileToUpload` = n8n Binary File from `data`.
- Response Format **Text**; the URL lands in `$json.data`.
- Same as the old workflow's `upload_hop1_public`, except Options → Timeout comes from the sheet: `={{ $('pick_molecule_creation').first().json.still_timeout_seconds * 1000 }}`.

#### `grok_imagine_molecule_still` (edit, deactivated)

**Before → this → After:** `route_still_model` (false) → **grok_imagine_molecule_still** → `save_still_url`

Deactivated 2026-09-30. The node stays on the canvas with its **XAI Grok** credential and both wires. n8n skips a deactivated node and passes the incoming item straight through, so a row whose `model_still` starts with `grok-imagine-image-` must not be run until this node is turned back on. `save_still_url` would otherwise store a bad `still_url`.

Same URL and **XAI Grok** header auth. The body now reads `still_prompt` (was `video_prompt`) and `still_n` (was a fixed `1`):

```text
={{ JSON.stringify({ model: $json.model_still, prompt: $json.still_prompt, n: $json.still_n, aspect_ratio: $json.aspect_ratio, resolution: $json.still_resolution }) }}
```

Options → Timeout `={{ $json.still_timeout_seconds * 1000 }}` (was a fixed 120000).

#### `save_still_url` (edit)

**Before → this → After:** `upload_gpt_still` or `grok_imagine_molecule_still` → **save_still_url** → `prep_molecule_video_start`

Edit Fields 3.5.
- Include Other Input Fields **OFF**.
- One field: `still_url` (String) `={{ Array.isArray($json.data) ? $json.data[0].url : String($json.data).trim() }}`.
- The other six fields go; downstream nodes read `pick_molecule_creation` directly.

#### `prep_molecule_video_start` (edit)

**Before → this → After:** `save_still_url` → **prep_molecule_video_start** → `fal_kling_hop1`

Paste `prep_molecule_video_start.js`. It adds the silent lock, checks the 2,500-character cap, and passes `model_video`, `duration`, `negative_prompt`, `cfg_scale`, poll and max wait through from the sheet.

#### `fal_kling_hop1` / `fal_kling_hop2` (new)

**Before → this → After:** `prep_molecule_video_start` → **fal_kling_hop1** → `prep_last_frame`  
**Before → this → After:** `prep_kling_extend` → **fal_kling_hop2** → `prep_creatomate_concat`

fal.ai node 1, credential **fal.ai account** (`qfVt9MnUeOJxRexp`). Model **By ID** `={{ $json.model_video }}`.

| Parameter | Value |
|---|---|
| `prompt` | `={{ $json.prompt }}` |
| `start_image_url` | `={{ $json.start_image_url }}` |
| `duration` | `={{ $json.duration }}` (the string `"15"`) |
| `negative_prompt` | `={{ $json.negative_prompt }}` |
| `cfg_scale` | `={{ $json.cfg_scale }}` |
| `generate_audio` | `={{ false }}` (the plain text `false` counts as true) |

Options: Wait For Completion ON, Poll Interval `={{ $json.poll_seconds }}`, Max Wait Time `={{ $json.max_wait_seconds }}`.

#### `prep_last_frame` (edit)

**Before → this → After:** `fal_kling_hop1` → **prep_last_frame** → `creatomate_last_frame`

Paste `prep_last_frame.js`. It builds the snapshot body at the seam cut.

#### `creatomate_last_frame` / `creatomate_concat` (edit)

**Before → this → After:** `prep_last_frame` → **creatomate_last_frame** → `wait_last_frame`  
**Before → this → After:** `prep_creatomate_concat` → **creatomate_concat** → `wait_concat`

HTTP Request 4.5.
- POST `https://api.creatomate.com/v2/renders` (was v1).
- Generic Credential Type **Bearer Auth**, credential **Bearer Auth account 2** (`02s8mB0EmuoResHc`).
- Body JSON `={{ JSON.stringify($json.creatomate_body) }}`. No fixed timeout.

#### `wait_last_frame` / `wait_concat` (edit)

**Before → this → After:** `creatomate_last_frame` or `switch_last_frame` (false) → **wait_last_frame** → `creatomate_last_frame_poll`  
**Before → this → After:** `creatomate_concat` or `switch_concat` (false) → **wait_concat** → `creatomate_poll`

Wait 1.1, After Time Interval. Amount `={{ $('pick_molecule_creation').first().json.creatomate_poll_seconds }}`, Unit Seconds.

#### `creatomate_last_frame_poll` / `creatomate_poll` (edit)

**Before → this → After:** `wait_last_frame` → **creatomate_last_frame_poll** → `route_last_frame`  
**Before → this → After:** `wait_concat` → **creatomate_poll** → `route_concat`

HTTP Request 4.5, GET, same Bearer credential.
- `=https://api.creatomate.com/v2/renders/{{ $('creatomate_last_frame').first().json.id }}`
- `=https://api.creatomate.com/v2/renders/{{ $('creatomate_concat').first().json.id }}`

#### `route_last_frame` / `route_concat` (new)

**Before → this → After:** `creatomate_last_frame_poll` → **route_last_frame** → `switch_last_frame`  
**Before → this → After:** `creatomate_poll` → **route_concat** → `switch_concat`

Paste `route_render.js` into both.
- Returns `done: true` on a succeeded render at the sheet's size, and `done: false` while it is still rendering.
- Throws on a failed or cancelled render, on a size mismatch, or after `creatomate_max_polls`.

#### `switch_last_frame` / `switch_concat` (new)

**Before → this → After:** `route_last_frame` → **switch_last_frame** → true `prep_kling_extend` / false `wait_last_frame`  
**Before → this → After:** `route_concat` → **switch_concat** → true `save_video_url` / false `wait_concat`

IF 2.3. `={{ $json.done }}`, Boolean **is true**.

#### `prep_kling_extend` (edit)

**Before → this → After:** `switch_last_frame` (true) → **prep_kling_extend** → `fal_kling_hop2`

Paste `prep_kling_extend.js`. Hop 2 starts from the hand-off frame with the sheet's `extend_motion_prompt`. The live node's hardcoded continuation block goes.

#### `prep_creatomate_concat` (edit)

**Before → this → After:** `fal_kling_hop2` → **prep_creatomate_concat** → `creatomate_concat`

Paste `prep_creatomate_concat.js`.

#### `save_video_url` (edit)

**Before → this → After:** `switch_concat` (true) → **save_video_url** → `sheets_update_video`

Paste `save_video_url.js`. The run's only sheet write comes after it, so a still-only or failed run never bumps `times_used`.

#### `sheets_update_video` (edit)

**Before → this → After:** `save_video_url` → **sheets_update_video** → `end`

Google Sheets 4.7, Update Row.
- Document **By ID** `1XiCR6vs0tb4EawPE5hVlqYn3JElsOKsTDaH6HLbyHY0`, Sheet `14-chem-breakdown-54` (gid `425569919`).
- Map Each Column Below, matching on `creation_id`.
- Columns, each `={{ $json.<column> }}`: `creation_id`, `still_url`, `hop1_video_url`, `last_frame_url`, `hop2_video_url`, `video_url`, `times_used` (number), `last_used_at`.
- Options → Cell Format **RAW**, so values are stored exactly as sent.

#### Sticky notes (new)

Four notes sit above the one row of nodes, left to right: overview and how to run, the still, hop 1, hop 2.
- **Size:** n8n's largest typed text is an H1 heading at 36 px, so each note is an image instead. Body text is 72 px and titles are 88 px, twice the H1 size and half the first pass. The notes are only as wide as their text.
- **Source:** `python3 marketing/scripts/render_n8n_note_images.py` writes the PNGs and `notes.json` to `marketing/n8n-notes/peptide_molecule_vid_gen_v2/`.
- **Hosting:** each note loads its PNG from `raw.githubusercontent.com` at commit `09777bf62dfe12959788ac79565606543350c9d5`, which stays reachable after the PR merges. The image's alt text carries the full wording. The overview line reads `14-chem-breakdown-54 · 54 looks`.
- **Editing:** the text can't be edited inside n8n. Change the lines in the script, render, commit, then point the note's image link at the new commit.

### Checks already done (no spend)

- **Local simulation:** every Code node ran against the smoke CSV with fake API responses — typed and all-string cells, both engines, and the Hold and A/B cases. 115 checks pass, including every fail-closed path.
- **Image measurement:** `check_gpt_still` measured real 1440 × 2560 PNG, JPEG and WebP files (lossy, lossless, alpha) and rejected an 864 × 1536 PNG.
- **n8n schema:** every new or changed node config passed `validate_node_config`.
- **n8n build:** the full workflow passed `validate_workflow` before it was created.
- **Creatomate:** both bodies passed `dry_run`.

### Run plan

Sal runs both halves from the n8n editor, in `peptide_molecule_vid_gen_v2`. The n8n MCP `execute_workflow` has no stop-at-node option: an agent can only start the whole chain, which would spend on video before Sal has seen the still. An agent starts nothing without "you may run the workflow" or "you can start the workflow".

1. **Still only.** Open `gpt_image_molecule_still` → **Execute step**. Only the sheet read and one still run, and nothing is written to the sheet. `save_still_url` → Execute step repeats whichever branch the editor took last time, so a second run can look like row 1 even after the sheet has moved on. `grok_imagine_molecule_still` is deactivated.
2. **Pin the still** if Sal likes it: pin `save_still_url`. On both engines its output is one small `still_url` field (the GPT base64 nodes are too big to pin).
3. **Video.** In the same editor session, open `sheets_update_video` → **Execute step**. n8n reuses the earlier run's data for the nodes before the pin; pen runs 2366 → 2367 did not re-run nodes 0–6. A page reload can drop that data, so if the page was reloaded, start again from step 1.
4. **Unpin `save_still_url`** after the video run. A pin left in place makes the next run animate the old still with the next row's prompts.
5. **Next row.** The pick takes the least-used Active row, then the lower `rank`. On `14-chem-breakdown-54` every row starts at `times_used` 0, so the next pick is `PBVita-Chem-001` (BPC-157, Violet span). To skip a row, set its `status` to `Hold`.
6. **A/B is parked.** `grok_imagine_molecule_still` is deactivated, so do not set a row's `model_still` to `grok-imagine-image-2.0` until that node is turned back on. Every row on `14-chem-breakdown-54` is already `openai/gpt-image-2.5-sunburst`.

**Per full run:** GPT still about $0.2–0.5 (Grok $0.04), plus Kling $3.36, plus about 16 Creatomate credits.

### Open risks

- **`size` rejected:** OpenRouter may still reject `size` with a 400 (not billed). The fix would be a direct OpenAI key.
- **Short-lived links:** litterbox links last 72h, Grok's `imgen.x.ai` links are temporary, and Creatomate files last 30 days. Production needs a Drive copy of the final MP4.
- **Slow editor:** the editor may be slow to show the base64 still (several MB of JSON on two nodes).
- **Measure before it counts:** every output is checked with ffprobe first — 1080 × 1920, about 30.0s, no sound.

### Sheet 14 — `14-chem-breakdown-54` (live for v2)

Both smokes looked good, so the chem library was rebuilt in that shape on a **new tab**. Sheet 13 stays as it was for `peptide_molecule_vid_gen`.

- **Workbook:** `1XiCR6vs0tb4EawPE5hVlqYn3JElsOKsTDaH6HLbyHY0` (same file as Sheet 13). [Open the tab](https://docs.google.com/spreadsheets/d/1XiCR6vs0tb4EawPE5hVlqYn3JElsOKsTDaH6HLbyHY0/edit#gid=425569919).
- **Tab:** `14-chem-breakdown-54`, gid `425569919`. This is not the pen sheet `14-pen-creations-150`.
- **Mirror:** `marketing/sheets/14-chem-breakdown-54.csv`, built by `python3 marketing/scripts/build_14_chem_breakdown_54.py` (looks in `marketing/scripts/chem14_looks.py`).
- **54 rows,** `PBVita-Chem-001` … `054`, same compound order as Sheet 13. Two unique looks per compound. `Cagrilintide` uses the catalog spelling (Sheet 13 still says `Cagrilinitide`).
- **Every row:** `model_still` `openai/gpt-image-2.5-sunburst`, `still_size` 1440x2560, `still_quality` high, `model_video` `fal-ai/kling-video/v3/pro/image-to-video`, `resolution` 1080p, hops 15+15, render 1080×1920, `times_used` 0, output columns blank.
- **Reset:** CHEM-001 … 009 start unused on this tab. Their Sheet 13 counts were not edited.

### Sheet 13 reset (Sal: YES) — done on the new tab

- **Change:** CHEM-001 … 009 → `times_used` 0, `last_used_at` blank.
- **Where:** the new tab starts every row at 0, which is that reset. Sheet 13 itself was not rewritten.

---

## Wire (linear)

```text
manual_trigger
  → get_chem_creations
  → filter_chem_active
  → pick_molecule_creation
  → sheets_update_chem
  → grok_imagine_molecule_still
  → save_still_url
  → prep_molecule_video_start
  → openrouter_i2v_start
  → wait_i2v (45s first poll)
  → openrouter_i2v_poll
  → route_hop1 → switch_hop1
       done  → download_hop1 → upload_hop1_public → parse_hop1_public → prep_last_frame
       wait  → wait_i2v_again (45s) → openrouter_i2v_poll
       quota → wait_i2v_quota (90s) → retry_hop1_body → openrouter_i2v_start
  → creatomate_last_frame
  → wait_last_frame
  → creatomate_last_frame_poll
  → prep_kling_extend
  → openrouter_i2v_extend
  → wait_i2v_extend (45s)
  → openrouter_i2v_extend_poll
  → route_hop2 → switch_hop2
       done  → download_hop2 → upload_hop2_public → parse_hop2_public → prep_creatomate_concat
       wait  → wait_i2v_extend_again → openrouter_i2v_extend_poll
       quota → wait_i2v_extend_quota → retry_hop2_body → openrouter_i2v_extend
  → creatomate_concat
  → wait_concat
  → creatomate_poll
  → save_video_url
  → sheets_update_video
```

Kling `parallel task over resource pack limit` (exec 2135) means the **job already failed** (concurrency full). Raising `wait_i2v` does not help. The quota branch waits 90s and resubmits hop 1/2 (max 5). Pending jobs poll every 45s for **600s** (Sheet 13 has no `wait_seconds` column; 180 was too short — exec 2139 still `pending` after 4 polls).

---

## After import

Imported into n8n Cloud (unpublished). Google Sheets account + XAI Grok header auth are attached.

1. Tab is `13-chem-breakdown-54`. Do not point this workflow at `9-lab-item-creations-500`.
2. Test with **Execute workflow** (manual). Do not Publish until one row looks right.
3. All four `openrouter_*` HTTP nodes use predefined **OpenRouter account** (`openRouterApi` / `zDmHXnCHbj14yIvl`) — same as `film_i2v_kling`. Do **not** attach **Simplified Custom Auth**. Exec 2133/2136/2137 `401 No cookie auth credentials found` is that template sending no Bearer token. If the n8n canvas was open on an old copy, **refresh the tab** and do not Save over the live workflow.
4. Unpin `openrouter_i2v_start` before a new run. Exec 2136/2137 pinned the already-failed job `xUC5d3S5fcAQylMh55LK` and never POSTed a new video.
5. Exec 2135: OpenRouter accepted hop 1 (`pending`), then Kling **failed** it with `parallel task over resource pack limit`. That is concurrency, not a short wait. `openrouter_i2v_poll` → **route_hop1** → `switch_hop1` resubmits after 90s. Max 5 retries. Do not Execute while other Kling jobs are in flight if the pack is a 1-slot plan.
6. Exec 2140: hop 1 **completed**. `creatomate_last_frame` 401 was a bad **Creatomate PbVita** key (`The provided API key is invalid`). Header Auth must be `Authorization: Bearer …`. Creatomate also cannot fetch OpenRouter `unsigned_urls` — hop 1/2 now rehost on litterbox before last-frame / concat.
7. CHEM-007 / Sermorelin 30s is done (exec 2140 hop 1 + off-canvas hop 2/concat). Sheet 13 `video_url` is written. **Do not** full-Execute to retry CHEM-007 — next Execute picks the next unused rank (CHEM-008+). Unpin `grok_imagine_molecule_still` if you want a new still, not the CHEM-005 keeper.

---

## Node 1 — `manual_trigger`

**Type:** Manual Trigger  

---

## Node 2 — `get_chem_creations`

**Type:** Google Sheets · Get Row(s)  
**Before → this → After:** `manual_trigger` → **get_chem_creations** → `filter_chem_active`

| Setting | fx | Value |
|---|---|---|
| Operation | — | Get Row(s) |
| Document | — | **By ID** (your workbook) |
| Sheet | **OFF** | `13-chem-breakdown-54` |
| Return All | — | **ON** |

---

## Node 3 — `filter_chem_active`

**Type:** Filter  
**Before → this → After:** `get_chem_creations` → **filter_chem_active** → `pick_molecule_creation`

| Parameter | fx | Value |
|---|---|---|
| Value 1 | **ON** | `={{ $json.status }}` |
| Operator | — | is equal to |
| Value 2 | **OFF** | `Active` |

---

## Node 4 — `pick_molecule_creation`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `filter_chem_active` → **pick_molecule_creation** → `sheets_update_chem`

Paste: `marketing/n8n-code-pick-molecule-creation.js`

Rotates **compound_name** (never the last **5** used compounds). Sheet rows are staggered so any 5 consecutive ranks are 5 different products.

Each of `shot_family`, `camera_move`, `surface`, `lighting`, `color_grade` has **6** values. Consecutive ranks never reuse the same value in those columns (so day 2 cannot look like day 1). Offsets: shot `i%6`, surface `(i+1)%6`, lighting `(i+2)%6`, grade `(i+3)%6`.

- **shot_family:** `push_in`, `pull_back`, `vertical_rise`, `lateral_drift`, `macro_detail`, `static_lock`
- **camera_move:** slow push-in / slow pull-back / slow vertical rise / slow lateral drift / creeping macro push / locked tripod (each paired to its shot family)
- **surface:** cytoplasm · mitochondrial inner membrane · nuclear envelope pore · ER cisternae · vesicle docking field · living cell lipid bilayer
- **lighting:** low-key rim · volumetric caustics · cool bioluminescent fill · dark-field microscope · dramatic subsurface glow · backlit cytoplasmic bloom
- **color_grade:** violet-cyan night-lab · emerald cytosol · copper-amber organelle · cool microscopic medical · high-contrast intracellular biotech · teal-and-gold mitochondrial

**Settings → Execute Once:** **OFF**. If this is ON, n8n only passes CHEM-001 into the Code node and every run repeats row 1.

Picks the next **unused** row by `rank` (`CHEM-001` then `CHEM-002` …). A row is used if `times_used > 0`, `last_used_at` is set, or `video_url` is an `https://` URL. `video_prompt`, `video_motion_prompt`, and `still_edit_prompt` pass through from the sheet — do not prepend vibe locks in this node.

**Check:** `lab_item_id` (should advance), `input_row_count` = 54, `video_prompt` starts with `HERO SUBJECT:` plus that row’s material (not a shared `HARD VIBE LOCK` / `HARD OUTPUT LOCK`).

---

## Node 5 — `grok_imagine_molecule_still`

**Type:** HTTP Request  
**Before → this → After:** `sheets_update_chem` → **grok_imagine_molecule_still** → `save_still_url`

Grok `prompt` is the sheet `video_prompt` from `pick_molecule_creation` (Sheet 13 has no `still_prompt` column).

| Setting | fx | Value |
|---|---|---|
| Method | — | `POST` |
| URL | **OFF** | `https://api.x.ai/v1/images/generations` |
| Authentication | — | Header Auth → same xAI as vial stills |
| Send Body | — | **ON** |
| Body Content Type | — | **JSON** |
| JSON | **ON** | see below |

```text
={{ JSON.stringify({ model: $('pick_molecule_creation').first().json.model_still, prompt: $('pick_molecule_creation').first().json.video_prompt, n: 1, aspect_ratio: $('pick_molecule_creation').first().json.aspect_ratio, resolution: $('pick_molecule_creation').first().json.still_resolution }) }}
```

**Check:** `$json.data[0].url` — one molecule, no vial.

---

## Node 6 — `save_still_url`

**Type:** Edit Fields  
**Before → this → After:** `grok_imagine_molecule_still` → **save_still_url** → `prep_molecule_video_start`  
Include Other Input Fields: **ON**

| Name | fx | Value |
|---|---|---|
| `still_url` | **ON** | `={{ $json.data[0].url }}` |
| `creation_id` | **ON** | `={{ $('pick_molecule_creation').first().json.creation_id }}` |
| `compound_name` | **ON** | `={{ $('pick_molecule_creation').first().json.compound_name }}` |
| `video_motion_prompt` | **ON** | `={{ $('pick_molecule_creation').first().json.video_motion_prompt }}` |
| `model_video` | **ON** | `={{ $('pick_molecule_creation').first().json.model_video }}` |
| `duration_seconds` | **ON** | `={{ $('pick_molecule_creation').first().json.duration_seconds }}` |
| `resolution` | **ON** | `={{ $('pick_molecule_creation').first().json.resolution }}` |

---

## Node 7 — `prep_molecule_video_start`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `save_still_url` → **prep_molecule_video_start** → `openrouter_i2v_start`

Paste: `marketing/n8n-code-prep-molecule-video-start.js`

**Check:** `still_url` https + `openrouter_body_json`. The live code still requires `model_video` = `kwaivgi/kling-v3.0-pro`.

**Blocked — 720p is banned (AGENTS.md).** OpenRouter serves Kling v3 Pro at 720p only, so this node cannot make a legal clip. Do not write `720p` to Sheet 13; see *Audit — 2026-09-29* above.

See `marketing/n8n-openrouter-video.md` for hop 1 → last-frame snapshot → hop 2 → Creatomate concat.

---

## Node 8 — `openrouter_i2v_start`

**Type:** HTTP Request  
**Before → this → After:** `prep_molecule_video_start` → **openrouter_i2v_start** → `wait_i2v`

| Setting | fx | Value |
|---|---|---|
| Method | — | POST |
| URL | **OFF** | `https://openrouter.ai/api/v1/videos` |
| Authentication | — | Predefined Credential Type → **OpenRouter API** |
| Credential | — | **OpenRouter account** |
| Body | **ON** | `={{ JSON.parse($json.openrouter_body_json) }}` |

Same credential on `openrouter_i2v_poll`, `openrouter_i2v_extend`, and `openrouter_i2v_extend_poll`. Do **not** leave **Simplified Custom Auth** on the poll node — that is exec 2136/2137 `Authorization failed`.

---

## Node — `openrouter_i2v_poll`

**Type:** HTTP Request  
**Before → this → After:** `wait_i2v` → **openrouter_i2v_poll** → `route_hop1`  
Loop: `wait_i2v_again` → **openrouter_i2v_poll** → `route_hop1`

| Setting | fx | Value |
|---|---|---|
| Method | — | GET |
| URL | **ON** | `={{ ($json.polling_url && String($json.polling_url).indexOf('http') === 0) ? $json.polling_url : ('https://openrouter.ai/api/v1/videos/' + $json.id) }}` |
| Authentication | — | Predefined Credential Type → **OpenRouter API** |
| Credential | — | **OpenRouter account** (`zDmHXnCHbj14yIvl`) |

No second credential. No Header Auth. Same settings on `openrouter_i2v_extend_poll`.

---

## Node — `creatomate_last_frame`

**Type:** HTTP Request  
**Before → this → After:** `prep_last_frame` → **creatomate_last_frame** → `wait_last_frame`

| Setting | fx | Value |
|---|---|---|
| Method | — | POST |
| URL | **OFF** | `https://api.creatomate.com/v1/renders` |
| Authentication | — | Generic Credential Type → **Header Auth** |
| Credential | — | **Creatomate PbVita** (`UkuSlYOEACCWm5rB`) |
| Body | **ON** | `={{ JSON.parse($json.creatomate_body_json) }}` |

Header Auth must be `Authorization` = `Bearer <Creatomate API key>`. Exec 2140 hop 1 **completed** (`2pqY7c8xe8THwhtaaRTf`), then Creatomate returned `401 The provided API key is invalid`. That is the key stored in **Creatomate PbVita**, not a missing n8n credential. Same header on `creatomate_last_frame_poll`, `creatomate_concat`, `creatomate_poll`.

Creatomate cannot fetch OpenRouter `unsigned_urls`. Live wire rehosts hop 1/2 on litterbox (`download_hop*` → `upload_hop*_public` → `parse_hop*_public`) before last-frame or concat. CHEM-007 30s: `marketing/runs/chem007-sermorelin-30s.md`.

---

## Node — `route_hop1`

**Type:** Code  
**Before → this → After:** `openrouter_i2v_poll` → **route_hop1** → `switch_hop1`

Paste: `marketing/n8n-code-route-hop1.js`

Sets `hop1_route` to `done` / `wait` / `quota`. Quota = Kling resource pack full → `wait_i2v_quota` → **retry_hop1_body** → `openrouter_i2v_start`. Same pattern on hop 2 (`route_hop2`).

---

## Node — `download_hop1`

**Type:** HTTP Request  
**Before → this → After:** `switch_hop1` (done) → **download_hop1** → `upload_hop1_public`

GET `https://openrouter.ai/api/v1/videos/{{ $json.id }}/content?index=0` as a file. Auth = **OpenRouter account**. Same pattern on `download_hop2` after `switch_hop2` (done).

## Node — `upload_hop1_public`

**Type:** HTTP Request  
**Before → this → After:** `download_hop1` → **upload_hop1_public** → `parse_hop1_public`

POST `https://litterbox.catbox.moe/resources/internals/api.php` multipart: `reqtype=fileupload`, `time=72h`, `fileToUpload` = hop MP4. Same on `upload_hop2_public`.

## Node — `parse_hop1_public`

**Type:** Code  
**Before → this → After:** `upload_hop1_public` → **parse_hop1_public** → `prep_last_frame`

Paste: `marketing/n8n-code-parse-hop1-public.js`  
Hop 2: `marketing/n8n-code-parse-hop2-public.js` → `prep_creatomate_concat`.

## Node 11 — `save_video_url`

**Type:** Code  
**Before → this → After:** `creatomate_poll` → **save_video_url** → `sheets_update_video`

Reads the succeeded Creatomate concat URL into `video_url` + `creation_id`.

## Node — `sheets_update_video`

**Type:** Google Sheets → Update  
**Before → this → After:** `save_video_url` → **sheets_update_video** → `end`

| Setting | fx | Value |
|---|---|---|
| Operation | — | Update |
| Document | — | **By ID** (same workbook) |
| Sheet | **OFF** | `13-chem-breakdown-54` |
| Column to Match On | **OFF** | `creation_id` |
| `creation_id` | **ON** | `={{ $json.creation_id }}` |
| `video_url` | **ON** | `={{ $json.video_url }}` |

Sheet 13 now has a `video_url` column (added by exec 2143). Do not list `video_url` in a Sheets schema until that header exists — n8n throws `Missing columns: video_url`. Extra fields use `handlingExtraData: insertInNewColumn` with `autoMapInputData` only.

---

## Node 12 — `sheets_update_chem`

**Type:** Google Sheets → Update  
**Before → this → After:** `pick_molecule_creation` → **sheets_update_chem** → `grok_imagine_molecule_still`

Marks the row used **before** the still so a still-only Execute (destination = `grok_imagine_molecule_still`) still advances to the next unused rank. Do **not** wait until Creatomate finishes — that left CHEM-004 at `times_used: 0` after exec 2126 and re-picked NAD+.

| Setting | fx | Value |
|---|---|---|
| Operation | — | Update |
| Document | — | **By ID** (same as `get_chem_creations`) |
| Sheet | **OFF** | `13-chem-breakdown-54` |
| Column to Match On | **OFF** | `creation_id` |
| Value to Match | **ON** | `={{ $('pick_molecule_creation').first().json.creation_id }}` |
| `times_used` | **ON** | `={{ Number($('pick_molecule_creation').first().json.creation_times_used \|\| 0) + 1 }}` |
| `last_used_at` | **ON** | `={{ $now.toISO() }}` |

---

## Importable JSON

`marketing/workflows/peptide_molecule_vid_gen.json`  
n8n: **Import from File** → name stays `peptide_molecule_vid_gen` → attach credentials → set Sheet document ID.

---

## Locked keepers

**CHEM-005 / Semaglutide** (exec 2132, destination `grok_imagine_molecule_still`): unique-first `HERO SUBJECT` prompt. Coral lipidated helix, vesicle orbs, amino-acid bond flash, no text/logo. **1584 × 2816** (real 2K 9:16).

- Repo: `marketing/stills/chem005-semaglutide.png`
- Grok tmp: `https://imgen.x.ai/xai-imgen/xai-tmp-imgen-ec45ad99-2489-92a6-a90a-ea429e8637b6-e47dc059.png`
- `times_used` on CHEM-005 is **1**. Do **not** re-pick this row for a new still. I2V must use this keeper URL, not a fresh Grok still.

## Related

- Sheet: `marketing/sheets/13-chem-breakdown-54.csv`
- Pick: `marketing/n8n-code-pick-molecule-creation.js`
- Prep video: `marketing/n8n-code-prep-molecule-video-start.js`
