# Vid-gen quality playbook

**Owner:** Salvatore  
**Surveyed:** 2026-09-07  
**Rule:** image and video **quality is #1**. Speed, cost, habit, and “the last model we used” come after.

**Delivery is 9:16 social only.** Instagram Reels / Stories / TikTok. Do not generate or recommend 16:9. In this studio, **1080p always means 1080 × 1920** (portrait). Landscape 1920 × 1080 is a miss.

This note is the studio rulebook for stills + clips, plus what ~50 current articles, leaderboards, and API docs actually say. Rankings move weekly. **Job fit and measured pixels beat last week’s Elo.**

---

## Hard quality rules (do not skip)

0. **9:16 or it does not ship.** `aspect_ratio` / `video_aspect_ratio` = `9:16`. ffprobe must show **width < height**. 1080p social = **1080 × 1920**. 2K social ≈ **1440 × 2560**. Kling 4K social = **2160 × 3840**. Never 1920 × 1080.
1. **Measure, do not trust labels.** A sheet cell that says `2k` or `1080p` is not proof. Open the still. `ffprobe` the MP4. True 9:16 1080p is **1080 × 1920**. Grok Imagine Image 2.0 “2k” 9:16 has written **720 × 1280**. That is 720p. FILM-020’s last space-reentry JPEG failed this check.
2. **The still is the cinematography.** I2V samples detail from the first frame. A soft source produces soft motion. Generate stills at **real 2K or 4K** even when the video target is 1080p.
3. **Lock the still before spending video credits.** Produce 3+ takes. Salvatore picks a keeper. Then I2V. Do not animate a broken frame.
4. **Motion-only I2V prompts.** The still owns subject, lighting, grade, and identity. The video prompt owns camera + what moves + what must not change. Re-describing the scene causes identity drift.
5. **Native 1080p or higher on the video API.** Do not ship 720p for film, hero, or catalog clips. Do not upscale a 720p generate and call it 1080p. Kling Standard 9:16 is **720 × 1280**. Kling Pro 9:16 is **1080 × 1920**. Kling 4K 9:16 is **2160 × 3840** (when the gateway actually exposes `4k`).
6. **Pick the model for the shot.** One default model for every beat is how quality dies.
7. **Do not run video-gen unless Salvatore says run.** Overlay and stills can proceed. I2V waits.

---

## What the 2026 writing agrees on

The same advice shows up across production blogs, vendor prompt guides, and API docs:

| Advice | Why it matters here |
|---|---|
| Image-first, then I2V | Composition, ship hull, vial label, and beach planet get locked on a cheap still. Video credits only buy motion. |
| First frame ≥ target video | Our FILM-020 720p still into Kling 1080p is the textbook failure. |
| Short motion prompts | 3–15 words of camera + action beat a paragraph that fights the still. |
| First + last frame when the landing matters | Use when the ship must arrive at a known composition (crash site, beach). |
| Native res over upscale | Upscale interpolates. It does not invent hull panel lines. |
| 4–8s production clips, extend from a clean last frame | Long single gens wander. Prefer a sharp 6–8s over a mushy 15s. |
| Draft cheap, finish native-high | Iterate stills (and optional low-res motion tests). Re-roll the keeper at 1080p/4K. |
| Arena Elo ≠ delivery res | Seedance 2.0 often leads I2V **as 720p**. Preference score is not a pixel count — always ask which resolution the row was scored at. |
| Sora 2 is dead | Product gone April 2026; API shutdown window in 2026. Do not build new pipelines on it. |

---

## Model map (quality first, our stack)

Use the model whose **job** matches the beat. Confirm the gateway’s `supported_resolutions` before the call (`GET https://openrouter.ai/api/v1/videos/models`).

