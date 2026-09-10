// n8n Code node: rebuild_chem_looks
// Mode: Run Once for All Items. Execute Once OFF.
// get_chem_creations → **rebuild_chem_looks** → sheets_update_chem_looks
// Fetches unique-first prompts from the repo CSV and writes them onto live Sheet 13.
// Keeps times_used / last_used_at / status from the live row.

function parseCsv(text) {
  var lines = [];
  var row = [];
  var cur = '';
  var inQ = false;
  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    var n = text[i + 1];
    if (inQ) {
      if (c === '"' && n === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQ = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQ = true;
    } else if (c === ',') {
      row.push(cur);
      cur = '';
    } else if (c === '\n') {
      row.push(cur);
      lines.push(row);
      row = [];
      cur = '';
    } else if (c !== '\r') {
      cur += c;
    }
  }
  if (cur.length || row.length) {
    row.push(cur);
    lines.push(row);
  }
  if (!lines.length) throw new Error('rebuild_chem_looks: empty CSV');
  var headers = lines[0];
  return lines.slice(1).filter(function (r) {
    return r.some(function (cell) { return String(cell || '').trim() !== ''; });
  }).map(function (r) {
    var o = {};
    headers.forEach(function (h, idx) {
      o[String(h || '').trim()] = r[idx] == null ? '' : r[idx];
    });
    return o;
  });
}

var CSV_URL = 'https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/chem-sheet-pick-4c4b/marketing/sheets/13-chem-breakdown-54.csv';
var text = await this.helpers.httpRequest({ method: 'GET', url: CSV_URL });
if (typeof text !== 'string') text = String(text);
var PATCH_KEYS = [
  'creation_id', 'video_prompt', 'video_motion_prompt', 'still_edit_prompt',
  'surface', 'lighting', 'camera_move', 'color_grade', 'hero_style', 'scene_brief',
  'category', 'lab_item', 'shot_family', 'camera_angle', 'camera_direction', 'framing'
];
var byId = {};
parseCsv(text).forEach(function (p) {
  var id = String(p.creation_id || '').trim();
  if (!id) return;
  var slim = {};
  PATCH_KEYS.forEach(function (k) { slim[k] = p[k] == null ? '' : p[k]; });
  byId[id] = slim;
});

var items = $input.all();
if (items.length < 2) throw new Error('rebuild_chem_looks: need all Sheet 13 rows');
return items.map(function (item) {
  var row = item.json || {};
  var id = String(row.creation_id || '').trim();
  var p = byId[id];
  if (!p) throw new Error('rebuild_chem_looks: no patch for ' + id);
  if (!String(p.video_prompt || '').startsWith('HERO SUBJECT:')) {
    throw new Error('rebuild_chem_looks: ' + id + ' video_prompt must start with HERO SUBJECT:');
  }
  var out = {};
  PATCH_KEYS.forEach(function (k) { out[k] = p[k]; });
  out.times_used = row.times_used;
  out.last_used_at = row.last_used_at;
  out.status = row.status || 'Active';
  out.compound_name = row.compound_name;
  return { json: out };
});
