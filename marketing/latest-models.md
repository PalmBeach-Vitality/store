# Still lock

| Tab | Still model | Resolution |
|---|---|---|
| `9-lab-item-creations-500` | `grok-imagine-image-2.0` | `2k` |
| `13-chem-breakdown-54` | `grok-imagine-image-2.0` | `2k` |
| `14-pen-creations-150` | `grok-imagine-image-2.0` | `2k` |
| `12-import-still-queue` | `grok-imagine-image-2.0` | `2k` |
| `7-unique-reel-creations-500` | `grok-imagine-image-2.0` | `2k` |
| **`18-motsc-film-stills` only** | OpenRouter `black-forest-labs/flux.2-max` (trial) | `9:16` |

Everything except `18-motsc-film-stills` stays Grok Imagine Image 2.0. Film video is unchanged.

Flux stills must go through OpenRouter `POST /api/v1/images`. Do not send `black-forest-labs/flux.2-max` to the xAI Grok still HTTP node.

Never `grok-imagine-image` or `grok-imagine-image-quality`.

Sheet source: `marketing/sheets/latest-models.csv`
