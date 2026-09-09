import { workflow, node, trigger, sticky, newCredential } from '@n8n/workflow-sdk';

const howto = sticky({
  config: {
    name: 'fetch_howto',
    parameters: {
      color: 4,
      width: 860,
      height: 280,
      content:
        '# fetch_film020_kling (unpublished)\\n# Downloads the already-finished FILM-020 Kling clip and rehosts it on catbox.\\n# Does not start a new generation. Does not write Sheet 18. Does not touch FILM-001 or FILM-004.',
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
    name: 'download_openrouter_video',
    position: [240, 304],
    credentials: { openRouterApi: newCredential('OpenRouter account') },
    parameters: {
      method: 'GET',
      url: 'https://openrouter.ai/api/v1/videos/lX1YNkWIiK9HmYQnIAIK/content?index=0',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'openRouterApi',
      options: {
        timeout: 180000,
        sendCredentialsOnCrossOriginRedirect: true,
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
    position: [496, 304],
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
    output: [{ data: 'https://files.catbox.moe/film020.mp4' }],
  },
});

const saveUrl = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'save_public_url',
    position: [752, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode:
        'var j = ($input.first() && $input.first().json) || {};\n' +
        'var raw = String(j.data || j.body || j.text || j.url || "").trim();\n' +
        'if (raw.indexOf("https://") !== 0) {\n' +
        '  throw new Error("catbox did not return an https URL: " + raw.slice(0, 200));\n' +
        '}\n' +
        'return [{ json: { still_id: "FILM-020", public_video_url: raw, video_request_id: "lX1YNkWIiK9HmYQnIAIK" } }];\n',
    },
    output: [
      {
        still_id: 'FILM-020',
        public_video_url: 'https://files.catbox.moe/film020.mp4',
        video_request_id: 'lX1YNkWIiK9HmYQnIAIK',
      },
    ],
  },
});

export default workflow('fetch_film020_kling', 'fetch_film020_kling')
  .add(howto)
  .add(startTrigger)
  .to(downloadVideo)
  .to(uploadCatbox)
  .to(saveUrl);
