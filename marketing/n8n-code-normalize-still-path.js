// n8n Code node: normalize_still_path
// Mode: Run Once for All Items
//
// Wire:
//   choose_still_path → **normalize_still_path** → switch_still_path
//
// Guarantees still_path is exactly "edit" or "skip" so Switch always emits.

var j = Object.assign({}, ($input.first() && $input.first().json) || $json || {});

var raw = String(j.still_path || j.path || j.route || '').trim().toLowerCase();

if (raw === 'edit' || raw === 'e' || raw === 'true' || raw === '1' || raw === 'yes') {
  j.still_path = 'edit';
} else if (raw === 'skip' || raw === 's' || raw === 'false' || raw === '0' || raw === 'no') {
  j.still_path = 'skip';
} else {
  // Safe default if Fixed field was blank / mistyped — change to 'edit' if you prefer
  j.still_path = 'skip';
  j.still_path_was_blank = true;
}

return [{ json: j }];
