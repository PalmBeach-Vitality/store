import { workflow, node, trigger, sticky, newCredential, expr } from '@n8n/workflow-sdk';

const mapperJs =
"// overlay_caption_science_new_products \u2014 append missing Sheet 15 rows only.\nvar NEW_ROWS = JSON.parse(\"[{\\\"compound_id\\\": \\\"P-DIHEXA-001\\\", \\\"compound_name\\\": \\\"Dihexa\\\", \\\"aliases\\\": \\\"dihexa,dihexia,dihexa pen\\\", \\\"science_what\\\": \\\"a synthetic angiotensin-IV analogue used in synaptic-pathway laboratory research\\\", \\\"science_focus\\\": \\\"hippocampal-receptor signaling and cognitive-circuit mapping in controlled lab models\\\", \\\"science_pathways\\\": \\\"how a compact peptide analogue is cataloged for receptor-level study, not outcome claims\\\", \\\"tag2\\\": \\\"PeptideResearch\\\", \\\"tag3\\\": \\\"ReceptorScience\\\", \\\"tag4\\\": \\\"CellularScience\\\", \\\"tag5\\\": \\\"ResearchPeptides\\\", \\\"store_url\\\": \\\"www.palmbeach-vitality.store\\\", \\\"status\\\": \\\"Active\\\"}, {\\\"compound_id\\\": \\\"P-EPITH-001\\\", \\\"compound_name\\\": \\\"Epithalon\\\", \\\"aliases\\\": \\\"epithalon,epitalon,epithalamin\\\", \\\"science_what\\\": \\\"a synthetic pineal tetrapeptide used in telomere-pathway laboratory catalogs\\\", \\\"science_focus\\\": \\\"pineal-peptide signaling and cellular-aging models in controlled research systems\\\", \\\"science_pathways\\\": \\\"how a four-residue sequence is documented for longevity-pathway mapping without outcome claims\\\", \\\"tag2\\\": \\\"PeptideResearch\\\", \\\"tag3\\\": \\\"CellularScience\\\", \\\"tag4\\\": \\\"PeptideScience\\\", \\\"tag5\\\": \\\"ResearchPeptides\\\", \\\"store_url\\\": \\\"www.palmbeach-vitality.store\\\", \\\"status\\\": \\\"Active\\\"}, {\\\"compound_id\\\": \\\"P-GSH-001\\\", \\\"compound_name\\\": \\\"Glutathione\\\", \\\"aliases\\\": \\\"glutathione,gsh,glutathione pen\\\", \\\"science_what\\\": \\\"a tripeptide thiol used in redox-buffer and cellular-defense laboratory studies\\\", \\\"science_focus\\\": \\\"glutathione cycling and oxidative-stress pathway mapping in research models\\\", \\\"science_pathways\\\": \\\"how a gamma-glutamyl tripeptide is cataloged for molecular redox work, not results\\\", \\\"tag2\\\": \\\"CellularScience\\\", \\\"tag3\\\": \\\"MetabolicResearch\\\", \\\"tag4\\\": \\\"PeptideResearch\\\", \\\"tag5\\\": \\\"ResearchPeptides\\\", \\\"store_url\\\": \\\"www.palmbeach-vitality.store\\\", \\\"status\\\": \\\"Active\\\"}, {\\\"compound_id\\\": \\\"P-IGFLR3-001\\\", \\\"compound_name\\\": \\\"IGF-LR3\\\", \\\"aliases\\\": \\\"igf-lr3,igflr3,igf lr3,long r3 igf\\\", \\\"science_what\\\": \\\"a long-acting IGF-1 analogue used in growth-factor signaling laboratory work\\\", \\\"science_focus\\\": \\\"IGF-receptor engagement and mitogenic-pathway mapping in controlled models\\\", \\\"science_pathways\\\": \\\"how an extended analogue is cataloged for receptor-duration research\\\", \\\"tag2\\\": \\\"PeptideResearch\\\", \\\"tag3\\\": \\\"ReceptorScience\\\", \\\"tag4\\\": \\\"CellularScience\\\", \\\"tag5\\\": \\\"ResearchPeptides\\\", \\\"store_url\\\": \\\"www.palmbeach-vitality.store\\\", \\\"status\\\": \\\"Active\\\"}, {\\\"compound_id\\\": \\\"P-IPA-001\\\", \\\"compound_name\\\": \\\"Ipamorelin\\\", \\\"aliases\\\": \\\"ipamorelin-solo,ipa-solo,ipamorelin vial,ipamorelin pen\\\", \\\"science_what\\\": \\\"a selective ghrelin-mimetic pentapeptide used in growth-axis laboratory studies\\\", \\\"science_focus\\\": \\\"GHS-R1a signaling mapped as a solo secretagogue, apart from CJC blend catalogs\\\", \\\"science_pathways\\\": \\\"how a compact growth-axis peptide is documented at the receptor level without stack claims\\\", \\\"tag2\\\": \\\"EndocrineLab\\\", \\\"tag3\\\": \\\"PeptideResearch\\\", \\\"tag4\\\": \\\"CellularScience\\\", \\\"tag5\\\": \\\"ResearchPeptides\\\", \\\"store_url\\\": \\\"www.palmbeach-vitality.store\\\", \\\"status\\\": \\\"Active\\\"}, {\\\"compound_id\\\": \\\"P-KISS-001\\\", \\\"compound_name\\\": \\\"Kisspeptin\\\", \\\"aliases\\\": \\\"kisspeptin,kisspeptin-10,metastin\\\", \\\"science_what\\\": \\\"a KISS1-derived research peptide used in reproductive-axis laboratory models\\\", \\\"science_focus\\\": \\\"GPR54/KISS1R signaling and hypothalamic-pathway mapping in controlled systems\\\", \\\"science_pathways\\\": \\\"how a ligand peptide is cataloged for endocrine-axis research, not outcome claims\\\", \\\"tag2\\\": \\\"EndocrineLab\\\", \\\"tag3\\\": \\\"PeptideResearch\\\", \\\"tag4\\\": \\\"CellularScience\\\", \\\"tag5\\\": \\\"ResearchPeptides\\\", \\\"store_url\\\": \\\"www.palmbeach-vitality.store\\\", \\\"status\\\": \\\"Active\\\"}]\");\nvar seenId = {};\nvar seenName = {};\n$input.all().forEach(function (i) {\n  var r = i.json || {};\n  var id = String(r.compound_id || '').trim();\n  var name = String(r.compound_name || '').trim();\n  if (id) seenId[id] = true;\n  if (name) seenName[name] = true;\n});\nvar out = [];\nNEW_ROWS.forEach(function (r) {\n  if (seenId[r.compound_id] || seenName[r.compound_name]) return;\n  out.push({ json: r });\n});\nif (!out.length) {\n  throw new Error('Sheet 15 already has Dihexa, Epithalon, Glutathione, IGF-LR3, Ipamorelin, Kisspeptin');\n}\nreturn out;\n";

