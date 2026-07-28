# Parse Grok — Figma Content Studio fields

Use after the Grok HTTP node in **PBVita — Figma Content Studio** only.  
Do **not** change the Buffer daily workflow’s Parse node.

## Chain position
`HTTP Grok → Parse_Grok → IF compliance_ok`

**After:** `Grok` (chat completions)  
**Before:** `IF_Compliance`

## Option A — Edit Fields (no Code)

1. Add **Edit Fields**
2. Name: `Parse_Grok`
3. Mode: **Manual Mapping**
4. **Include Other Input Fields**: OFF
5. Map:

| Name | Type | Value (fx ON) |
|---|---|---|
| `compound_id` | String | `={{ JSON.parse($json.choices[0].message.content).compound_id }}` |
| `compound_name` | String | `={{ JSON.parse($json.choices[0].message.content).display_name }}` |
| `figma_headline` | String | `={{ JSON.parse($json.choices[0].message.content).creative_brief.headline }}` |
| `figma_subhead` | String | `={{ JSON.parse($json.choices[0].message.content).creative_brief.subhead }}` |
| `bullet_1` | String | `={{ JSON.parse($json.choices[0].message.content).creative_brief.bullets[0] }}` |
| `bullet_2` | String | `={{ JSON.parse($json.choices[0].message.content).creative_brief.bullets[1] }}` |
| `bullet_3` | String | `={{ JSON.parse($json.choices[0].message.content).creative_brief.bullets[2] }}` |
| `cta` | String | `={{ JSON.parse($json.choices[0].message.content).creative_brief.cta }}` |
| `ig_caption_draft` | String | `={{ JSON.parse($json.choices[0].message.content).platform_copy.instagram.caption }}` |
| `fb_caption_draft` | String | `={{ JSON.parse($json.choices[0].message.content).platform_copy.facebook.caption }}` |
| `compliance_ok` | Boolean | `={{ JSON.parse($json.choices[0].message.content).compliance_check.ok }}` |
| `compliance_flags` | String | `={{ (JSON.parse($json.choices[0].message.content).compliance_check.flags || []).join('; ') }}` |
| `created_at` | String | `={{ $now.toISO() }}` |
| `used_in_figma` | String | `no` |
| `image_url` | String | `` (leave empty until Grok_Imagine) |

> Prefer Option B if Grok ever returns invalid JSON — Code can catch and flag.

## Option B — Code node (recommended)

**After:** `Grok`  
**Before:** `IF_Compliance`

Name: `Parse_Grok`  
Mode: Run Once for Each Item  

Paste from `marketing/n8n-code-parse-figma-studio.js`.

## Verify
Execute `Parse_Grok`. You should see:
- `figma_headline` like `BPC-157` or `BPC-157 Research Material`
- `bullet_1` / `bullet_2` / `bullet_3` research-only
- `ig_caption_draft` ending with the FDA disclaimer
- `compliance_ok` = `true`
- `used_in_figma` = `no`
