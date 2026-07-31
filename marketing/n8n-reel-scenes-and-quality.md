# Reel scenes + Grok Imagine quality variables

## Files
| File | Use |
|---|---|
| `peptide-reel-scenes-630.md` / `.json` | 630 visual scene briefs |
| `sheets/5-reel-scenes.csv` | Sheets tab `5-reel-scenes` |
| `grok-imagine-quality-variables.txt` | Full quality token list |
| `grok-imagine-quality-variables.json` | `all` + `lab_preferred` + avoid list |
| `sheets/6-quality-variables.csv` | Sheets tab `6-quality-variables` |
| `n8n-quality-variables-expression.txt` | Code node: pick 6 lab-safe tokens |

## How to use in prompts
Append to Imagine / still prompts:

```text
... scene_brief ... , {{ $json.quality_suffix }}
```

## FDA note
Prefer `lab_preferred`. Pause/avoid tokens that imply human skin, wellness hype, or dreamy lifestyle (see JSON `avoid_for_fda_human_implication`).
Also filter scene briefs that show hands/injection when generating research-safe reels.

## 500 unique creations (canonical)
Use these for production Reel Studio / Grok Imagine runs:

| File | Role |
|---|---|
| `pbvita-500-unique-reel-creations.json` | Full library |
| `sheets/7-unique-reel-creations-500.csv` | Sheets tab for n8n pick-one-per-run |
| `pbvita-500-unique-reel-creations.audit.json` | Uniqueness + FDA audit |

Each row = unique scene_id + unique quality bundle + full FDA-framed `video_prompt`.