const howto = sticky({
  config: {
    name: 'overlay_howto',
    parameters: {
      color: 4,
      width: 860,
      height: 280,
      content:
        '# overlay_caption_science_new_products (unpublished) Appends 6 Sheet 15 science rows: Dihexa, Epithalon, Glutathione, IGF-LR3, Ipamorelin, Kisspeptin. Same chem workbook as peptide_caption_gen get_caption_science. Does not email. Do not Publish. Do not run peptide_caption_gen.',
    },
  },
});

const startTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'manual_trigger', position: [0, 336] },
});

const readSheet = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'read_caption_science',
    position: [224, 336],
    executeOnce: true,
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1yRVkX7fVzU5wopvHH9LVsenHTszHDDhVR_smOfgOrNk',
        cachedResultName: '15-caption-science-27',
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '0',
        cachedResultName: 'Sheet1',
      },
      options: {},
    },
    output: [{ compound_id: 'P-BPC-001', compound_name: 'BPC-157' }],
  },
});

const mapRows = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'map_new_caption_rows',
    position: [448, 336],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: mapperJs,
    },
    output: [
      {
        compound_id: 'P-DIHEXA-001',
        compound_name: 'Dihexa',
        aliases: 'dihexa,dihexia,dihexa pen',
        science_what: 'a synthetic angiotensin-IV analogue used in synaptic-pathway laboratory research',
        science_focus: 'hippocampal-receptor signaling and cognitive-circuit mapping in controlled lab models',
        science_pathways: 'how a compact peptide analogue is cataloged for receptor-level study, not outcome claims',
        tag2: 'PeptideResearch',
        tag3: 'ReceptorScience',
        tag4: 'CellularScience',
        tag5: 'ResearchPeptides',
        store_url: 'www.palmbeach-vitality.store',
        status: 'Active',
      },
    ],
  },
});

const writeSheet = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'append_caption_science',
    position: [672, 336],
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'append',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1yRVkX7fVzU5wopvHH9LVsenHTszHDDhVR_smOfgOrNk',
        cachedResultName: '15-caption-science-27',
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '0',
        cachedResultName: 'Sheet1',
      },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          compound_id: expr('{{ $json.compound_id }}'),
          compound_name: expr('{{ $json.compound_name }}'),
          aliases: expr('{{ $json.aliases }}'),
          science_what: expr('{{ $json.science_what }}'),
          science_focus: expr('{{ $json.science_focus }}'),
          science_pathways: expr('{{ $json.science_pathways }}'),
          tag2: expr('{{ $json.tag2 }}'),
          tag3: expr('{{ $json.tag3 }}'),
          tag4: expr('{{ $json.tag4 }}'),
          tag5: expr('{{ $json.tag5 }}'),
          store_url: expr('{{ $json.store_url }}'),
          status: expr('{{ $json.status }}'),
        },
        schema: [
          { id: 'compound_id', displayName: 'compound_id', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'compound_name', displayName: 'compound_name', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'aliases', displayName: 'aliases', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'science_what', displayName: 'science_what', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'science_focus', displayName: 'science_focus', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'science_pathways', displayName: 'science_pathways', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'tag2', displayName: 'tag2', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'tag3', displayName: 'tag3', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'tag4', displayName: 'tag4', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'tag5', displayName: 'tag5', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'store_url', displayName: 'store_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
        ],
      },
      options: { cellFormat: 'RAW' },
    },
    output: [{ compound_id: 'P-DIHEXA-001' }],
  },
});

export default workflow('overlay_caption_science_new_products', 'manual')
  .add(howto)
  .add(startTrigger)
  .to(readSheet)
  .to(mapRows)
  .to(writeSheet);
