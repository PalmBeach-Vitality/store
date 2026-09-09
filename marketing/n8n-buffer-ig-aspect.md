# Buffer Instagram feed aspect — 3:4

Workflow: `image_generation_buffer -3-image-scenes-150`  
https://stockjohnson.app.n8n.cloud/workflow/2Vk1OXkHX10g6KDu

Overlay (unpublished): `overlay_image_scenes_ig_aspect` `ZIYrxvFZAwk5omXf`

Buffer Instagram **posts** reject 9:16 (Stories/Reels). Allowed: **3:4** to **1.91:1**.

This factory generates **3:4** feed portraits. Sheet column `aspect_ratio` on `3-image-scenes-150`.

`Wait` → **prep_imagine_request** → `GROK_Imagine`  
`prep_imagine_request` → **GROK_Imagine** → `Save_render_URL`  
`GROK_Imagine` → **Save_render_URL** → `Buffer_post_IG`

Empty or `9:16` on the sheet throws. Do not type 9:16 into `prep_imagine_request`.

One-time sheet write (unpublished): https://stockjohnson.app.n8n.cloud/workflow/ZIYrxvFZAwk5omXf

`manual_trigger` → **get_image_scenes** → `overlay_ig_aspect`  
`get_image_scenes` → **overlay_ig_aspect** → `sheets_update_aspect`  
`overlay_ig_aspect` → **sheets_update_aspect** → `end`

Writes `aspect_ratio=3:4` on every `3-image-scenes-150` row (match `scene_id`).
