# WordPress paste: 5 product-copy fixes

Live catalog copy lives in WooCommerce, not this repo. WooCommerce REST write is locked without API keys, so these have to go in **WP Admin → Products**.

In the product editor, switch the description to **Code / Text** (not Visual) and replace the whole Product description. Research Studies below the description can stay.

| # | Product | WP ID | Direct edit |
|---|---------|------:|-------------|
| 1 | TA-1 (pen) | 137 | https://palmbeach-vitality.store/wp-admin/post.php?post=137&action=edit |
| 2 | Semax Pen | 131 | https://palmbeach-vitality.store/wp-admin/post.php?post=131&action=edit |
| 3 | Semax Vial | 298 | https://palmbeach-vitality.store/wp-admin/post.php?post=298&action=edit |
| 4 | NAD+ 500mg Vial | 206 | https://palmbeach-vitality.store/wp-admin/post.php?post=206&action=edit |
| 5 | NAD+ 1000mg Vial | 189 | https://palmbeach-vitality.store/wp-admin/post.php?post=189&action=edit |

Also rename product 137 title from `TA-1` to `TA-1 Pen`.

Assumptions used (do not paste if a COA disagrees):

- **TA-1 Pen** total is **10 mg / 3 mL** (same structure as the Sermorelin page it was copied from; TA-1 vial is already 10 mg).
- **Semax Pen** total is **20 mg / 3 mL** (that spec is already on the Semax Vial page, which was written as a pen).
- **Semax Vial** keeps **20 mg** and becomes a **10 mL vial at 2 mg/mL**.
- **NAD+ 500mg** total line `1000 mg` → **500 mg** (matches title + 50 mg/mL × 10 mL).
- **NAD+ 1000mg** intro `500mg` → **1000mg**, concentration **100 mg/mL** (matches title + 1000 mg in 10 mL).

---

## 1. TA-1 Pen (id 137)

Replace Sermorelin copy.

```html
<p dir="auto"><strong>TA-1 3 mL Pen</strong></p>
<p dir="auto"><strong>The Science, Simplified:</strong> TA-1 (Thymosin Alpha-1) is a synthetic 28-amino acid peptide corresponding to the N-terminal active fragment of prothymosin alpha.</p>
<p dir="auto"><strong>Product Specifications – TA-1 10 mg 3 mL Pen</strong></p>
<ul dir="auto">
<li>Total TA-1: 10 mg</li>
<li>Volume: 3 mL pre-filled pen</li>
<li>Concentration: ≈3.33 mg/mL</li>
<li>Purity: Research-grade, third-party tested (COA available)</li>
<li>Format: Ready-to-use multi-dose pre-filled pen</li>
</ul>
<p dir="auto"><strong>Key Research Focus:</strong> Immune modulation and T-cell research.</p>
<p dir="auto"><strong>Physical Form &amp; Solubility:</strong></p>
<ul dir="auto">
<li>Appearance: Clear to slightly opalescent liquid</li>
<li>Solubility: Already in aqueous solution (acetate salt form for optimal solubility and stability). Highly soluble; no reconstitution required.</li>
</ul>
<p dir="auto"><strong>Pen Format Details:</strong> The 3 mL pre-filled pen is a sterile, multi-dose delivery system designed for precise, consistent dispensing of the research compound. It features a sealed cartridge, dial-a-dose mechanism for accurate volume control, and a fine-gauge needle interface. The pen is ready for immediate laboratory use with no mixing or transfer steps required. Each pen is labeled with total peptide content and lot-specific COA reference.</p>
<p dir="auto"><strong>Stability &amp; Handling Notes:</strong></p>
<ul dir="auto">
<li>Refrigerated at 2–8°C (36–46°F). Practical shelf life is <strong>4–6 weeks</strong> when protected from light and handled with aseptic technique.</li>
<li>Do not freeze. Avoid prolonged room-temperature exposure.</li>
<li>Discard after 6 weeks or if the solution becomes cloudy, discolored, or shows particulate matter.</li>
<li>Protect from light and moisture at all times.</li>
</ul>
```

