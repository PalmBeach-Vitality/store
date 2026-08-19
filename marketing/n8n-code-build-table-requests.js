// n8n Code node: build_table_requests
// Workflow: sheet_format_as_tables
// Mode: Run Once for All Items
// After: http_batchget_dims
// Before: http_apply_tables
//
// Convert each tab into a Google Table (table menu + filter dropdowns).
// Chip dropdowns on status / verify_status / compound_name / caption tags.

var COMPOUNDS = [
  '5-Amino-1MQ',
  'AOD-9604',
  'BPC-157',
  'BPC-157/TB-500',
  'Cagrilinitide',
  'CJC',
  'CJC (no DAC)/Ipamorelin',
  'DSIP',
  'GHK-Cu',
  'GLOW',
  'KLOW',
  'KPV',
  'Melanotan 2',
  'MOTS-C',
  'NAD+',
  'PT-141',
  'Retatrutide',
  'Selank',
  'Semaglutide',
  'SEMAX',
  'Sermorelin',
  'SS-31',
  'TA-1',
  'TB-500',
  'Tesamorelin',
  'Tesamorelin/Ipamorelin',
  'Tirzepatide',
];

var TAGS = [
  'MetabolicResearch',
  'CellularEnergy',
  'PeptideResearch',
  'ResearchPeptides',
  'MetabolicScience',
  'CellularScience',
  'TissueRepair',
  'EndocrineLab',
  'PeptideScience',
  'NeuropeptideScience',
  'CopperPeptide',
  'ReceptorScience',
  'MitochondrialScience',
  'ImmuneResearch',
];

function listValues(opts) {
  return opts.map(function (v) {
    return { userEnteredValue: v };
  });
}

function dropdown(index, name, options) {
  return {
    columnIndex: index,
    columnName: name,
    columnType: 'DROPDOWN',
    dataValidationRule: {
      condition: { type: 'ONE_OF_LIST', values: listValues(options) },
    },
  };
}

function tableName(title, sheetId) {
  var raw = String(title || 'Table')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .replace(/^\s+|\s+$/g, '');
  if (!raw) raw = 'Table ' + sheetId;
  if (!/^[A-Za-z]/.test(raw)) raw = 'T ' + raw;
  return raw.slice(0, 40);
}

function a1Part(range) {
  var parts = String(range || '').split('!');
  return parts[parts.length - 1] || '';
}

function rangesForTitle(valueRanges, title) {
  return (valueRanges || []).filter(function (vr) {
    return String(vr.range || '').indexOf(title) !== -1;
  });
}

function headerOf(valueRanges, title) {
  var hits = rangesForTitle(valueRanges, title);
  var hit = hits.find(function (vr) {
    var a1 = a1Part(vr.range);
    return /^[A-Z]+1:[A-Z]+1$/.test(a1) || a1 === '1:1';
  });
  return ((hit && hit.values && hit.values[0]) || []).map(function (h) {
    return String(h || '').trim();
  });
}

function colACount(valueRanges, title) {
  var hits = rangesForTitle(valueRanges, title);
  var hit = hits.find(function (vr) {
    var a1 = a1Part(vr.range);
    return /^A\d*:A\d*$/.test(a1) || a1 === 'A:A';
  });
  var rows = (hit && hit.values) || [];
  var n = 0;
  rows.forEach(function (r) {
    if (r && String(r[0] || '').trim() !== '') n += 1;
  });
  return n;
}

function columnProperties(headers) {
  var props = [];
  var isCaptionScience = headers.indexOf('science_what') !== -1;
  headers.forEach(function (h, i) {
    var key = h.toLowerCase();
    if (key === 'status') props.push(dropdown(i, h, ['Active', 'Inactive']));
    else if (key === 'verify_status') props.push(dropdown(i, h, ['accepted', 'failed']));
    else if (key === 'compound_name') props.push(dropdown(i, h, COMPOUNDS));
    else if (isCaptionScience && /^tag[2-5]$/i.test(h)) props.push(dropdown(i, h, TAGS));
  });
  return props;
}

var metas = {};
try {
  $('http_get_meta')
    .all()
    .forEach(function (it) {
      var j = it.json || {};
      if (j.spreadsheetId) metas[j.spreadsheetId] = j;
    });
} catch (e) {}

var items = $input.all();
if (!items.length) throw new Error('build_table_requests: no batchGet results.');

return items.map(function (item) {
  var bg = item.json || {};
  var id = String(bg.spreadsheetId || (metas && Object.keys(metas)[0]) || '').trim();
  var meta = metas[id] || {};
  if (!id) id = String((meta && meta.spreadsheetId) || '').trim();
  if (!id) throw new Error('build_table_requests: spreadsheetId missing.');

  var sheets = (meta.sheets || bg.sheets || []).filter(function (s) {
    var p = s.properties || {};
    return p.sheetId !== undefined && p.title && !p.hidden;
  });
  var valueRanges = bg.valueRanges || [];
  var usedNames = {};
  var requests = [];
  var summary = [];

  sheets.forEach(function (s) {
    var p = s.properties || {};
    var sheetId = p.sheetId;
    var title = p.title;
    var headers = headerOf(valueRanges, title);
    var nRows = colACount(valueRanges, title);
    var nCols = headers.length;
    if (!nCols) {
      summary.push(title + ': skip (no header)');
      return;
    }
    if (nRows < 1) nRows = 1;
    var endRow = Math.max(nRows, 2);
    var existing = (s.tables || meta.sheets && (s.tables || [])) || s.tables || [];
    if (!existing.length && Array.isArray(s.tables)) existing = s.tables;

    requests.push({
      updateSheetProperties: {
        properties: {
          sheetId: sheetId,
          gridProperties: { frozenRowCount: 1 },
        },
        fields: 'gridProperties.frozenRowCount',
      },
    });

    var cols = columnProperties(headers);
    var name = tableName(title, sheetId);
    if (usedNames[name]) name = (name + ' ' + sheetId).slice(0, 40);
    usedNames[name] = true;

    if (existing.length) {
      var tableId = existing[0].tableId;
      if (tableId && cols.length) {
        requests.push({
          updateTable: {
            table: { tableId: tableId, columnProperties: cols },
            fields: 'columnProperties',
          },
        });
        summary.push(title + ': update dropdowns on existing table');
      } else {
        summary.push(title + ': table exists, freeze only');
      }
      return;
    }

    var table = {
      name: name,
      range: {
        sheetId: sheetId,
        startRowIndex: 0,
        endRowIndex: endRow,
        startColumnIndex: 0,
        endColumnIndex: nCols,
      },
    };
    if (cols.length) table.columnProperties = cols;
    requests.push({ addTable: { table: table } });
    summary.push(title + ': add table ' + name + ' (' + nRows + ' rows x ' + nCols + ' cols)');
  });

  if (!requests.length) {
    throw new Error('build_table_requests: nothing to apply on ' + id);
  }

  return {
    json: {
      spreadsheetId: id,
      title: (meta.properties && meta.properties.title) || bg.title || id,
      applyUrl: 'https://sheets.googleapis.com/v4/spreadsheets/' + id + ':batchUpdate',
      requests: requests,
      summary: summary,
    },
  };
});
