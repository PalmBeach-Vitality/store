import { workflow, node, trigger, sticky, newCredential, expr } from '@n8n/workflow-sdk';

const howto = sticky({
  config: {
    name: 'rehost_howto',
    parameters: {
      color: 4,
      width: 860,
      height: 280,
      content: '# rehost_sonilo_source (unpublished one-shot)\n# Downloads the CJC/Ipa MP4 and rehosts on catbox files.\n# Writes video_url onto SONILO-001. Does not call Sonilo. Archive after success.',
    },
  },
});

const startTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'manual_trigger', position: [0, 304] },
});

const downloadVideo = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'download_source_mp4',
    position: [240, 304],
    parameters: {
      method: 'GET',
      url: 'https://litter.catbox.moe/ll3c9h.mp4',
      authentication: 'none',
      options: {
        timeout: 180000,
        redirect: { redirect: { followRedirects: true, maxRedirects: 5 } },
        response: { response: { responseFormat: 'file', outputPropertyName: 'data' } },
      },
    },
    output: [{ mimeType: 'video/mp4' }],
  },
});

const uploadCatbox = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'upload_catbox',
    position: [500, 304],
    parameters: {
      method: 'POST',
      url: 'https://catbox.moe/user/api.php',
      sendBody: true,
      contentType: 'multipart-form-data',
      bodyParameters: {
        parameters: [
          { name: 'reqtype', value: 'fileupload' },
          { parameterType: 'formBinaryData', name: 'fileToUpload', inputDataFieldName: 'data' },
        ],
      },
      options: {
        timeout: 180000,
        response: { response: { responseFormat: 'text' } },
      },
    },
    output: [{ data: 'https://files.catbox.moe/example.mp4' }],
  },
});

const saveUrl = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'save_public_url',
    position: [760, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "var j = ($input.first() && $input.first().json) || {};\nvar raw = String(j.data || j.body || j.text || j.url || '').trim();\nif (raw.indexOf('https://files.catbox.moe/') !== 0 && raw.indexOf('https://litter.catbox.moe/') !== 0) {\n  throw new Error('catbox did not return a public https MP4 URL: ' + raw.slice(0, 200));\n}\nreturn [{ json: { job_id: 'SONILO-001', video_url: raw } }];",
    },
    output: [{ job_id: 'SONILO-001', video_url: 'https://files.catbox.moe/example.mp4' }],
  },
});

const sheetsUpdate = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'sheets_update_video_url',
    position: [1020, 304],
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
          video_url: expr('{{ $json.video_url }}'),
        },
        schema: [
          { id: 'job_id', displayName: 'job_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'video_url', displayName: 'video_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
        ],
      },
      options: { cellFormat: 'RAW', handlingExtraData: 'insertInNewColumn' },
    },
    output: [{ job_id: 'SONILO-001', video_url: 'https://files.catbox.moe/example.mp4' }],
  },
});

export default workflow('rehost_sonilo_source', 'rehost_sonilo_source')
  .add(howto)
  .add(startTrigger)
  .to(downloadVideo)
  .to(uploadCatbox)
  .to(saveUrl)
  .to(sheetsUpdate);
