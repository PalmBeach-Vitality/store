// n8n Code node: enter_compound
// Workflow: peptide_caption_gen
// Mode: Run Once for All Items
// Settings → Execute Once = OFF
// After: manual_trigger
// Before: get_caption_science
//
// TYPE THE CATALOG NAME HERE, then Execute workflow.

var COMPOUND = 'BPC-157';

return [
  {
    json: {
      compound_name_input: String(COMPOUND || '').trim(),
    },
  },
];
