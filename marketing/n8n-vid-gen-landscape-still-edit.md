# Landscape still edit — type the prompt on the node

Workflow: `Vid_gen_landscape_scenes -500-peptide-wellness-scenes`  
https://stockjohnson.app.n8n.cloud/workflow/Kc2HqqjSyiKs87qy

Unpublished. Do **not** Publish. Same pattern as lab / pen: type the edit on **`still_edit_instructions`**. Do not put the edit prompt in `prep_still_edit`.

```text
pick_creation
  → grok_imagine_reel_still
  → save_still_url
  → still_edit_instructions      ← TYPE still_edit_prompt HERE
  → prep_still_edit
  → grok_imagine_edit_still
  → save_edited_still_url
  → prep_grok_video_start
```

**Before → this → After:** `grok_imagine_reel_still` → **save_still_url** → `still_edit_instructions`

**Before → this → After:** `save_still_url` → **still_edit_instructions** → `prep_still_edit`

**Before → this → After:** `still_edit_instructions` → **prep_still_edit** → `grok_imagine_edit_still`

**Before → this → After:** `prep_still_edit` → **grok_imagine_edit_still** → `save_edited_still_url`

**Before → this → After:** `grok_imagine_edit_still` → **save_edited_still_url** → `prep_grok_video_start`

Open **`still_edit_instructions`**. Field **`still_edit_prompt`** is a fixed string — overwrite it, then Execute. Empty throws.

`model_still` / `aspect_ratio` / motion / duration stay on the wellness sheet. `still_edit_prompt` is this node.
