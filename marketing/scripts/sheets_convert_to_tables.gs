/**
 * Convert marketing Google Sheets into Tables.
 * Gives each tab a table menu + header dropdowns.
 * Chip dropdowns on status / compound_name / caption tags / verify_status.
 *
 * Setup (once):
 * 1. Open any of your marketing sheets
 * 2. Extensions → Apps Script
 * 3. Paste this file
 * 4. Services (left sidebar +) → Google Sheets API → Add
 * 5. Run convertMarketingSheetsToTables → Allow
 *
 * Or: after reload, use menu PB Vitality → Convert this file to a Table
 */

var WORKBOOK_TITLES = [
  '15-caption-science-27',
  '13-chem-breakdown-54',
  '14-pen-creations-150',
  '3-image-scenes-150',
  '9-lab-item-creations-500',
  '4-reel-queue',
  '12-import-still-queue',
  '10-creatomate-text-1000',
];

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

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('PB Vitality')
    .addItem('Convert this file to a Table', 'convertActiveSpreadsheetToTable')
    .addItem('Convert all marketing files', 'convertMarketingSheetsToTables')
    .addToUi();
}

function convertActiveSpreadsheetToTable() {
  convertSpreadsheet_(SpreadsheetApp.getActiveSpreadsheet().getId());
}

function convertMarketingSheetsToTables() {
  var notes = [];
  WORKBOOK_TITLES.forEach(function (title) {
    var files = DriveApp.getFilesByName(title);
    if (!files.hasNext()) {
      notes.push(title + ': not found in Drive');
      return;
    }
    while (files.hasNext()) {
      var file = files.next();
      if (file.getMimeType() !== MimeType.GOOGLE_SHEETS) continue;
      notes.push(convertSpreadsheet_(file.getId()));
    }
  });
  SpreadsheetApp.getUi().alert(notes.join('\n'));
}

function convertSpreadsheet_(id) {
  var meta = Sheets.Spreadsheets.get(id, {
    fields: 'spreadsheetId,properties.title,sheets.properties,sheets.tables',
  });
  var requests = [];
  var summary = [];
  var usedNames = {};

  var ss = SpreadsheetApp.openById(id);
  (meta.sheets || []).forEach(function (s) {
    var p = s.properties || {};
    if (p.hidden || p.sheetId === undefined) return;
    var sheet = null;
    ss.getSheets().forEach(function (sh) {
      if (sh.getSheetId() === p.sheetId) sheet = sh;
    });
    if (!sheet) return;
    var lastRow = Math.max(sheet.getLastRow(), 1);
    var lastCol = Math.max(sheet.getLastColumn(), 1);
    if (lastCol < 1) {
      summary.push(p.title + ': skip');
      return;
    }
    var headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(function (h) {
      return String(h || '').trim();
    });
    var endRow = Math.max(lastRow, 2);

    requests.push({
      updateSheetProperties: {
        properties: {
          sheetId: p.sheetId,
          gridProperties: { frozenRowCount: 1 },
        },
        fields: 'gridProperties.frozenRowCount',
      },
    });

    var cols = columnProperties_(headers);
    var existing = s.tables || [];
    if (existing.length) {
      if (existing[0].tableId && cols.length) {
        requests.push({
          updateTable: {
            table: { tableId: existing[0].tableId, columnProperties: cols },
            fields: 'columnProperties',
          },
        });
        summary.push(p.title + ': dropdowns on existing table');
      } else {
        summary.push(p.title + ': already a table');
      }
      return;
    }

    var name = tableName_(p.title, p.sheetId);
    if (usedNames[name]) name = (name + ' ' + p.sheetId).slice(0, 40);
    usedNames[name] = true;

    var table = {
      name: name,
      range: {
        sheetId: p.sheetId,
        startRowIndex: 0,
        endRowIndex: endRow,
        startColumnIndex: 0,
        endColumnIndex: lastCol,
      },
    };
    if (cols.length) table.columnProperties = cols;
    requests.push({ addTable: { table: table } });
    summary.push(p.title + ': table ' + name);
  });

  if (requests.length) {
    Sheets.Spreadsheets.batchUpdate({ requests: requests }, id);
  }
  return (meta.properties && meta.properties.title) + ' → ' + summary.join('; ');
}

function tableName_(title, sheetId) {
  var raw = String(title || 'Table').replace(/[^A-Za-z0-9]+/g, ' ').replace(/^\s+|\s+$/g, '');
  if (!raw) raw = 'Table ' + sheetId;
  if (!/^[A-Za-z]/.test(raw)) raw = 'T ' + raw;
  return raw.slice(0, 40);
}

function dropdown_(index, name, options) {
  return {
    columnIndex: index,
    columnName: name,
    columnType: 'DROPDOWN',
    dataValidationRule: {
      condition: {
        type: 'ONE_OF_LIST',
        values: options.map(function (v) {
          return { userEnteredValue: v };
        }),
      },
    },
  };
}

function columnProperties_(headers) {
  var props = [];
  var isCaptionScience = headers.indexOf('science_what') !== -1;
  headers.forEach(function (h, i) {
    var key = String(h || '').toLowerCase();
    if (key === 'status') props.push(dropdown_(i, h, ['Active', 'Inactive']));
    else if (key === 'verify_status') props.push(dropdown_(i, h, ['accepted', 'failed']));
    else if (key === 'compound_name') props.push(dropdown_(i, h, COMPOUNDS));
    else if (isCaptionScience && /^tag[2-5]$/i.test(h)) props.push(dropdown_(i, h, TAGS));
  });
  return props;
}
