# 250 lab-item variables (ONLY subjects for image/video)

**Problem:** Abstract scene prompts produced nonsense (e.g. clear orb/ball) — not usable for peptide research ads.  
**Rule:** Image + video generation may use **only** these 250 real laboratory items as subject variables.

## Files

| File | Role |
|---|---|
| `sheets/8-lab-items-250.csv` | Master list of 250 lab items |
| `sheets/9-lab-item-creations-250.csv` | 250 ready creations (`video_prompt` locked to one lab item each) |
| `pbvita-250-lab-items.json` | Same items as JSON |
| `pbvita-250-lab-item-creations.json` | Same creations as JSON |

## Import (Sheets)

1. Import `8-lab-items-250.csv` → tab `8-lab-items-250` (reference)
2. Import `9-lab-item-creations-250.csv` → tab `9-lab-item-creations-250`
3. Point `get_reel_creations` at **this** spreadsheet/tab (not the old abstract `7-unique-reel-creations-500` for Imagine)
4. Keep filter `status = Active`
5. `pick_creation` still picks least-used; it already exposes `video_prompt`

Each creation id looks like `PBVita-Lab-001` … `PBVita-Lab-250`.

## Prompt hard rules (baked into `video_prompt`)

- PRIMARY SUBJECT = one concrete lab item (vial, research pen, pipette, balance, carton, etc.)
- Explicit ban: orbs, crystal balls, surreal spheres, CGI blobs, nebula, fantasy energy
- FDA: no people/hands/skin injection/lifestyle/wellness/nicknames
- Still: `grok-imagine-image-quality` + `resolution: 2k` + `9:16`
- Video: `grok-imagine-video-1.5` + max resolution

## n8n

After re-import, Node 1 body stays the same — it already uses `$json.video_prompt` — but that prompt must now come from **lab-item creations**:

```text
pick_creation.video_prompt  ← from tab 9-lab-item-creations-250
  → grok_imagine_reel_still (2k quality model)
```

Do **not** feed old abstract `7-unique-reel-creations-500` scenes into Imagine anymore.
