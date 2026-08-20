# Vid_gen_landscape_scenes (500 peptide wellness)

**Live (unpublished):** https://stockjohnson.app.n8n.cloud/workflow/Kc2HqqjSyiKs87qy  
**Sheet:** `500_Peptide_Wellness_Reel_Scenes.csv` (gid `444650679`)  
Caption is a **separate** workflow. Do **not** Publish. Do **not** wire `Parse_Grok` / `GROK_API` back into this daily path.

## Daily path (linear)

```text
Schedule Trigger
  → get_reel_creations
  → filter_creations_active
  → pick_creation
  → grok_imagine_reel_still
  → flag_still_edit
  → prep_still_edit
  → grok_imagine_edit_still
  → save_still_url
  → prep_grok_video_start
  → grok_video_start
  → wait_video
  → grok_video_poll
  → save_video_url
  → sheets_update_creation
```

Leftover caption nodes stay **disabled** and **unwired**: `get_rows_in_sheet` → `filter_active` → `sort_rotation` → `Limit` → `Prep_day_variant` → `Edit Fields1` → `GROK_API` → `Parse_Grok` → `if_complaince`.

## `save_video_url` must not reference `Parse_Grok`

n8n error **“No path back to referenced node Parse_Grok”** was `save_video_url` leftover caption fields:

| Name | Was (do not restore) |
|---|---|
| `ig_caption_draft` | `={{ $('Parse_Grok').item.json.ig_caption_draft }}` |
| `fb_caption_draft` | `={{ $('Parse_Grok').item.json.fb_caption_draft }}` |
| `compliance_ok` | `={{ $('Parse_Grok').item.json.compliance_ok }}` |

`sheets_update_creation` only writes `creation_id`, `reel_still_url`, `video_url`, `times_used`, `last_used_at`. Captions never went onto this sheet from this node.

Keep these assignments (fx **ON**):

| Name | fx | Value |
|---|---|---|
| `video_url` | **ON** | `={{ $json.video.url }}` |
| `video_request_id` | **ON** | `={{ $('grok_video_start').item.json.request_id }}` |
| `video_model` | **ON** | `={{ $('pick_creation').first().json.model_video }}` |
| `video_seconds` | **ON** | `={{ String($('pick_creation').first().json.duration_seconds) }}` |
| `reel_still_url` | **ON** | `={{ $('prep_grok_video_start').item.json.reel_still_url }}` |
| `scene_id` | **ON** | `={{ $('prep_grok_video_start').item.json.scene_id \|\| $('pick_creation').item.json.scene_id }}` |
| `creation_id` | **ON** | `={{ $('pick_creation').item.json.creation_id \|\| $('pick_creation').item.json.scene_id }}` |
| `compound_id` | **ON** | `={{ $('pick_creation').item.json.compound_id }}` |
| `compound_name` | **ON** | `={{ $('pick_creation').item.json.compound_name }}` |
| `aspect_ratio` | **ON** | `={{ $('pick_creation').first().json.aspect_ratio }}` |

**Before → this_node → After:** `grok_video_poll` → **save_video_url** → `sheets_update_creation`
