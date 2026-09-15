# Handover brief — Reel Studio / vid-gen work

Written 2026-09-15 for the agent taking over from the previous Cloud Agent session.
Read this together with `AGENTS.md` (loaded automatically) and `marketing/sheets/README.md`
(the longest-lived record of what each tab is and what has been done to it).

---

## 0. Scope — do not cross this line

This repo and this agent are **only** for `www.palmbeach-vitality.store` (`PalmBeach-Vitality/store`).
`www.palmbeach-vitality.com` lives in a separate repo (`PalmBeach-Vitality/pep`) with a different
agent. If a request is clearly for the `.com` site, refuse and say so. The two sites look alike and
are easy to confuse.

Salvatore is a designer, not an n8n engineer. He wants outcomes and he wants to approve the creative
inputs. He is precise about product detail and will catch a wrong dose or a wrong spelling.

---

## 1. Where the work stands right now

**The immediate next event: Salvatore runs a smoketest of the landscape workflow on 2026-09-15.**
He said "we will run a smoketest tomorrow." Nothing is queued to run automatically. Do not generate
anything before he asks.

### The PR stack

Already on `main`, squash-merged by Salvatore on 2026-09-14:

- [#72](https://github.com/PalmBeach-Vitality/store/pull/72) — dropped 140 MB of unreferenced media, kept the I2V source stills.
- [#73](https://github.com/PalmBeach-Vitality/store/pull/73) — the Sheet 9 vial spec: hero scale, exact label strings, DNA emblem, correct volumes.

Still open:

| PR | Branch | Base | State |
|---|---|---|---|
| [#75](https://github.com/PalmBeach-Vitality/store/pull/75) | `cursor/wellness-scenes-products-4c4b` | `main` | ready, mergeable |
| [#66](https://github.com/PalmBeach-Vitality/store/pull/66) | `cursor/film004-alien-reach-4c4b` | `main` | draft, **on hold** |
| [#74](https://github.com/PalmBeach-Vitality/store/pull/74) | `cursor/lab-notes-ln004-3232` | `main` | draft, **different agent** |

`#75` used to be stacked on `#73`'s branch. The squash-merge of `#73` broke the auto-retarget — the
branch still carried the pre-squash commits, so `#75` went `dirty`. It was rebased with
`git rebase --onto origin/main 66132c5`, replaying only the eight wellness commits and dropping the
nine that `#73` already landed. The delta is unchanged.

`#66` is on hold pending Salvatore's call on whether FILM-004 is still live. Two things block it: it
adds a 12.8 MB clip, against the no-media-in-repo rule that `#72` just enforced, and it conflicts with
`#75` on `AGENTS.md`. It is **not** superseded — it holds the only committed copy of the hardened
prompt-review gate (workflow name + ID, API + model, still URL, duration/resolution/aspect, exact
motion prompt, then approve or deny). `main` still has the weaker "also name the API and model and
wait." Do not close `#66` without salvaging that first.

`#74` is another agent's (`-3232` suffix, not `-4c4b`). Leave it alone.

Current branch is `cursor/wellness-scenes-products-4c4b`. Stay on it unless Salvatore says otherwise.
New branches must match `cursor/<descriptive-name>-4c4b`, all lowercase.

---

## 2. The three vid-gen workflows

All three are **unpublished** and run manually with Execute. All three follow the same shape:
`choose_compound` → read sheet → filter Active → `pull_sheet_row` → Grok still → skip the still edit →
prep → video → write the URL and bump `times_used`.

| Workflow | ID | Sheet | Video API |
|---|---|---|---|
| `Vid_gen_lab_scenes -9-lab-items-creations-500` | `C4BkmmISpTMmgnAg` | Sheet 9 (vials) | fal Kling 3.0 Standard I2V, 15s |
| `Vid_gen_landscape_scenes -500-peptide-wellness-scenes` | `Kc2HqqjSyiKs87qy` | wellness (vials) | Grok Imagine Video 1.5 |
| `peptide_pen_vid_gen` | `eLM4xCpHflgqJGfB` | Sheet 14 (pens) | Grok Imagine Video |

Stills are Grok Imagine Image 2.0 on all three, via `https://api.x.ai/v1/images/generations`.

Credentials, so you reuse rather than pick: Google Sheets `OGHfxWtOUeZbDesw`, xAI header auth
`z1BIQ5TSRwkwn4UG` ("XAI Grok"), fal `qfVt9MnUeOJxRexp`. There is a second, unlabeled xAI header
credential (`yQi55LoiZSNWHMXA`, "Header Auth account 2") still attached to the lab workflow's
**disabled** `grok_video_poll`. Do not spread it further.

### What I changed in them this session

Landscape (`Kc2HqqjSyiKs87qy`), all with Salvatore's OK:

1. `save_still_url` fed `still_edit_instructions` instead of `skip_still_edit`, so the still-edit desk was on the live path and spent a second paid API call on every run. Rewired to `skip_still_edit`.
2. Added `assert_video_ok` between `grok_video_poll` and `save_video_url`. The poll fires once after `wait_video`; a failed or still-queued render used to write an empty `video_url` while `sheets_update_creation` still incremented `times_used`, so the row rotated out with nothing to show. Pen already had this guard. If it throws saying `queued` or `processing`, raise `wait_seconds` on the row.
3. `grok_video_poll` used the unlabeled duplicate credential; moved to "XAI Grok".
4. Dropped the sheet `audio` read from `prep_grok_video_start` and added the silent lock to the motion prompt (see §4).

Lab (`C4BkmmISpTMmgnAg`): pinned `fal_kling_generate`'s `generate_audio` to `={{ false }}`. It used to
read the field from the prep node. **The expression form matters** — fal treats the literal string
`"false"` as truthy, so it has to be `={{ false }}`, not `false`.

Pen (`eLM4xCpHflgqJGfB`): no changes. It was already correct on every point above.

---

## 3. The three sheets

The **live Google Sheet is the source of truth.** The repo CSVs are mirrors. They drift — the
wellness mirror was 688 rows behind live when I picked it up. Mirror before you analyse.

| Tab | Doc ID | gid | Mirror | Rows |
|---|---|---|---|---|
| `9-lab-item-creations-500` | `1dvY7XGwjdkQm2Sp7glAvxuSLg9RHrxJd9tXbhh74Xfc` | `136811109` | `marketing/sheets/9-lab-item-creations-500.csv` | 535 |
| `14-pen-creations-150` | `1L7bLOMa2Ri2AnWH4d4z7ahbz468Gcl8BhfQf9DVZn-4` | `1395194708` | `marketing/sheets/14-pen-creations-150.csv` | 168 |
| `500_Peptide_Wellness_Reel_Scenes` | `1S6UQmD4ZFW3oL4vx8BKmhWAZrt7KMGwsBS7jW3S9HPo` | `444650679` | `marketing/sheets/500_Peptide_Wellness_Reel_Scenes.csv` | 601 |

Mirror scripts: `mirror_live_sheet9.py`, `mirror_live_pen_sheet.py`, `mirror_live_wellness_sheet.py`.
Audit scripts: `audit_pen_sheet.py`, `audit_wellness_sheet.py`. Run the audit before and after any
change; it checks the node contract, selector reachability, and content.

**Do not let `mirror_live_sheet9.py` touch `9-lab-item-creations-250.csv`.** It used to overwrite that
historically distinct file with the -500 content, making them byte-identical. Already fixed; don't
reintroduce it.

---

## 4. Standing rules you will otherwise get wrong

These are the ones I got wrong or nearly got wrong. They are not obvious from the code.

### The prompt review gate is a hard rule

Before **every** still, video, or edit generation — Flux, Grok, Kling, Seedance, Veo, Runway, Sonilo,
n8n overlay-and-generate, retries, one-offs — send Salvatore the **exact** prompt text in chat and
wait for his OK. Before every video run also send: workflow name and ID, API and model, the still URL
if I2V, duration / resolution / aspect, and the exact motion prompt. Then wait for approve or deny.

Do not overlay-and-execute in the same turn as the ask. A rewrite after a block is a **new** ask.
Skill: `.cursor/skills/prompt-review-gate/SKILL.md`.

### Audio is off. Always. All three workflows.

Salvatore, 2026-09-15: *"audio should always be off - for all 3 of those workflows."*

This is the **one generation value the nodes are allowed to hardcode**, and he asked for it
explicitly. `.cursor/rules/no-hardcode-unless-asked.mdc` used to list `audio` as a value that must
come from the sheet, which is exactly the trap: I read the rule, saw a hardcoded `audio: false`, and
started making it sheet-driven. Wrong direction. The rule file now records the exception — read it.

Each prep node forces `audio: false` / `generate_audio: false` **and** prefixes the sheet
`video_motion_prompt` with:

```
Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio.
```

Both, because the API flag alone has let a clip come back scored. The sheets still carry an `audio`
column and `pull_sheet_row` refuses to run if it is blank, so leave `FALSE` in it — but nothing
downstream reads it. Do not wire it back.

### `still_edit_instructions` is a scratch node

Salvatore, 2026-09-15: *"Still_edit_instructions is a fluid node. Ignore any prompts there. that is
not a true path for the workflow."*

It is a pad he types over per run. Whatever prompt is sitting in it is **not** a lock, **not** a
hardcode, and **not** a defect. Do not audit it, report it, or "fix" it. I did all three and had to
back it out.

The **wire** into it is a different question and is worth raising: if `save_still_url` feeds
`still_edit_instructions` instead of `skip_still_edit`, the edit desk is live and burning an API call
per run. That is a real finding. The contents are not.

The lab workflow's copy still holds an old one-off about centring the vial and rewriting `50 mg/ml`.
Ignore it.

### Everything else comes from the sheet

No hardcoded prompts, models, duration, aspect, resolution, `n`, wait seconds, cameras, motion,
compound names, captions, or `|| '9:16'`-style fallbacks. Nodes may only map sheet fields with
expressions, call APIs, and write results back. **Empty sheet cell → throw.** Never invent a
fallback. Full rule: `.cursor/rules/no-hardcode-unless-asked.mdc`.

### Other house rules that bite

- **9:16 only.** `1080p` means 1080 × 1920, never 1920 × 1080. Never recommend 16:9 for studio video.
- **Image and video quality is priority #1.** A sheet cell saying `2k` is not proof; measure pixels. Soft stills make soft I2V. `marketing/vid-gen-quality-playbook.md`.
- **Repo and sheet move together.** If you change a live sheet row, update the matching repo CSV in the same turn, and vice versa. Never leave a lock in the repo only. Do not ask Salvatore to "push" a sheet write — do both yourself.
- **Any `.csv` you touch:** include a clickable GitHub blob link to each changed file in your reply, on the current branch.
- **Any n8n node you describe:** lead with the wire position as `Before → **This node** → After`, every time.
- **Humans in frame:** if a still or video contains a person, you must first read `.cursor/skills/prompt-moderation-hygiene/SKILL.md` and `references/human-subjects.md`, run the pre-flight gate, and say in your reply that the gate ran and what it decided. Never run a face-forward human row on Veo. Log the result in `references/incidents.md` afterward.
- **Do not touch n8n nodes without asking.** Salvatore said this in capitals. Sheet writes and repo edits are fine; node edits need an explicit OK.

---

## 5. How to write to a live Google Sheet

There is **no direct Sheets write** available. The MCP Google Drive tools cannot write cells and
there are no Google API credentials in the environment. I verified this twice; don't burn time
re-litigating it.

The working pattern, used for every sheet write this session:

1. Generate the payload as JSON in the repo (e.g. `marketing/sheets/500-wellness-rebuild.json`), commit, push. The workflow fetches it from `raw.githubusercontent.com` on the branch.
2. Build a **throwaway** n8n workflow with the SDK (`create_workflow_from_code`), named for the job (`wellness_rebuild_apply`). Validate with `validate_workflow` first.
3. **Set `cellFormat: RAW`** on every append and update. The default `USER_ENTERED` coerces `9:16` into a time value.
4. On a Sheets `update` node, the `columns` parameter needs an explicit `schema` declaring which fields are matchable, or it fails with *"The 'Column to Match On' parameter is required."*
5. An HTTP Request node fetching a JSON array may deliver it as one item containing an array, as many items, or as a raw string under `data` when the content type is `text/plain`. Handle all three in the exploding Code node, and assert the row count and that key fields are non-blank.
6. Publish, execute, then build a **separate read-only verify workflow** and confirm the write landed.
7. **Archive both.** I left `landscape_digest` unarchived by accident; archived it at handover. Check `search_workflows` for strays before you finish.
8. Re-mirror the live sheet into the repo and commit, so the mirror matches what you just wrote.

Payloads around 7.5 MB worked fine through this path.

---

## 6. The compound selector footgun

`pull_sheet_row` matches `compound_name` with a **two-way substring** test: a row matches if the
typed string contains the row's name *or* the row's name contains the typed string. So a short name
silently swallows a longer one, and typing the real product name can select the wrong product.

This is why some rows use a **selector handle** in `compound_name` that differs from the name printed
on the label. The handle is never sent to an image API — only `video_prompt` is — so the vial still
prints the human name.

On the wellness tab:

| Type this | You get |
|---|---|
| `Tesa-Ipa` | the Tesamorelin/Ipamorelin blend. **Typing `Tesamorelin/Ipamorelin` gets you solo Tesamorelin** |
| `Ipamorelin-Solo` | Ipamorelin alone. Plain `Ipamorelin` is ambiguous with `CJC/Ipamorelin` |
| `CJC-1295` | CJC alone. Plain `CJC` is ambiguous with `CJC/Ipamorelin` |
| `TA-1` | Thymosin Alpha-1. Typing `Thymosin Alpha-1` matches nothing and throws |

The other 19 compounds match on their own names. Sheet 14 uses the same handles. When several rows
share a compound the least-used wins: `times_used`, then `last_used_at`, then `rank`.

`simulate_choose_compound.py` and `verify_rows_against_workflow.py` check this before you add rows.

---

## 7. Product spec as it stands

Every printed string for every product, pens and vials, is in
**`marketing/compound-identification-prompts.txt`** — 23 vial compounds, 30 pens, with the full label
clause ready to copy. It is generated by `build_compound_identification_txt.py` from the three
mirrors, so it is a report and never a source of truth. Regenerate after any label change.

**Vials** carry four printed strings: compound name, dose bar, concentration line, footer. Plus a
per-volume body clause, because Salvatore noticed the glass was not varying by volume: a 10ml body is
stout at about **1.2×** as tall as it is wide, a 5ml is narrower at about **1.6×**. The label wraps
the straight cylindrical body only, with clear glass showing above and below it.

The vial geometry, the DNA helix emblem, and `brick red #A63334` were all matched to a catalog
reference photo Salvatore supplied. The emblem spec is deliberately long (two tapering ribbons, three
crossings, stepped rungs in the gaps) because a short description rendered it as beadwork.

`HERO SCALE (MANDATORY)` puts the glass body at **40–45% of frame width and about two thirds of frame
height**, upright and centred with the label facing camera. That clause exists because a Cagrilintide
still came back with an illegible label: nothing in the prompt said how big the hero should be, so
the small type had too few pixels to resolve. Salvatore asked to start at 150% of the old size and
adjust from there, targeting roughly half the frame — so this number may still move.

Applied by `match_catalog_vial_artwork.py`, `fix_vial_helix_emblem.py`, `fix_vial_label_legibility.py`.

`marketing/compound-vial-labels.json` is the dose/concentration/volume catalog. Tesamorelin/Ipamorelin
is a **10ml** vial with **no** mg/ml (Salvatore corrected the catalog); Cagrilintide is **5ml**.

**Pens** carry two printed strings: the compound name and a `3ml Pen` badge. The prompt explicitly
forbids a dose or concentration anywhere in frame, so a pen never shows mg or mg/mL. Every pen is
`crimson red #DC143C` — Salvatore removed Semaglutide, Tirzepatide and Retatrutide from the tab, so
there is no blue metabolic SKU left and no colour exception.

---

## 8. Open decisions that need Salvatore

Do not resolve these yourself.

1. **Two products print different names depending on form factor.** A vial prints `Melanotan II`, a pen prints `Melanotan 2`. A vial prints `Semax`, a pen prints `SEMAX`. A reel that cuts a vial next to a pen shows both spellings. He needs to pick one per product.
2. **BPC-157 has two real SKUs but only one reached the wellness tab.** Sheet 9 prints `10MG`/`1mg/mL` on 55 rows and `20MG`/`2mg/mL` on 5; the price sheet confirms both ($30 and $51). The wellness tab only has the 10mg. Coverage gap, not an error.
3. **Seven products are pen-only** — 5-Amino-1MQ, DSIP, Dihexa, Epithalon, Glutathione, IGF-LR3, Kisspeptin. He chose to keep them off the vial sheets. Revisit only if he asks.

Reported and deliberately not edited:

- `save_video_url` on the landscape workflow names eight Set fields with a leading `=` (`=video_url`). Cosmetic — n8n strips it when resolving, so they work. Left alone.
- The sheets' `still_edit_prompt` column is read by nothing.
- `category` still reads `vial_10ml` on the 24 Cagrilintide rows, which are 5ml. No node composes `category` into a prompt.
- The pen workflow's canvas sticky note still describes the old red/blue split and names Semaglutide as an example. Stale; node edits need his OK.
- Several node mirrors exist as near-duplicate pairs (`n8n-code-landscape-pick-creation.js` vs `n8n-code-pick-landscape-creation.js`). That sprawl is how a stale paste target survived long enough to matter — one consolidation pass would be worth it.

---

## 9. Mistakes already made — don't repeat them

- **I flagged `still_edit_instructions` contents as a defect in three docs.** It is a scratch pad. Backed out. See §4.
- **I started making audio sheet-driven** because the no-hardcode rule said to. It was the one value that should be hardcoded. See §4.
- **I reconstructed a 140-line Code node from memory** to edit one line. It happened to match, but re-fetch the live node before editing it — `get_workflow_details` then a surgical string edit, and confirm with `get_workflow_versions_diff` afterward.
- **I ran `git add -A` once** and swept unrelated files into one commit, and clobbered the git identity doing it. Stage explicit paths. One commit per logical change.
- **A doc told you to paste a file that would have re-enabled sheet-driven audio.** When you change a node, update its repo mirror in the same turn, and check whether a near-duplicate mirror exists.
- **The `-250` CSV clobber** described in §3.

## 10. Verification habits that paid off

- Apply n8n changes as one atomic `update_workflow` batch, then diff the saved versions with `get_workflow_versions_diff` to prove only the intended lines moved.
- Before a run, check the sheet against the node's actual contract — every field `pull_sheet_row` throws on, numerics positive, `aspect_ratio` parseable. The wellness tab passed this on 2026-09-15: 601 rows all Active, no duplicate `creation_id`, nothing blank.
- Any script that rewrites prompts should carry a QA block and an idempotence guard so a second run is a no-op. `fix_vial_label_legibility.py` and `trim_pen_video_prompts.py` both refuse to run twice.
- Extract rather than compose. Every string in the identification file is quoted from a sheet, so the file cannot drift into being a rival source of truth.
