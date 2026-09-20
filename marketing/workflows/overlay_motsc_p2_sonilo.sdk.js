import { workflow, node, trigger, newCredential } from '@n8n/workflow-sdk';

const startTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'manual_trigger', position: [0, 304] },
});

const seedRows = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'seed_motsc_p2_rows',
    position: [220, 304],
    executeOnce: true,
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "return [{\"json\": {\"job_id\": \"SONILO-002\", \"title\": \"MOTS-C part 2 take 1 descent velocity\", \"video_url\": \"https://drive.usercontent.google.com/download?id=1EY9din38fsGSXpmSjm0QvqswNh4kpI0x&export=download&confirm=t\", \"music_prompt\": \"High-velocity cinematic sci-fi action score, racing strings and airy choir pads, analog synth pulse, rising brass, tense then soaring, no vocals.\", \"sfx_prompt\": \"Match the on-screen action: arrowhead spacecraft cutting through upper atmosphere, rushing air over the hull, twin cyan engines humming, warm orange glow along the leading edges, quiet vacuum around the twin moons.\", \"status\": \"Active\", \"times_used\": \"0\", \"last_used_at\": \"\", \"audio_host\": \"sonilo\", \"sound_type\": \"music_and_sfx\", \"output_mode\": \"muxed_video\", \"audio_endpoint\": \"https://api.sonilo.com/v1/video-to-video-sound\", \"audio_poll_base\": \"https://api.sonilo.com/v1/tasks\", \"sonilo_wait_seconds\": \"90\", \"sonilo_max_polls\": \"20\", \"ducking\": \"false\", \"preserve_speech\": \"false\", \"keep_original_sound\": \"false\", \"audio_video_url\": \"\", \"audio_url\": \"\", \"music_stem_url\": \"\", \"sfx_stem_url\": \"\", \"audio_status\": \"\", \"sonilo_task_id\": \"\", \"notes\": \"Drive 1EY9din38fsGSXpmSjm0QvqswNh4kpI0x MOTS-C_timeline_02_no_sound.mp4; prompt V1 descent velocity\"}}, {\"json\": {\"job_id\": \"SONILO-003\", \"title\": \"MOTS-C part 2 take 2 descent landing first contact\", \"video_url\": \"https://drive.usercontent.google.com/download?id=1EY9din38fsGSXpmSjm0QvqswNh4kpI0x&export=download&confirm=t\", \"music_prompt\": \"Sci-fi action score for a high-speed planetary descent, racing strings and analog synth pulse while the spacecraft flies in, then a wondrous lift as the pilot meets the alien, warm swell on the vial handoff, fading to a calm beach close, no vocals.\", \"sfx_prompt\": \"Match the on-screen action in order: high-speed atmospheric descent into the planet, rushing air as the spacecraft flies through the sky, sand and surf as it lands on the beach, hatch and footsteps as the pilot steps out, quiet coastal wind while she and the alien look at each other, footsteps as the alien walks over carrying the glass vial, close handoff from alien hand to human hand, last beat is the empty beach.\", \"status\": \"Hold\", \"times_used\": \"0\", \"last_used_at\": \"\", \"audio_host\": \"sonilo\", \"sound_type\": \"music_and_sfx\", \"output_mode\": \"muxed_video\", \"audio_endpoint\": \"https://api.sonilo.com/v1/video-to-video-sound\", \"audio_poll_base\": \"https://api.sonilo.com/v1/tasks\", \"sonilo_wait_seconds\": \"90\", \"sonilo_max_polls\": \"20\", \"ducking\": \"false\", \"preserve_speech\": \"false\", \"keep_original_sound\": \"false\", \"audio_video_url\": \"\", \"audio_url\": \"\", \"music_stem_url\": \"\", \"sfx_stem_url\": \"\", \"audio_status\": \"\", \"sonilo_task_id\": \"\", \"notes\": \"Drive 1EY9din38fsGSXpmSjm0QvqswNh4kpI0x MOTS-C_timeline_02_no_sound.mp4; prompt V2 beach landing first contact handoff\"}}];",
    },
    output: [
      { job_id: 'SONILO-002', status: 'Active' },
      { job_id: 'SONILO-003', status: 'Hold' },
    ],
  },
});

const appendRows = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'append_sonilo_rows',
    position: [460, 304],
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
        mode: 'list',
        value: '1698858753',
        cachedResultName: '22-sonilo-custom',
      },
      columns: {
        mappingMode: 'autoMapInputData',
        value: {},
        schema: [{"id": "job_id", "displayName": "job_id", "required": true, "defaultMatch": true, "display": true, "type": "string", "canBeUsedToMatch": true}, {"id": "title", "displayName": "title", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "video_url", "displayName": "video_url", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "music_prompt", "displayName": "music_prompt", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "sfx_prompt", "displayName": "sfx_prompt", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "status", "displayName": "status", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "times_used", "displayName": "times_used", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "last_used_at", "displayName": "last_used_at", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "audio_host", "displayName": "audio_host", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "sound_type", "displayName": "sound_type", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "output_mode", "displayName": "output_mode", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "audio_endpoint", "displayName": "audio_endpoint", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "audio_poll_base", "displayName": "audio_poll_base", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "sonilo_wait_seconds", "displayName": "sonilo_wait_seconds", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "sonilo_max_polls", "displayName": "sonilo_max_polls", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "ducking", "displayName": "ducking", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "preserve_speech", "displayName": "preserve_speech", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "keep_original_sound", "displayName": "keep_original_sound", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "audio_video_url", "displayName": "audio_video_url", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "audio_url", "displayName": "audio_url", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "music_stem_url", "displayName": "music_stem_url", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "sfx_stem_url", "displayName": "sfx_stem_url", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "audio_status", "displayName": "audio_status", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "sonilo_task_id", "displayName": "sonilo_task_id", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}, {"id": "notes", "displayName": "notes", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": false}],
      },
      options: {
        cellFormat: 'RAW',
        handlingExtraData: 'insertInNewColumn',
        useAppend: true,
      },
    },
    output: [
      { job_id: 'SONILO-002' },
      { job_id: 'SONILO-003' },
    ],
  },
});

export default workflow('overlay_motsc_p2', 'overlay_motsc_p2_sonilo')
  .add(startTrigger)
  .to(seedRows)
  .to(appendRows);
