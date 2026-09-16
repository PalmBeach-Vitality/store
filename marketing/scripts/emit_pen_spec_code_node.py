#!/usr/bin/env python3
"""Emit the n8n Code node that applies the measured pen spec to the live sheet.

The live sheet has to end up byte-identical to the repo mirror, so the node's
replacement table is generated from apply_measured_pen_spec.py rather than
retyped. Retyping 8KB of lock text by hand into JavaScript is how the two
copies drift.

    python3 marketing/scripts/emit_pen_spec_code_node.py > /tmp/pen_spec_node.js
"""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent


def load_spec():
    spec = importlib.util.spec_from_file_location(
        "apply_measured_pen_spec", HERE / "apply_measured_pen_spec.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> None:
    m = load_spec()
    blocks = [[old, new] for _, old, new in m.BLOCKS]
    phrases = [[old, new] for old, new in m.PHRASES]

    js = f"""// One-shot: rewrite the pen tab's visual lock to the pen the catalog actually
// sells. Salvatore approved this text on 2026-09-16 after the first fal Kling Pro
// pen clip came back with a flared red base, and chose "match the catalog" on the
// dose line. Measured spec + every block replaced here:
// marketing/peptide-pen-visual-spec.md
//
// The table below is generated from marketing/scripts/apply_measured_pen_spec.py
// by marketing/scripts/emit_pen_spec_code_node.py, so the live sheet and the repo
// mirror cannot drift. Do not hand-edit it here.

const FIELDS = {json.dumps(m.FIELDS)};
const BLOCKS = {json.dumps(blocks, ensure_ascii=False)};
const PHRASES = {json.dumps(phrases, ensure_ascii=False)};
const STACK_NOTE = {json.dumps(m.STACK_NOTE, ensure_ascii=False)};
const DONE_MARKER = 'ONE CONSTANT DIAMETER';

function escapeRe(text) {{
  return text.replace(/[.*+?^${{}}()|[\\]\\\\]/g, '\\\\$&');
}}

// compound_name is the choose_compound key, not the printed name: 'Tesa-Ipa'
// prints 'Tesamorelin/Ipamorelin'. Capture whatever name the row prints and put
// it back unchanged.
function compile(oldText) {{
  const pattern = oldText.split('{{COMPOUND}}').map(escapeRe).join("([^'\\"]+?)");
  return new RegExp(pattern, 'g');
}}

const compiled = [];
for (const [oldText, newText] of BLOCKS.concat(PHRASES)) {{
  compiled.push([compile(oldText), newText, oldText]);
}}

const out = [];
let skipped = 0;

for (const item of $input.all()) {{
  const row = item.json || {{}};
  const id = String(row.creation_id || '').trim();
  if (!id) continue;

  const compound = String(row.compound_name || '').trim();
  if (!compound) {{
    throw new Error(`${{id}}: compound_name is empty on the sheet`);
  }}

  // Already migrated - leave it alone so a re-run cannot double the stack note.
  if (String(row.video_prompt || '').includes(DONE_MARKER)) {{
    skipped += 1;
    continue;
  }}

  const updated = {{ creation_id: id }};

  for (const field of FIELDS) {{
    let value = String(row[field] || '');
    if (!value) {{
      throw new Error(`${{id}}: ${{field}} is empty on the sheet`);
    }}

    // pin_pen_red_and_spec.py pinned the hex onto two fields only; drop it first
    // so every block has one spelling to match.
    value = value.split('crimson red #DC143C').join('crimson red');

    for (const [pattern, newText] of compiled) {{
      value = value.replace(pattern, (...args) => {{
        const groups = args.slice(1, -2).filter((g) => g !== undefined);
        const names = Array.from(new Set(groups));
        if (names.length > 1) {{
          throw new Error(`${{id}}/${{field}}: one block printed two names ${{names.join(', ')}}`);
        }}
        if (newText.includes('{{COMPOUND}}') && names.length === 0) {{
          throw new Error(`${{id}}/${{field}}: replacement wants a name, old text printed none`);
        }}
        return newText.split('{{COMPOUND}}').join(names[0] || '');
      }});
    }}

    if (value.includes('crimson red') || value.includes('matte white')) {{
      throw new Error(`${{id}}/${{field}}: old pen wording survived the rewrite`);
    }}

    updated[field] = value;
  }}

  if (!updated.video_prompt.includes(DONE_MARKER)) {{
    throw new Error(`${{id}}: the new lock did not land on video_prompt`);
  }}

  const isStack = compound.includes('/') || ['GLOW', 'KLOW', 'WOLVERINE'].includes(compound.toUpperCase());
  if (isStack) {{
    for (const field of ['video_prompt', 'still_edit_prompt']) {{
      if (!updated[field].includes(STACK_NOTE.trim())) {{
        updated[field] = updated[field].replace(/\\s+$/, '') + STACK_NOTE;
      }}
    }}
  }}

  out.push({{ json: updated }});
}}

console.log(`rewriting ${{out.length}} rows, skipping ${{skipped}} already migrated`);
return out;
"""
    print(js)


if __name__ == "__main__":
    main()
