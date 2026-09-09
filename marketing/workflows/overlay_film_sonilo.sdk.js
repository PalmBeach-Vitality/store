import { workflow, node, trigger, sticky, newCredential } from '@n8n/workflow-sdk';

const howto = sticky({
  config: {
    name: 'overlay_howto',
    parameters: {
      color: 4,
      width: 860,
      height: 420,
      content: '# overlay_film_sonilo (unpublished)\n# Writes Sonilo music+sfx columns onto Sheet 18.\n# Does not touch picked_url, video_url, or join_url. Do not Publish.',
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
    output: [{ still_id: 'FILM-001' }],
  },
});

const overlaySonilo = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'overlay_film_sonilo',
    position: [496, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "// n8n Code node: overlay_film_sonilo\n// Workflow: overlay_film_sonilo (one-shot, unpublished)\n// Mode: Run Once for All Items\n// After: get_film_stills\n// Before: sheets_update_sonilo\n//\n// Writes Sonilo video-to-sound columns onto every 18-motsc-film-stills row.\n// Does not touch picked_url, video_url, still_prompt, join_url, or seam_mode.\n\nvar REEL_ID = 'MOTSC-FILM-01';\nvar AUDIO_HOST = 'sonilo';\nvar SOUND_TYPE = 'music_and_sfx';\nvar OUTPUT_MODE = 'muxed_video';\nvar AUDIO_ENDPOINT = 'https://api.sonilo.com/v1/video-to-video-sound';\nvar AUDIO_POLL_BASE = 'https://api.sonilo.com/v1/tasks';\nvar MUSIC_PROMPT = 'cinematic sci-fi, tense then triumphant';\nvar SFX_PROMPT = 'match the on-screen action.';\nvar WAIT_SECONDS = '90';\nvar MAX_POLLS = '20';\nvar OUTPUT_FORMAT = 'wav';\n\nvar rows = $input.all().map(function (i) {\n  return i.json;\n});\nif (!rows.length) {\n  throw new Error('overlay_film_sonilo: no rows from get_film_stills.');\n}\n\nvar out = [];\nfor (var i = 0; i < rows.length; i++) {\n  var stillId = String((rows[i] || {}).still_id || '').trim();\n  if (!stillId) continue;\n  if (!/^FILM-\\d+$/i.test(stillId)) {\n    throw new Error('overlay_film_sonilo: unexpected still_id ' + stillId);\n  }\n  out.push({\n    json: {\n      still_id: stillId,\n      reel_id: REEL_ID,\n      audio_host: AUDIO_HOST,\n      sound_type: SOUND_TYPE,\n      output_mode: OUTPUT_MODE,\n      audio_endpoint: AUDIO_ENDPOINT,\n      audio_poll_base: AUDIO_POLL_BASE,\n      music_prompt: MUSIC_PROMPT,\n      sfx_prompt: SFX_PROMPT,\n      sonilo_wait_seconds: WAIT_SECONDS,\n      sonilo_max_polls: MAX_POLLS,\n      output_format: OUTPUT_FORMAT,\n      ducking: 'false',\n      preserve_speech: 'false',\n      keep_original_sound: 'false',\n      audio_source_url: '',\n      audio_url: '',\n      audio_video_url: '',\n      music_stem_url: '',\n      sfx_stem_url: '',\n      audio_status: '',\n      sonilo_task_id: '',\n    },\n  });\n}\n\nif (out.length !== 25) {\n  throw new Error('overlay_film_sonilo: expected 25 rows, got ' + out.length);\n}\n\nreturn out;\n",
    },
    output: [{ still_id: 'FILM-001', reel_id: 'MOTSC-FILM-01', sound_type: 'music_and_sfx', audio_host: 'sonilo' }],
  },
});

const sheetsUpdate = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'sheets_update_sonilo',
    position: [752, 304],
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
        mappingMode: 'autoMapInputData',
        matchingColumns: ['still_id'],
        value: {},
        schema: [
          { id: 'still_id', displayName: 'still_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'reel_id', displayName: 'reel_id', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'audio_host', displayName: 'audio_host', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'sound_type', displayName: 'sound_type', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'output_mode', displayName: 'output_mode', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'audio_endpoint', displayName: 'audio_endpoint', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'audio_poll_base', displayName: 'audio_poll_base', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'music_prompt', displayName: 'music_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'sfx_prompt', displayName: 'sfx_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'sonilo_wait_seconds', displayName: 'sonilo_wait_seconds', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'sonilo_max_polls', displayName: 'sonilo_max_polls', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'output_format', displayName: 'output_format', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'ducking', displayName: 'ducking', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'preserve_speech', displayName: 'preserve_speech', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'keep_original_sound', displayName: 'keep_original_sound', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'audio_source_url', displayName: 'audio_source_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'audio_url', displayName: 'audio_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'audio_video_url', displayName: 'audio_video_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'music_stem_url', displayName: 'music_stem_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'sfx_stem_url', displayName: 'sfx_stem_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'audio_status', displayName: 'audio_status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'sonilo_task_id', displayName: 'sonilo_task_id', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
        ],
      },
      options: { cellFormat: 'USER_ENTERED', handlingExtraData: 'insertInNewColumn' },
    },
    output: [{ still_id: 'FILM-001' }],
  },
});

export default workflow('overlay_film_sonilo', 'overlay_film_sonilo')
  .add(howto)
  .add(startTrigger)
  .to(getFilm)
  .to(overlaySonilo)
  .to(sheetsUpdate);
