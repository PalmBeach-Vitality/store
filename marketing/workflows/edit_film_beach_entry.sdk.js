import { workflow, node, trigger, sticky, newCredential, expr } from '@n8n/workflow-sdk';

const howto = sticky({
  config: {
    name: 'edit_howto',
    parameters: {
      color: 4,
      width: 860,
      height: 420,
      content:
        '# edit_film_beach_entry (unpublished)\n' +
        '# Grok still-edits FILM-001 / 004 / 020 from Sheet 18 still_edit_prompt.\n' +
        '# Run after overlay_film_beach_entry. Do not Publish.',
    },
  },
});

const startTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'manual_trigger', position: [0, 304] },
});

const getFilm = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'get_film_stills',
    position: [240, 304],
    executeOnce: true,
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1ChDI33MVdCwGXcPDBvETRoc5xY8DEgZS3KU5VC09dnU',
        cachedResultName: '18-motsc-film-stills',
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '1628285227',
        cachedResultName: '18-motsc-film-stills',
      },
      options: {},
    },
    output: [{ still_id: 'FILM-001', still_edit_prompt: 'edit', picked_url: 'https://example.com/a.png', model_still: 'grok-imagine-image-2.0', aspect_ratio: '9:16', n: '3', take_urls: '' }],
  },
});

const prepEdits = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'prep_beach_edits',
    position: [496, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "// n8n Code node: prep_beach_edits\n// Workflow: edit_film_beach_entry\n// Mode: Run Once for All Items\n// After: get_film_stills\n// Before: grok_imagine_edit_still\n//\n// SHEETS-ONLY: still_edit_prompt, model_still, aspect_ratio, n, picked_url\n// from Sheet 18 for FILM-001 / FILM-004 / FILM-020.\n// Empty still_edit_prompt throws \u2014 do not invent a fallback.\n\nfunction val(obj, names) {\n  obj = obj || {};\n  for (var i = 0; i < names.length; i++) {\n    var n = names[i];\n    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') {\n      return obj[n];\n    }\n  }\n  return '';\n}\n\nfunction httpsUrl(s) {\n  s = String(s || '').trim();\n  if (s.indexOf('https://') === 0 || s.indexOf('HTTPS://') === 0) return s;\n  return '';\n}\n\nvar TARGETS = ['FILM-001', 'FILM-004', 'FILM-020'];\n\nvar rows = $input.all().map(function (i) {\n  return i.json;\n});\nif (!rows.length) {\n  throw new Error('prep_beach_edits: no rows from get_film_stills.');\n}\n\nvar byId = {};\nfor (var r = 0; r < rows.length; r++) {\n  var sid = String(val(rows[r], ['still_id'])).trim();\n  if (sid) byId[sid] = rows[r];\n}\n\nvar out = [];\nfor (var t = 0; t < TARGETS.length; t++) {\n  var stillId = TARGETS[t];\n  var pick = byId[stillId];\n  if (!pick) {\n    throw new Error('prep_beach_edits: ' + stillId + ' missing on 18-motsc-film-stills.');\n  }\n\n  var editPrompt = String(val(pick, ['still_edit_prompt'])).trim();\n  if (!editPrompt) {\n    throw new Error(\n      'SHEETS-ONLY: still_edit_prompt missing on ' +\n        stillId +\n        '. Run overlay_film_beach_entry first.'\n    );\n  }\n  if (editPrompt.length > 7900) editPrompt = editPrompt.slice(0, 7900);\n\n  var modelStill = String(val(pick, ['model_still'])).trim();\n  if (!modelStill) {\n    throw new Error('SHEETS-ONLY: model_still missing on ' + stillId + '.');\n  }\n\n  var aspectRatio = String(val(pick, ['aspect_ratio'])).trim().replace(/\\u2236/g, ':');\n  if (!/^\\d+:\\d+$/.test(aspectRatio)) {\n    throw new Error(\n      'SHEETS-ONLY: aspect_ratio must be like 9:16 on ' + stillId + ', got ' + aspectRatio\n    );\n  }\n\n  var sourceUrl = httpsUrl(val(pick, ['picked_url']));\n  if (!sourceUrl) {\n    throw new Error(\n      'prep_beach_edits: picked_url must be https on ' + stillId + '.'\n    );\n  }\n\n  var nRaw = String(val(pick, ['n'])).trim();\n  var n = Number(nRaw);\n  if (!isFinite(n) || n < 1 || n > 10 || n !== Math.floor(n)) {\n    throw new Error(\n      'SHEETS-ONLY: n must be an integer 1-10 on ' + stillId + ', got ' + nRaw\n    );\n  }\n\n  var priorTakes = String(val(pick, ['take_urls'])).trim();\n\n  for (var k = 0; k < n; k++) {\n    var body = {\n      model: modelStill,\n      prompt: editPrompt,\n      image: { url: sourceUrl },\n      aspect_ratio: aspectRatio,\n    };\n    out.push({\n      json: {\n        still_id: stillId,\n        take_index: k + 1,\n        take_count: n,\n        source_still_url: sourceUrl,\n        still_edit_prompt: editPrompt,\n        model_still: modelStill,\n        aspect_ratio: aspectRatio,\n        prior_take_urls: priorTakes,\n        still_edit_body_json: JSON.stringify(body),\n      },\n    });\n  }\n}\n\nreturn out;\n",
    },
    output: [{ still_id: 'FILM-001', still_edit_body_json: '{}' }],
  },
});