| Job | First pick | Why the articles say so | Our workflow | Do not use when |
|---|---|---|---|---|
| **Cinematic motion / camera / speed** (reentry, flyby, tracking) | **Kling 3.0 Pro** `kwaivgi/kling-v3.0-pro` @ **1080p** 9:16 | Repeated “best camera / action / human+vehicle motion.” Pro mode is native **1080 × 1920**. Some gateways also expose Kling **4K**. | `film_i2v_kling` | The first frame is 720p; the gateway only offers 720p |
| **Identity / product / ship lock** | **Seedance 2.0 / 2.5** | Arena I2V leader (often 720p *preference*). Best reference-heavy commercial lock. 2.5 = longer + more refs when the API is live. | `film_i2v_seedance` | You need proven **1080p pixels** and the row is still 720p |
| **Photoreal physics / atmosphere / fire** | **Veo 3.1** | Wins lighting, plasma-adjacent physics, photoreal. Clips shorter (~4–8s). Pricey. | `film_i2v_veo` | You need 10–15s of one continuous dive |
| **Silent I2V preference** | Grok Imagine Video 1.5 | Strong arena *without audio*. Does **native 1080p** on T2V and I2V, 1–15s. But it is the **priciest 1080p second we have** — $0.25/s, 2.2× Kling Pro. | wellness / pen / lab rows | Cost matters, or the row needs the cheapest legal 1080p |
| **Current arena I2V (with audio)** | MiniMax H3 Max / H3, Gemini Omni Flash, Wan 3.0 | Sep 2026 AA I2V-with-audio leaders. H3 Max is new; test before locking a film beat. | not wired yet | We have not measured a 9:16 1080p clip from these in this studio |
| **Filmmaker control / VFX** | Runway Gen-4.5 | Control + polish. Often 720p native + upscale. Key not attached on `film_i2v_runway`. | hold | Key missing; upscale-from-720p |
| **HDR / grade pipeline** | Luma Ray3 | Native 16-bit HDR. Overkill for IG 9:16. | not wired | Reels delivery is 1080p SDR |
| **Do not start new work** | Sora 2 | Deprecated. | — | Always |

### FILM-020 (side-reentry, exact crash ship, beach planet)

**Still:** real **2K 9:16** (measure ≥ 1440 × 2560, or documented provider 2K vertical). **Flux 2 Max** via OpenRouter `POST /api/v1/images` with the FILM-015 / FILM-009 ship as `input_references`. Do **not** send Flux to xAI. Do **not** reuse Grok “2k” if the JPEG is 720 × 1280.

**Video (after Salvatore picks a keeper):** **Kling 3.0 Pro, 1080p, 9:16, 6–8s, audio off.** That is the best match for “side shot, traveling extremely fast through atmosphere” in the surveyed writing, and it is the path that already produced a real **1080 × 1920** FILM-015 clip.

**Runner-up if the ship morphs:** Seedance 2.5 I2V with the keeper + crash-ship reference — only if the sheet row is truly 1080p (or higher), not 720p.

**Do not use Grok Video for FILM-020.** Not a resolution problem — 1.5 can do 1080p — but Kling Pro wins this camera move and costs less than half per second. The last crash still looked soft because the **still** was 720 × 1280, which is a still problem, not a video-model problem.

Do not run I2V until Salvatore says run.

---

## Prompt and pipeline pattern (sheets-only)

Still prompt (image model): full look — ship lock, planet lock, camera, grade.

I2V motion prompt (video model):

```text
[one camera + action]. [what must hold]. [what must not appear]. Silent.
```

Example shape for FILM-020 (write the final text on **`18-motsc-film-stills`**, do not hardcode in n8n):

```text
Locked side profile. The exact same dart ship dives extremely fast through atmosphere toward the beach planet. Twin cyan engines and hull panels hold. Twin moons and teal-violet coast stay. No new ship. No third engine. No people. Silent.
```

n8n may only map sheet fields, call APIs, and write URLs back.

---

## 1080p price board — audio off, 9:16

**Priced 2026-09-15.** 720p is forbidden, so every row below is a **1080p** rate with **audio off**. Re-price before a big run; providers move.