---

## 2. Semax Pen (id 131)

Replace PT-141 copy. Science + 20 mg spec come from the current Semax Vial page (which was written as a pen).

```html
<p dir="auto"><strong>Semax 3 mL Pen</strong></p>
<p dir="auto"><strong>The Science, Simplified:</strong> Semax is a synthetic heptapeptide analog of the adrenocorticotropic hormone fragment ACTH(4-10).</p>
<p dir="auto"><strong>Product Specifications – Semax 20 mg 3 mL Pen</strong></p>
<ul dir="auto">
<li>Total Semax: 20 mg</li>
<li>Volume: 3 mL pre-filled pen</li>
<li>Concentration: ≈6.67 mg/mL</li>
<li>Purity: Research-grade, third-party tested (COA available)</li>
<li>Format: Ready-to-use multi-dose pre-filled pen</li>
</ul>
<p dir="auto"><strong>Key Research Focus:</strong> Nootropic and neuroprotective research.</p>
<p dir="auto"><strong>Physical Form &amp; Solubility:</strong></p>
<ul dir="auto">
<li>Appearance: Clear to slightly opalescent liquid</li>
<li>Solubility: Already in aqueous solution (acetate salt form for optimal solubility and stability). Highly soluble; no reconstitution required.</li>
</ul>
<p dir="auto"><strong>Pen Format Details:</strong> The 3 mL pre-filled pen is a sterile, multi-dose delivery system designed for precise, consistent dispensing of the research compound. It features a sealed cartridge, dial-a-dose mechanism for accurate volume control, and a fine-gauge needle interface. The pen is ready for immediate laboratory use with no mixing or transfer steps required. Each pen is labeled with total peptide content and lot-specific COA reference.</p>
<p dir="auto"><strong>Stability &amp; Handling Notes:</strong></p>
<ul dir="auto">
<li>Refrigerated at 2–8°C (36–46°F). Practical shelf life is <strong>4–6 weeks</strong> when protected from light and handled with aseptic technique.</li>
<li>Do not freeze. Avoid prolonged room-temperature exposure.</li>
<li>Discard after 6 weeks or if the solution becomes cloudy, discolored, or shows particulate matter.</li>
<li>Protect from light and moisture at all times.</li>
</ul>
```

---

## 3. Semax Vial (id 298)

Keep Total Semax 20 mg. Convert format from pen to 10 mL vial (same pattern as Sermorelin 20 mg vial).

```html
<p dir="auto"><strong>Semax 10 mL Vial</strong></p>
<p dir="auto"><strong>The Science, Simplified:</strong> Semax is a synthetic heptapeptide analog of the adrenocorticotropic hormone fragment ACTH(4-10).</p>
<p dir="auto"><strong>Product Specifications – Semax 10 mL Vial (20 mg)</strong></p>
<ul dir="auto">
<li>Total Semax: 20 mg</li>
<li>Volume: 10 mL vial</li>
<li>Concentration: 2 mg/mL</li>
<li>Purity: Research-grade, third-party tested (COA available)</li>
<li>Format: Ready-to-use liquid vial</li>
</ul>
<p dir="auto"><strong>Key Research Focus:</strong> Nootropic and neuroprotective research.</p>
<p dir="auto"><strong>Physical Form &amp; Solubility:</strong></p>
<ul dir="auto">
<li>Appearance: Clear to slightly opalescent liquid</li>
<li>Solubility: Already in aqueous solution (acetate salt form for optimal solubility and stability). Highly soluble; no reconstitution required.</li>
</ul>
<p dir="auto"><strong>Stability &amp; Handling Notes:</strong></p>
<ul dir="auto">
<li>Lyophilized powder (if applicable for other products): Stable long-term at –20°C (typically 1–2 years when protected from moisture and light).</li>
<li><strong>Liquid (ready-to-use or reconstituted):</strong> Refrigerated at 2–8°C (36–46°F). Practical shelf life is <strong>4–6 weeks</strong> when protected from light and handled with aseptic technique. Do not freeze. Avoid prolonged room-temperature exposure. Discard after 6 weeks or if the solution becomes cloudy, discolored, or shows particulate matter.</li>
<li>Protect from light and moisture at all times.</li>
<li>For <strong>lyophilized</strong> orders please contact us (minimum order required)</li>
</ul>
```

