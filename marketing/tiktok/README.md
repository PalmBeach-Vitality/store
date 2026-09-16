# TikTok comment bank — @palmbeachvitality

1000 pre-cleared TikTok comments for organic engagement on US peptide, wellness, and peptide-science videos. Tik Tokky pulls straight from here — no n8n run, no Writee call, no per-comment approval.

## Files

| File | What it is |
| --- | --- |
| `tiktok_comment_bank.csv` | The deliverable. `id`, `category`, `comment`, `tone`, `asks_question`. |
| `tiktok_comment_bank.txt` | Same 1000 comments, same order, one per line, for quick paste. |
| `source/01-…` → `source/10-…` | The authored source, one file per category. **Edit here, never edit the CSV.** |
| `scripts/build-comment-bank.py` | Builds the CSV and TXT from source, and fails the build on any rule breach. |
| `scripts/verify-against-gate.py` | Second, independent check: runs the finished CSV through the live `fda_compliance_gate` rule set. |

## Current state

1000 comments, 100 per category, 503 questions (50.3%), longest comment 20 words, 1000 unique after normalizing case and punctuation, zero banned phrases, zero near-duplicates above 0.70 token overlap.

Tone split: 499 curious, 263 technical, 238 light.

## Adding more later

1. Open the right file in `source/`. Each line is `tone :: comment`, where tone is `curious`, `technical`, or `light`.
2. Add your lines. Do not renumber anything — ids are assigned at build time by file order, then line order.
3. Run the build:

```bash
python3 marketing/tiktok/scripts/build-comment-bank.py
```

4. Run the independent gate check:

```bash
python3 marketing/tiktok/scripts/verify-against-gate.py
```

Both must exit clean. The build **refuses to write the CSV** if anything fails, so a bad line can never reach Tik Tokky. Commit the source change and the regenerated CSV and TXT together.

If you add a category, add it to `CATEGORY_ORDER` in the build script and create `source/NN-<category>.txt` to match.

## Hard bans

Any comment containing these is rejected at build time. This list is the union of the `fda_compliance_gate` rule set and the extra commercial bans for social.

**Whole-word bans**
`cure` · `cures` · `cured` · `curing` · `treat` · `treats` · `therapy` · `therapies` · `patient` · `patients` · `guaranteed` · `dose` · `doses` · `dosage` · `dosing` · `heals` · `healed` · `mg` · `buy` · `discount` · `sale` · `result` · `results`

**Prefix bans**
`inject…` (catches injection, injecting, injectable) · `syring…`

**Phrase bans**
`treat your` · `cure for` · `fda approved` · `clinical use` · `recommended for` · `works for` · `you will` · `you'll` · `lose weight` · `weight loss` · `fat loss` · `burn fat` · `anti-aging results` · `reverse aging` · `healing you` · `take daily` · `mg/ml` · `human use` · `for human` · `for humans` · `human consumption` · `not for human` · `dm me` · `link in bio` · `before/after` · `stack for` · `protocol for taking`

**Also rejected:** emoji, hashtags, any all-caps word of three or more letters, under 5 words, over 28 words, exact duplicates, and near-duplicates.

Matching is whole-word where a substring would misfire, so `molecular weight` and `photoaging` pass while `weight loss` and `reverse aging` do not. Curly apostrophes are normalized first, so `you’ll` is caught the same as `you'll`.

## Style rules

- 5–20 words typical, 28 hard maximum
- Science, lab, and literature framing only
- Human, warm, sharp, curious — never salesy
- Roughly 40–50% questions, to pull replies
- No hashtag dumps, no emoji walls, no all-caps, no `First!` / `Nice!` filler
- No hard sell, no prices, no bio pushes, no competitor bashing
- No medical advice, no personal outcome promises

## Two deliberate decisions

**No disclaimers in this bank.** `not for human use, for research purposes only` is a banned phrase here on purpose. It reads as an ad in a comment thread and it drags the reply into product territory. If a disclaimer bank is ever needed, it belongs in a separate file with its own rules.

**The word `results` is banned outright**, not just in phrases. It is the single fastest way a science comment turns into an implied claim, and the bank reads better without it — `findings`, `data`, and `the published record` all do the job.