| Endpoint | 1080p rate, no audio | 10s | 15s | Max duration |
|---|---|---|---|---|
| **fal Kling v3 Pro I2V** `fal-ai/kling-video/v3/pro/image-to-video` | $0.112/s | **$1.12** | **$1.68** | 15s |
| OpenRouter `kwaivgi/kling-v3.0-pro` | $0.112/s + 5.5% credit fee | $1.18 | $1.77 | 15s |
| **fal Hailuo 02 Pro I2V** `fal-ai/minimax/hailuo-02/pro/image-to-video` | $0.08/s | **$0.80** | — (6s or 10s only) | 10s |
| fal Veo 3.1 I2V `fal-ai/veo3.1/image-to-video` | $0.20/s | — (needs 2 gens) | — (needs 2 gens) | 8s → $1.60 |
| fal Wan 3.0 I2V `alibaba/wan-3.0/image-to-video` | $0.20/s | $2.00 | $3.00 | 30s |
| fal Wan 3.0 Prime I2V | $0.28/s | $2.80 | $4.20 | 30s |
| Replicate `kwaivgi/kling-v3-video` (mode `pro`) | $0.168/s | $1.68 | $2.52 | 15s |
| **xAI `grok-imagine-video-1.5`** (what wellness / pen ran before 2026-09-16) | **$0.25/s** + $0.01/input image | **$2.51** | **$3.76** | 15s |
| fal Seedance 2.0 Standard I2V | $0.682/s | $6.82 | $10.23 | 15s |

**Cheapest legal clip:** Hailuo 02 Pro at 10s ($0.80). **Cheapest 15s:** Kling v3 Pro on fal ($1.68).

**What we pay now — all three vid-gen workflows are on fal Kling v3 Pro (2026-09-16).** Sheets `500_Peptide_Wellness_Reel_Scenes` (601 rows), `14-pen-creations-150` (168 rows), and `9-lab-item-creations-500` (535 rows) all carry `model_video=fal-ai/kling-video/v3/pro/image-to-video`, `resolution=1080p`, `duration_seconds=15`, and the `fal_kling_generate` node in each workflow reads that slug off the sheet. A 15s clip is **$1.68**. Before the switch, wellness and pen ran `grok-imagine-video-1.5` at the 1080p tier — **$3.76 a clip** — so this is **$2.08 per clip, 55%** cheaper, before still costs. Lab was worse than mismatched: its node was pinned to the Standard slug, so it billed cheap and shipped 720p.

**Grok is billed by resolution, so the summary rate lies.** xAI's pricing page lists `grok-imagine-video-1.5` as a flat `$0.080 / sec`. That is the **480p** tier. The real card is $0.08 at 480p, **$0.14 at 720p, $0.25 at 1080p**, plus $0.01 per input image. Never budget a 1080p Grok run off the $0.08 figure.

**Still costs, for a full per-reel number.** `grok-imagine-image-2.0` is $0.04 per image, and an **image edit bills both the input and the output image**, so the still-edit hop is about $0.08 on top of the $0.04 first still.

### Rules that come with the board

- **No 720p row belongs here.** Kling v3 **Standard**, Seedance 2.0 **Fast**, and Seedance 2.5 (schema enum is `480p` / `720p`) are out on resolution alone, whatever they cost. Grok Imagine Video 1.5 is **not** in that group — it does native 1080p, it is just expensive.
- **Never pin the model slug on the node — read `model_video` off the sheet.** `9-lab-item-creations-500` shipped 720p for weeks with all 535 rows reading `resolution=1080p`: `prep_grok_video_start` overwrote the sheet value with `fal-ai/kling-video/v3/standard/image-to-video` and `fal_kling_generate` had the same Standard slug pinned in its model field. The sheet said 1080p, the API was asked for 720p, and nothing in between complained. Fixed 2026-09-16 — every `fal_kling_generate` now takes `model` from `={{ $json.model_video }}`. If you ever see a tier pinned on a node again, that is the bug.
- **MiniMax H3 is out too.** Native modes are 480P / 768P; its `2K` and `4K` are **upscales of a 768p base**. That is rule 5 — do not upscale and call it 1080p.
- **fal Kling v3 Pro has no `resolution` field.** Pro *is* the 1080p tier and `aspect_ratio` on I2V follows the start image. So the only proof of 1080 × 1920 is `ffprobe` on the output.
- **Muting does not always save money.** Kling and Veo bill audio separately (Kling $0.112 → $0.168, Veo $0.20 → $0.40). Seedance and Wan bill the **same rate either way** — `generate_audio: false` there is a quality/brief decision, not a discount.
- **Vertical is not a surcharge.** Wan and Seedance bill by token, and tokens are frame **area** × duration, so 1080 × 1920 costs exactly what 1920 × 1080 costs. Kling, Hailuo, and Veo are flat per-second.
- **OpenRouter is never cheaper than fal for the same model.** It passes provider pricing through with no inference markup, then adds **5.5% on credit top-ups** ($0.80 minimum per purchase). Same Kling Pro seconds, plus a fee. Use it for the unified API shape, not for price.
- **Veo cannot do 10s or 15s in one pass** (`4s` / `6s` / `8s`). A 15s Veo beat is two generations and a seam. Face-forward human rows never go to Veo at all — see `AGENTS.md`.