---

## 4. NAD+ 500mg Vial (id 206)

Only the total line was wrong (`1000 mg` vs title + 50 mg/mL × 10 mL).

```html
<p dir="auto"><strong>NAD+ 10 mL Vial 500mg</strong></p>
<p dir="auto"><strong>The Science, Simplified:</strong> NAD+ (nicotinamide adenine dinucleotide, oxidized form) is a critical coenzyme involved in cellular redox reactions and energy metabolism.</p>
<p dir="auto"><strong>Product Specifications – NAD+ 10 mL Vial (500 mg)</strong></p>
<ul dir="auto">
<li>Total NAD+: 500 mg</li>
<li>Volume: 10 mL vial</li>
<li>Concentration: 50 mg/mL</li>
<li>Purity: Research-grade, third-party tested (COA available)</li>
<li>Format: Ready-to-use liquid vial</li>
</ul>
<p dir="auto"><strong>Key Research Focus:</strong> Cellular energy metabolism and redox research.</p>
<p dir="auto"><strong>Physical Form &amp; Solubility:</strong></p>
<ul dir="auto">
<li>Appearance: Clear liquid*</li>
<li>Solubility: Already in aqueous solution. Highly soluble; no reconstitution required.</li>
</ul>
<p dir="auto"><strong>Stability &amp; Handling Notes:</strong></p>
<ul dir="auto">
<li>Refrigerated at 2–8°C (36–46°F). Practical shelf life is <strong>4–6 weeks</strong> when protected from light and handled with aseptic technique.</li>
<li>Do not freeze. Avoid prolonged room-temperature exposure.</li>
<li>Discard after 6 weeks or if the solution becomes cloudy, discolored, or shows particulate matter.</li>
<li>Protect from light and moisture at all times.</li>
<li>For <strong>lyophilized</strong> orders please contact us (minimum order required)</li>
</ul>
```

---

## 5. NAD+ 1000mg Vial (id 189)

Intro said 500mg; concentration 50 mg/mL × 10 mL cannot be 1000 mg. Title and Total already say 1000 mg.

```html
<p dir="auto"><strong>NAD+ 10 mL Vial 1000mg</strong></p>
<p dir="auto"><strong>The Science, Simplified:</strong> NAD+ (nicotinamide adenine dinucleotide, oxidized form) is a critical coenzyme involved in cellular redox reactions and energy metabolism.</p>
<p dir="auto"><strong>Product Specifications – NAD+ 10 mL Vial (1000 mg)</strong></p>
<ul dir="auto">
<li>Total NAD+: 1000 mg</li>
<li>Volume: 10 mL vial</li>
<li>Concentration: 100 mg/mL</li>
<li>Purity: Research-grade, third-party tested (COA available)</li>
<li>Format: Ready-to-use liquid vial</li>
</ul>
<p dir="auto"><strong>Key Research Focus:</strong> Cellular energy metabolism and redox research.</p>
<p dir="auto"><strong>Physical Form &amp; Solubility:</strong></p>
<ul dir="auto">
<li>Appearance: Clear liquid*</li>
<li>Solubility: Already in aqueous solution. Highly soluble; no reconstitution required.</li>
</ul>
<p dir="auto"><strong>Stability &amp; Handling Notes:</strong></p>
<ul dir="auto">
<li>Refrigerated at 2–8°C (36–46°F). Practical shelf life is <strong>4–6 weeks</strong> when protected from light and handled with aseptic technique.</li>
<li>Do not freeze. Avoid prolonged room-temperature exposure.</li>
<li>Discard after 6 weeks or if the solution becomes cloudy, discolored, or shows particulate matter.</li>
<li>Protect from light and moisture at all times.</li>
<li>For <strong>lyophilized</strong> orders please contact us (minimum order required)</li>
</ul>
```