const grokEdit = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'grok_imagine_edit_still',
    position: [752, 304],
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 2000,
    credentials: { httpHeaderAuth: newCredential('XAI Grok') },
    parameters: {
      method: 'POST',
      url: 'https://api.x.ai/v1/images/edits',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'Content-Type', value: 'application/json' }] },
      sendBody: true,
      contentType: 'raw',
      rawContentType: 'application/json',
      body: expr('{{ $json.still_edit_body_json }}'),
      options: { timeout: 180000 },
    },
    output: [{ data: [{ url: 'https://example.com/edited.png' }] }],
  },
});

const collectEdits = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'collect_beach_edits',
    position: [1008, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "// n8n Code node: collect_beach_edits\n// Workflow: edit_film_beach_entry\n// Mode: Run Once for All Items\n// After: grok_imagine_edit_still\n// Before: sheets_update_still\n//\n// Appends edited https URLs onto each still_id take_urls.\n// Does not emit picked_url or times_used.\n\nfunction httpsUrl(s) {\n  s = String(s || '').trim();\n  if (s.indexOf('https://') === 0 || s.indexOf('HTTPS://') === 0) return s;\n  return '';\n}\n\nvar grokItems = $input.all();\nvar preps = [];\ntry {\n  preps = $('prep_beach_edits').all();\n} catch (e) {\n  preps = [];\n}\n\nif (!grokItems.length) {\n  throw new Error('collect_beach_edits: no items from grok_imagine_edit_still.');\n}\nif (preps.length !== grokItems.length) {\n  throw new Error(\n    'collect_beach_edits: prep/grok count mismatch (' +\n      preps.length +\n      '/' +\n      grokItems.length +\n      ').'\n  );\n}\n\nvar groups = {};\nfor (var i = 0; i < grokItems.length; i++) {\n  var prep = (preps[i] && preps[i].json) || {};\n  var stillId = String(prep.still_id || '').trim();\n  if (!stillId) {\n    throw new Error('collect_beach_edits: still_id missing on prep item ' + i);\n  }\n  if (!groups[stillId]) {\n    groups[stillId] = {\n      prior: String(prep.prior_take_urls || '').trim(),\n      edited: [],\n    };\n  }\n  var j = (grokItems[i] && grokItems[i].json) || {};\n  var data = Array.isArray(j.data) ? j.data : [];\n  var u = '';\n  if (data.length) u = httpsUrl(data[0].url || data[0].image_url);\n  if (!u) u = httpsUrl(j.url || j.still_url);\n  if (u) groups[stillId].edited.push(u);\n}\n\nvar out = [];\nvar ids = Object.keys(groups);\nfor (var g = 0; g < ids.length; g++) {\n  var id = ids[g];\n  var edited = groups[id].edited;\n  if (!edited.length) {\n    throw new Error(\n      'collect_beach_edits: no https URLs from grok_imagine_edit_still for ' + id\n    );\n  }\n  var joined = edited.join(' | ');\n  var prior = groups[id].prior;\n  out.push({\n    json: {\n      still_id: id,\n      edited_take_urls: joined,\n      take_urls: prior ? prior + ' | ' + joined : joined,\n      edit_count_this_run: edited.length,\n    },\n  });\n}\n\nreturn out;\n",
    },
    output: [{ still_id: 'FILM-001', take_urls: 'https://example.com/edited.png' }],
  },
});

const sheetsUpdate = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'sheets_update_still',
    position: [1264, 304],
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'update',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1ChDI33MVdCwGXcPDBvETRoc5xY8DEgZS3KU5VC09dnU',
        cachedResultName: '18-motsc-film-stills',
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '1628285227',
        cachedResultName: '18-motsc-film-stills',
      },
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['still_id'],
        value: {
          still_id: expr('{{ $json.still_id }}'),
          take_urls: expr('{{ $json.take_urls }}'),
        },
        schema: [
          { id: 'still_id', displayName: 'still_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'take_urls', displayName: 'take_urls', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
        ],
      },
      options: {},
    },
    output: [{ still_id: 'FILM-001' }],
  },
});

export default workflow('edit_film_beach_entry', 'edit_film_beach_entry')
  .add(howto)
  .add(startTrigger)
  .to(getFilm)
  .to(prepEdits)
  .to(grokEdit)
  .to(collectEdits)
  .to(sheetsUpdate);