---

## Social pixel lock (9:16)

| Label | Width × height | Ships? |
|---|---|---|
| 9:16 720p | 720 × 1280 | No (soft) |
| **9:16 1080p** | **1080 × 1920** | **Yes — Reels / TikTok** |
| 9:16 2K | ~1440 × 2560 | Yes — stills (feeds 1080p I2V) |
| 9:16 4K | 2160 × 3840 | Yes if the API really returns this |
| 16:9 1080p | 1920 × 1080 | **No — landscape. Wrong product.** |

## QA before anyone calls a clip “1080p”

1. Aspect is 9:16 (width < height). Landscape 1920 × 1080 fails even if it says 1080p.
2. Still pixels ≥ video pixels on the short side (1080 for 1080p).
3. `ffprobe`: width × height, codec, fps. 9:16 1080p = 1080 × 1920.
3. Identity: same ship / vial / pen / face from frame 1 to last frame.
4. Motion: one intended move, no boil, no morph.
5. If it fails, fix the **still** first, then re-roll I2V.

---

## Survey notes (opinions, condensed)

**Artificial Analysis I2V (with audio), ~2026-09-07:** MiniMax H3 Max (fal post-train) ~1201 · Seedance 2.0 720p ~1192 · MiniMax H3 ~1187 · Gemini Omni Flash ~1180 · Wan 3.0 ~1176 · Grok Video 1.5 ~1110 · Veo 3.1 ~1087 · Kling 3.0 Pro 1080p ~1072.  
**I2V without audio:** Gemini Omni Flash leads; Wan 3.0, H3, Seedance 2.0 720p, Grok 1.5 follow.

Read that as **preference**, not delivery pixels. Seedance 2.0’s high Elo is often a **720p** row. Kling Pro sits lower on Elo and higher on **native 1080p**.

**Pixo / Lotix / 3DAI / Pollo / Oakgen / Studiolist:** no universal winner. Seedance = commercial + references. Kling = motion, length, multi-shot. Veo = photoreal + native audio. Use more than one model in a campaign.

**Grok Video 1.5 reviews:** fast, strong short I2V preference; “floaty” full-body motion vs Kling’s weight. Earlier notes here claimed a **720p hard cap — that was wrong.** xAI's own docs list `480p` / `720p` / `1080p` and state 1080p is supported on `grok-imagine-video-1.5` for text-to-video and image-to-video. Only *reference*-to-video is capped at 720p, and 1.5 does not support that mode at all. Video **editing** is still capped at 720p and will downsize a 1080p input.

**I2V craft (Sensei, Runway, Lovart, HappyHorse, invideo, Seedance docs):** still first · still bigger than video · motion-only prompt · first/last frame for landings · 4–8s then extend · reduce motion if the product/ship warps.

**Kling API docs (Kie, Apiframe, PiAPI):** `std` = 720p, `pro` = 1080p, `4k` = 2160p. 9:16 Pro = **1080 × 1920**. Duration 3–15s. OpenRouter may expose a **subset** — confirm before assuming 4K.

