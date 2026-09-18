import { workflow, node, trigger, sticky, newCredential, expr } from '@n8n/workflow-sdk';

const howto = sticky({
  config: {
    name: 'overlay_howto',
    parameters: {
      color: 4,
      width: 860,
      height: 280,
      content: '# overlay_sonilo_custom_prompts (unpublished one-shot)\n# Writes music_prompt, sfx_prompt, status=Active onto SONILO-001.\n# Does not call Sonilo. Archive after one successful Execute.',
    },
  },
});

const startTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'manual_trigger', position: [0, 304] },
});

const setPrompts = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'set_sonilo_prompts',
    position: [240, 304],
    executeOnce: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "return [{ json: { job_id: 'SONILO-001', music_prompt: 'Airy cinematic wellness bed, slow piano and warm pads, open high-mountain sky, premium brand film energy, gentle rising pulse, hopeful and clean, no vocals.', sfx_prompt: 'Match the on-screen action: high-altitude wind over stone, distant cloud mist below the cliff, glass vial resting on rock, soft whoosh as titles appear, quiet mountain air.', status: 'Active' } }];",
    },
    output: [{ job_id: 'SONILO-001', status: 'Active' }],
  },
});

const sheetsUpdate = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'sheets_update_prompts',
    position: [500, 304],
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'update',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '10J0KA0P7nitt5NLanXEXoPZQ7iRyxVZPoNZXCFD5Hb0',
        cachedResultName: '22-sonilo-custom',
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '1698858753',
        cachedResultName: '22-sonilo-custom',
      },
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['job_id'],
        value: {
          job_id: expr('{{ $json.job_id }}'),
          music_prompt: expr('{{ $json.music_prompt }}'),
          sfx_prompt: expr('{{ $json.sfx_prompt }}'),
          status: expr('{{ $json.status }}'),
        },
        schema: [
          { id: 'job_id', displayName: 'job_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'music_prompt', displayName: 'music_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'sfx_prompt', displayName: 'sfx_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
        ],
      },
      options: { cellFormat: 'RAW', handlingExtraData: 'insertInNewColumn' },
    },
    output: [{ job_id: 'SONILO-001', status: 'Active' }],
  },
});

export default workflow('overlay_sonilo_custom_prompts', 'overlay_sonilo_custom_prompts')
  .add(howto)
  .add(startTrigger)
  .to(setPrompts)
  .to(sheetsUpdate);
