import { workflow, node, trigger, sticky, newCredential } from '@n8n/workflow-sdk';

const howto = sticky({
  config: {
    name: 'seed_howto',
    parameters: {
      color: 4,
      width: 900,
      height: 360,
      content: '# seed_sonilo_custom_sheet (unpublished one-shot)\n# Creates tab 22-sonilo-custom, writes SONILO-001, deletes Untitled.\n# Does not call Sonilo. Archive after one successful Execute.',
    },
  },
});

const startTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'manual_trigger', position: [0, 304] },
});

const createTab = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'create_named_tab',
    position: [220, 304],
    executeOnce: true,
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'create',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '10J0KA0P7nitt5NLanXEXoPZQ7iRyxVZPoNZXCFD5Hb0',
        cachedResultName: '22-sonilo-custom',
      },
      title: '22-sonilo-custom',
      options: {},
    },
    output: [{ name: '22-sonilo-custom' }],
  },
});

const seedRow = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'seed_sonilo_row',
    position: [460, 304],
    executeOnce: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "return [{ json: { job_id: 'SONILO-001', title: 'CJC/Ipamorelin reel', video_url: 'https://litter.catbox.moe/ll3c9h.mp4', music_prompt: '', sfx_prompt: '', status: 'Hold', times_used: '0', last_used_at: '', audio_host: 'sonilo', sound_type: 'music_and_sfx', output_mode: 'muxed_video', audio_endpoint: 'https://api.sonilo.com/v1/video-to-video-sound', audio_poll_base: 'https://api.sonilo.com/v1/tasks', sonilo_wait_seconds: '90', sonilo_max_polls: '20', ducking: 'false', preserve_speech: 'false', keep_original_sound: 'false', audio_video_url: '', audio_url: '', music_stem_url: '', sfx_stem_url: '', audio_status: '', sonilo_task_id: '', notes: 'Drive 17_25O8O85EZPO0u0I9hBLNVguRd_Ao89; litterbox 72h' } }];",
    },
    output: [{ job_id: 'SONILO-001', status: 'Hold', video_url: 'https://litter.catbox.moe/ll3c9h.mp4' }],
  },
});

const appendRow = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'append_sonilo_row',
    position: [700, 304],
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'append',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '10J0KA0P7nitt5NLanXEXoPZQ7iRyxVZPoNZXCFD5Hb0',
        cachedResultName: '22-sonilo-custom',
      },
      sheetName: {
        __rl: true,
        mode: 'name',
        value: '22-sonilo-custom',
        cachedResultName: '22-sonilo-custom',
      },
      columns: {
        mappingMode: 'autoMapInputData',
      },
      options: { cellFormat: 'RAW', handlingExtraData: 'insertInNewColumn' },
    },
    output: [{ job_id: 'SONILO-001' }],
  },
});

const removeUntitled = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'remove_untitled_tab',
    position: [940, 304],
    executeOnce: true,
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'remove',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '10J0KA0P7nitt5NLanXEXoPZQ7iRyxVZPoNZXCFD5Hb0',
        cachedResultName: '22-sonilo-custom',
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '1661854092',
        cachedResultName: 'Untitled',
      },
    },
    output: [{ ok: true }],
  },
});

export default workflow('seed_sonilo_custom_sheet', 'seed_sonilo_custom_sheet')
  .add(howto)
  .add(startTrigger)
  .to(createTab)
  .to(seedRow)
  .to(appendRow)
  .to(removeUntitled);