**OpenRouter:** `POST /api/v1/videos` + `frame_images` (`first_frame` / `last_frame`). Flux stills: `POST /api/v1/images` with `aspect_ratio` + `resolution` (`2K`) + optional `input_references` (up to 8). Never send `black-forest-labs/flux.2-max` to xAI.

---

## 50 sources (articles, leaderboards, API docs)

Opinion and how-to first; vendor docs included when they decide resolution or prompt shape.

1. [Artificial Analysis — Image to Video leaderboard](https://artificialanalysis.ai/video/leaderboard/image-to-video)
2. [BenchmarkList — AA I2V snapshot](https://benchmarklist.com/arenas/artificial_analysis_image_to_video/)
3. [invideo — Best AI video model (Aug 2026, by job)](https://invideo.io/blog/best-ai-video-model/)
4. [Pixo — 7 best AI video generators 2026](https://pixo.video/blog/best-ai-video-generators)
5. [Lotix — Best AI video generator models 2026](https://lotix.io/blog/comparisons/best-ai-video-generators-2026/)
6. [3DAI Studio — Veo 3.1 vs Kling 3.0 vs Seedance 2.0](https://www.3daistudio.com/blog/best-ai-video-generator-2026)
7. [Oakgen — Seedance 2.5 vs Kling 3 vs Veo 3.1](https://oakgen.ai/blog/seedance-2-5-vs-kling-3-vs-veo-3-1)
8. [Anycap — Seedance 2.5 vs Kling vs Veo vs Runway](https://anycap.ai/page/en-US/ai/seedance-2-5-vs-kling-veo3-runway)
9. [Studiolist — which model should the studio use](https://studiolist.co/guides/seedance-vs-kling-vs-veo-vs-gen-4-5/)
10. [Pollo — Seedance 2.5 vs Kling 3.0 vs Veo 3](https://pollo.ai/hub/seedance-2-5-vs-kling-3-0-vs-veo-3)
11. [UGC Copilot — Sora / Veo / Kling / Seedance](https://ugccopilot.ai/ai-video-models/)
12. [VidScore — AI video pricing 2026](https://vidscore.dev/blog/ai-video-pricing-guide-2026)
13. [APIMart — Pixverse V6 alternatives 2026](https://apimart.ai/blog/top-pixverse-v6-alternatives-2026)
14. [Pinggy — best video generation models 2026](https://pinggy.io/blog/best_video_generation_ai_models/)
15. [Build Fast With AI — ranked by quality / speed / price](https://www.buildfastwithai.com/blogs/best-ai-video-models-2026)
16. [DualView — 2025–2026 model comparison](https://www.dualview.ai/blog/ai-tools/best-ai-video-models.html)
17. [AI Magicx — Kling vs Hailuo vs Runway vs Luma](https://www.aimagicx.com/blog/ai-video-generation-showdown-2026)
18. [Pexo — Luma vs Runway 2026](https://pexo.ai/blog/luma-ai-vs-runway-9870)
19. [Atlas Cloud — Wan 3.0 vs Seedance 2.5 vs MiniMax H3](https://www.atlascloud.ai/blog/tips/choose-ai-video-model-wan-3.0-seedance-2-5-minimax-h3)
20. [JXP — Grok Imagine Video 1.5 review](https://www.jxp.com/grok-imagine/blog/grok-imagine-video-1-5-review)
21. [AIToolsRecap — Grok 1.5 vs Sora / Veo / Kling](https://aitoolsrecap.com/Blog/grok-imagine-video-1-5-beats-sora-veo-kling-2026)
22. [AI Video Advisor — Grok 1.5 arena #1, what it actually does](https://aivideoadvisor.com/grok-imagine-1-5-number-one-ai-video/)
23. [Vexa — Veo 3.1 vs Grok Imagine](https://vexavideo.com/blog/veo31-vs-grok-imagine)
24. [Picasso IA — Grok vs Kling 3.0](https://blog.picassoia.com/grok-imagine-video-vs-kling-30-three-things-you-should-know)
25. [AI Video Sensei — stills → cinematic motion](https://aivideosensei.com/guides/image-to-video-ai-workflow)
26. [HappyHorse — first frame to pin the shot](https://happyhorseapi.org/blog/image-to-video-first-frame-control)
27. [Lovart — T2V / I2V guide 2026](https://www.lovart.ai/blog/complete-guide-text-to-video-image-to-video-ai)
28. [Runway — Image to Video prompting guide](https://help.runwayml.com/hc/en-us/articles/48324313115155-Image-to-Video-Prompting-Guide)
29. [Dreamina / CapCut — brand stills to social video](https://dreamina.capcut.com/ai-video/brand-social-media-ai-video)
30. [invideo — anchor frame method](https://invideo.io/blog/anchor-frame-method-ai-video/)
31. [invideo — image-first iteration](https://invideo.io/blog/image-first-iteration-ai-video/)
32. [Kittl — first frame / end frame consistency](https://www.kittl.com/blogs/ai-video-character-consistency-workflow/)
33. [AI Journal — Seedance 2.0 reference lock](https://aijourn.com/seedance-2-0-replaces-the-prompt-only-video-paradigm-with-multimodal-references/)
34. [Petronella — Seedance 2.0 for business video](https://petronellatech.com/blog/seedance-2-0-ai-video-generation/)
35. [Seedance 2.0 consistency guide](https://seedance2.tech/docs/consistency-guide)
36. [Seedance — complete prompting guide](https://docs.seedance.tv/en/seedance-2-complete-prompting-guide)
37. [Seedance — prompt examples and QA](https://www.seedance.tv/blog/seedance-2-0-prompt)
38. [AI Journal — Kling 3.0 API](https://aijourn.com/what-is-the-kling-3-0-api-features-pricing-how-to-use-it/)
39. [AI API Playbook — Kling v3.0 Pro I2V](https://aiapiplaybook.com/blog/kling-v3-0-pro-image-to-video-api-complete-developer-guide/)
40. [Kie — Kling 3.0 resolution map (std / pro / 4K)](https://docs.kie.ai/market/kling/kling-3-0)
41. [Apiframe — Kling 3.0 Omni API](https://apiframe.ai/docs/videos/kling/kling-3-0-omni)
42. [PiAPI — Kling 3.0 / 3.0 Turbo](https://piapi.ai/docs/kling-api/kling-3-api)
43. [Replicate — Kling Video 3.0](https://replicate.com/kwaivgi/kling-v3-video/readme)
44. [Kling 3.0 Pro product notes](https://kling3.io/kling-3-pro)
45. [OpenRouter — video generation](https://openrouter.ai/docs/guides/overview/multimodal/video-generation)
46. [OpenRouter — image-to-video cookbook](https://openrouter.ai/docs/cookbook/video-generation/image-to-video)
47. [OpenRouter — image generation](https://openrouter.ai/docs/guides/overview/multimodal/image-generation)
48. [OpenRouter — FLUX.2 Max](https://openrouter.ai/black-forest-labs/flux.2-max)
49. [Google — Gemini Omni 1.1 Flash (4K upscale, first/last frame)](https://blog.google/innovation-and-ai/technology/developers-tools/build-with-gemini-omni-1-1-flash/)
50. [PoYo — Gemini Omni 1.1 Flash API](https://poyo.ai/hub/gemini-omni-1-1-flash-api-guide)
51. [Vidu API pricing (1080p I2V)](https://platform.vidu.com/docs/pricing)

Re-check AA and OpenRouter model lists when a new film beat starts. Do not freeze 2026-09-07 Elo as permanent truth.

---

## Related studio docs

- Rulebook: `AGENTS.md` (Marketing — quality is #1)
- Goal: `GOAL.md`
- Sheets-only: `n8n-sheets-only-vid-gen.md`
- Film I2V: `film_i2v_kling` · `film_i2v_seedance` · `film_i2v_veo`
