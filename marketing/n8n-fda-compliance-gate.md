# fda_compliance_gate

**New workflow** — paste any text, get a compliance verdict. Comments, captions, paragraphs, prompts, anything.
**Not** vid gen. **Not** Creatomate. No AI model, no API cost — pure rule scan, instant.

**Name the workflow exactly:** `fda_compliance_gate`
**Live (unpublished):** https://stockjohnson.app.n8n.cloud/workflow/NSAwidweoS1JcTIJ
**Log table:** `fda_gate_log` (n8n Data Table, project `Salvatore Johnson`)

Open `paste_prompt_here`, paste your text into `input_text`, hit Execute.

- **PASS** → nothing happens. Text is clean, use it.
- **CAUTION** or **FAIL** → email to `sales@palmbeach-vitality.com` listing every flagged phrase and how to fix it.

Every run is written to `fda_gate_log` either way, so there is an audit trail of what was checked and when.

---

## Wire (linear)

```text
manual_run
  → paste_prompt_here
  → fda_compliance_gate
  → log_gate_check
  → compliance_report
  → if_pass
      ├── true  → pass_no_action   (No Operation)
      └── false → email_failure    (Gmail → sales@palmbeach-vitality.com)
```

`if_pass` is the only branch. Everything before it is one straight line.

---

## Verdicts

| Verdict | Meaning | What happens |
| --- | --- | --- |
| `PASS` | No violations, no cautions | Nothing. No email. |
| `CAUTION` | No violations, but human framing outside the research-use disclaimer | Email |
| `FAIL` | One or more violations | Email |

The research-use disclaimer (`not for human use, for research purposes only`) is recognized and does **not** trigger a caution on its own — otherwise every compliant caption would flag. Human framing *without* that disclaimer still cautions.

---

## What it flags

**Violations (FAIL)**

- Disease cure / treatment: `cure`, `cures`, `cured`, `curing`, `treats`, `treat your`, `cure for`, `heals`, `healing you`
- Therapy / clinical framing: `therapy`, `clinical use`
- Human subjects: `patient`, `patients`
- Dosing: `dose`, `dosage`, `dosing`, `take daily`, `mg/ml`, and any milligram amount (`5mg`, `20 mg`)
- Administration: `inject*`, `syring*`
- False approval: `fda approved`, `fda-approved`
- Personal promises: `you will`, `you'll`, `guaranteed`, `recommended for`, `works for`
- Body-outcome promises: `lose weight`, `weight loss`, `fat loss`, `burn fat`, `reverse aging`, `anti-aging results`

**Cautions**

- `human use`, `for human`, `human consumption` when the research-use disclaimer is not present

Matching is whole-word where a substring would misfire (so `cure` does not trip on `secure`, and `mg` does not trip on `mgmt`). Curly apostrophes are normalized, so `you’ll` is caught the same as `you'll`.

---

## Node 1 — `manual_run`

**Type:** Manual Trigger

---

## Node 2 — `paste_prompt_here`

**Type:** Edit Fields (Set), mode Manual. Ships with all three fields empty.

| Field | Type | Notes |
| --- | --- | --- |
| `input_text` | String | The text to check. **Required** — empty throws. |
| `content_label` | String | Optional tag for the log, e.g. `IG comment draft` |
| `content_type` | String | Optional, e.g. `caption`, `comment`, `paragraph` |

---

## Node 3 — `fda_compliance_gate`

**Type:** Code. Tokenizes the text, scans the violation and caution lists, returns `verdict`, `violation_count`, `caution_count`, and a `hits` array with `phrase`, `severity`, `category`, and `guidance` per hit.

Throws `input_text is empty. Paste the text to check.` when nothing was pasted — it does not silently pass.

---

## Node 4 — `log_gate_check`

**Type:** Data table → Row → Insert, table `fda_gate_log`.

Columns: `checked_at`, `content_label`, `content_type`, `verdict`, `violation_count`, `caution_count`, `hits_json`, `input_text`.

---

## Node 5 — `compliance_report`

**Type:** Code. Turns the raw hits into a numbered, readable `flagged` list and a one-line `message`. This is the node to read on the canvas after a run.

---

## Node 6 — `if_pass`

**Type:** IF. `{{ $json.verdict }}` equals `PASS`.

True → `pass_no_action`. False (CAUTION or FAIL) → `email_failure`.

---

## Node 7 — `pass_no_action`

**Type:** No Operation. Deliberate dead end so PASS is visibly "nothing happened" on the canvas.

---

## Node 8 — `email_failure`

**Type:** Gmail → Message → Send. Credential `Gmail account 2`.

- **To:** `sales@palmbeach-vitality.com`
- **Subject:** `FDA compliance FAIL: 5 violation(s), 0 caution(s)`
- **Body (HTML):** verdict + message, counts, the numbered flagged list, the exact text that was checked, and the label / type / word count / timestamp footer
- **Append n8n Attribution:** OFF

---

## Tested

| Input | Verdict | Result |
| --- | --- | --- |
| Research paragraph, no claims | PASS | No email |
| Research paragraph + disclaimer | PASS | No email, disclaimer recognized |
| `Great for humans who want to feel young again...` | CAUTION | Email, 1 caution |
| `...cures fatigue and you will feel amazing. Inject 5mg daily, guaranteed.` | FAIL | Email sent, 5 violations |

---

## Adding a rule

The word lists live in `fda_compliance_gate` as three arrays:

- `VTOK` — whole-word violations
- `VSTEM` — prefix violations (`inject` catches `injection`, `injecting`)
- `VMULTI` — multi-word / substring violations
- `CMULTI` — cautions

Each entry is `[phrase, category, guidance]`. Add a row to the right array; nothing else needs to change.
