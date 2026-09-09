import { workflow, node, trigger, sticky, newCredential, splitInBatches, nextBatch, expr } from '@n8n/workflow-sdk';

// Live weekly HTML: n8n/lab-notes-pick-campaign.js + n8n/lab-notes-build-send-list.js
// Gmail From is the OAuth mailbox (sales@). Leave it. Reply-To is sheet reply_to (info@).

const sheetsCred = { googleSheetsOAuth2Api: newCredential('Google Sheets account') };
const gmailCred = { gmailOAuth2: newCredential('Gmail account 2') };

const startTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'manual_trigger' },
  output: [{ started: true }]
});

const getCampaigns = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'get_campaigns',
    parameters: {
      operation: 'read',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1rclpmXWCDVpXgWfQL-5JesB4XGjdgTlhM-bVaEd1Lhc',
        cachedResultName: 'Vitality.store_lab_notes_campaigns'
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '1259233093',
        cachedResultName: 'Untitled'
      },
      options: {}
    },
    credentials: sheetsCred
  },
  output: [{
    campaign_id: 'LN-TEST-001',
    status: 'test',
    subject: '[Test] Lab Notes inbox check',
    preview_text: 'Confirm this lands in the inbox not spam',
    from_name: 'Palm Beach Vitality',
    from_email: 'info@palmbeach-vitality.com',
    reply_to: 'info@palmbeach-vitality.com',
    heading: 'Inbox check',
    body_text: 'This is a one-person inbox test.',
    cta_label: 'Open the shop',
    cta_url: 'https://palmbeach-vitality.store/shop/',
    logo_url: 'https://palmbeach-vitality.store/wp-content/themes/palmbeach-vitality/assets/images/logo-full.jpg',
    shop_url: 'https://palmbeach-vitality.store/shop/',
    test_email: 'sales@palmbeach-vitality.com',
    delay_seconds: 12
  }]
});

const filterSendable = node({
  type: 'n8n-nodes-base.filter',
  version: 2.3,
  config: {
    name: 'filter_sendable',
    parameters: {
      conditions: {
        combinator: 'or',
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [
          { id: 'st-test', leftValue: expr('{{ $json.status }}'), rightValue: 'test', operator: { type: 'string', operation: 'equals' } },
          { id: 'st-ready', leftValue: expr('{{ $json.status }}'), rightValue: 'ready', operator: { type: 'string', operation: 'equals' } }
        ]
      }
    }
  },
  output: [{
    campaign_id: 'LN-TEST-001',
    status: 'test',
    subject: '[Test] Lab Notes inbox check',
    from_email: 'info@palmbeach-vitality.com',
    reply_to: 'info@palmbeach-vitality.com',
    test_email: 'sales@palmbeach-vitality.com',
    delay_seconds: 12
  }]
});

const pickCampaign = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'pick_campaign',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "function val(obj, names) {\n  for (var i = 0; i < names.length; i++) {\n    var n = names[i];\n    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') return obj[n];\n  }\n  var keys = Object.keys(obj || {});\n  for (var w = 0; w < names.length; w++) {\n    var want = String(names[w]).toLowerCase().split(' ').join('_');\n    for (var k = 0; k < keys.length; k++) {\n      if (keys[k].toLowerCase().split(' ').join('_') === want && String(obj[keys[k]]).trim() !== '') return obj[keys[k]];\n    }\n  }\n  return '';\n}\nfunction must(obj, names, label) {\n  var v = val(obj, names);\n  if (v === undefined || v === null || String(v).trim() === '') {\n    throw new Error('pick_campaign: empty sheet field ' + label + ' on Vitality.store_lab_notes_campaigns. Fill that cell first.');\n  }\n  return String(v).trim();\n}\nvar rows = $input.all().map(function (i) { return i.json; });\nif (!rows.length) {\n  throw new Error('No campaign with status test or ready. Set LN-TEST-001 to test or LN-001 to ready in Vitality.store_lab_notes_campaigns.');\n}\nvar tests = rows.filter(function (r) { return String(val(r, ['status'])).toLowerCase() === 'test'; });\nvar pick = tests.length ? tests[0] : rows[0];\nvar campaign_id = must(pick, ['campaign_id'], 'campaign_id');\nvar status = must(pick, ['status'], 'status').toLowerCase();\nvar subject = must(pick, ['subject'], 'subject');\nvar preview_text = must(pick, ['preview_text'], 'preview_text');\nvar from_name = must(pick, ['from_name'], 'from_name');\nvar from_email = must(pick, ['from_email'], 'from_email').toLowerCase();\nvar reply_to = must(pick, ['reply_to'], 'reply_to').toLowerCase();\nvar heading = must(pick, ['heading'], 'heading');\nvar body_text = must(pick, ['body_text'], 'body_text');\nvar cta_label = must(pick, ['cta_label'], 'cta_label');\nvar cta_url = must(pick, ['cta_url'], 'cta_url');\nvar logo_url = must(pick, ['logo_url'], 'logo_url');\nvar shop_url = must(pick, ['shop_url'], 'shop_url');\nvar test_email = must(pick, ['test_email'], 'test_email').toLowerCase();\nvar delay_seconds = Number(must(pick, ['delay_seconds'], 'delay_seconds'));\nif (from_email !== 'info@palmbeach-vitality.com') {\n  throw new Error('pick_campaign: from_email must be info@palmbeach-vitality.com. Got: ' + from_email);\n}\nif (reply_to !== 'info@palmbeach-vitality.com') {\n  throw new Error('pick_campaign: reply_to must be info@palmbeach-vitality.com. Got: ' + reply_to);\n}\nif (status !== 'test' && status !== 'ready') {\n  throw new Error('pick_campaign: status must be test or ready. Got: ' + status);\n}\nif (!delay_seconds || delay_seconds < 5) {\n  throw new Error('pick_campaign: delay_seconds must be 5 or more so Gmail does not treat this as a blast. Got: ' + delay_seconds);\n}\nif (subject.toLowerCase().indexOf('write the') !== -1 || body_text.toLowerCase().indexOf('write the lab notes body') !== -1) {\n  throw new Error('pick_campaign: ' + campaign_id + ' still has placeholder copy. Write the real Lab Notes text in the sheet first.');\n}\nreturn [{ json: { campaign_id: campaign_id, status: status, subject: subject, preview_text: preview_text, from_name: from_name, from_email: from_email, reply_to: reply_to, heading: heading, body_text: body_text, cta_label: cta_label, cta_url: cta_url, logo_url: logo_url, shop_url: shop_url, test_email: test_email, delay_seconds: delay_seconds } }];"
    }
  },
  output: [{
    campaign_id: 'LN-TEST-001',
    status: 'test',
    subject: '[Test] Lab Notes inbox check',
    preview_text: 'Confirm this lands in the inbox not spam',
    from_name: 'Palm Beach Vitality',
    from_email: 'info@palmbeach-vitality.com',
    reply_to: 'info@palmbeach-vitality.com',
    heading: 'Inbox check',
    body_text: 'This is a one-person inbox test from Palm Beach Vitality Lab Notes.',
    cta_label: 'Open the shop',
    cta_url: 'https://palmbeach-vitality.store/shop/',
    logo_url: 'https://palmbeach-vitality.store/wp-content/themes/palmbeach-vitality/assets/images/logo-full.jpg',
    shop_url: 'https://palmbeach-vitality.store/shop/',
    test_email: 'sales@palmbeach-vitality.com',
    delay_seconds: 12
  }]
});

const getSends = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'get_sends',
    alwaysOutputData: true,
    parameters: {
      operation: 'read',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1orDdGe26RbWEUlIkqS9ZUpPbWZklmJ9Xc1Ga-Svrn0c',
        cachedResultName: 'Vitality.store_lab_notes_sends'
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '1970653833',
        cachedResultName: 'Untitled'
      },
      options: {}
    },
    credentials: sheetsCred
  },
  output: [{ campaign_id: '', email: '', status: '' }]
});

const getSubscribers = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'get_subscribers',
    executeOnce: true,
    alwaysOutputData: true,
    parameters: {
      operation: 'read',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1pqqDnTmpl4konPrwWKZ3jd1kGhINcuhi_jFo1aOZ5Yw',
        cachedResultName: 'Vitality.store_subscriber_list'
      },
      sheetName: {
        __rl: true,
        mode: 'name',
        value: 'Sheet1',
        cachedResultName: 'Sheet1'
      },
      options: {}
    },
    credentials: sheetsCred
  },
  output: [{
    Email: 'sales@palmbeach-vitality.com',
    'First name': 'Salvatore',
    'List status': 'subscribed'
  }]
});

const buildSendList = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'build_send_list',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "var campaign = $('pick_campaign').first().json;\nvar sends = [];\ntry { sends = $('get_sends').all().map(function (i) { return i.json; }); } catch (e) { sends = []; }\nvar already = {};\nfor (var s = 0; s < sends.length; s++) {\n  var row = sends[s] || {};\n  var cid = String(row.campaign_id || '').trim();\n  var em = String(row.email || '').trim().toLowerCase();\n  var st = String(row.status || '').trim().toLowerCase();\n  if (cid === campaign.campaign_id && em && st === 'sent') already[em] = true;\n}\nfunction emailOf(obj) {\n  return String((obj && (obj.Email || obj.email)) || '').trim().toLowerCase();\n}\nfunction firstNameOf(obj) {\n  return String((obj && (obj['First name'] || obj.first_name || obj.FirstName)) || '').trim();\n}\nfunction isSubscribed(obj) {\n  var list = String((obj && (obj['List status'] || obj.list_status || obj.status)) || '').trim().toLowerCase();\n  return list === 'subscribed';\n}\nvar recipients = [];\nif (campaign.status === 'test') {\n  recipients.push({ email: campaign.test_email, first_name: '' });\n} else {\n  var items = $input.all();\n  for (var i = 0; i < items.length; i++) {\n    var em2 = emailOf(items[i].json);\n    if (!em2 || em2.indexOf('@') === -1) continue;\n    if (!isSubscribed(items[i].json)) continue;\n    if (already[em2]) continue;\n    recipients.push({ email: em2, first_name: firstNameOf(items[i].json) });\n  }\n}\nif (!recipients.length) {\n  throw new Error('build_send_list: no recipients. For test, fill test_email. For ready, need subscribed rows in Vitality.store_subscriber_list that were not already sent this campaign.');\n}\nfunction esc(s) {\n  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');\n}\nfunction paras(text) {\n  var parts = String(text || '').split('\\n');\n  var html = '';\n  for (var p = 0; p < parts.length; p++) {\n    var line = parts[p].trim();\n    if (!line) continue;\n    html += '<p style=\"margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#c8d6e0;\">' + esc(line) + '</p>';\n  }\n  return html;\n}\nvar out = [];\nfor (var r = 0; r < recipients.length; r++) {\n  var rec = recipients[r];\n  var unsub = 'https://stockjohnson.app.n8n.cloud/webhook/vitality-store-lab-notes-unsubscribe?email=' + encodeURIComponent(rec.email);\n  var html = '<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"></head><body style=\"margin:0;padding:0;background:#05080c;\"><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#0a0f14;padding:36px 14px;\"><tr><td align=\"center\"><table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px;width:100%;\"><tr><td style=\"background:#0c121a;border:1px solid #1e2a38;border-top:3px solid #00d4ff;border-radius:8px;overflow:hidden;\"><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr><td style=\"background:#080d14;padding:0;\"><a href=\"' + esc(campaign.shop_url) + '\" style=\"display:block;\"><img src=\"' + esc(campaign.logo_url) + '\" alt=\"Palm Beach Vitality\" width=\"600\" style=\"display:block;width:100%;max-width:600px;height:auto;border:0;\"></a></td></tr><tr><td style=\"background:#0a1018;padding:16px 28px;text-align:center;border-bottom:1px solid #1a2430;\"><div style=\"font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:0.28em;color:#00d4ff;font-weight:700;\">PALM BEACH VITALITY</div><div style=\"margin-top:8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;color:#9eb6c8;\">LAB NOTES</div></td></tr><tr><td style=\"padding:34px 34px 10px;background:#0c121a;\"><h1 style=\"margin:0 0 16px;font-family:Georgia,Times New Roman,serif;font-size:28px;line-height:1.25;color:#f4f8fb;font-weight:700;\">' + esc(campaign.heading) + '</h1>' + paras(campaign.body_text) + '<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\"><tr><td style=\"background:#00d4ff;border-radius:4px;\"><a href=\"' + esc(campaign.cta_url) + '\" style=\"display:inline-block;padding:14px 26px;font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:0.1em;text-decoration:none;color:#041018;font-weight:700;\">' + esc(campaign.cta_label).toUpperCase() + '</a></td></tr></table></td></tr><tr><td style=\"padding:24px 34px 32px;background:#0c121a;border-top:1px solid #1a2430;\"><p style=\"margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.65;color:#7f93a3;\">Palm Beach Vitality · Palm Beach County, Florida<br>All products are intended for research purposes only. Not for human consumption. Not evaluated by the FDA.<br>Questions? Reply to this email or write info@palmbeach-vitality.com.</p><p style=\"margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.65;color:#7f93a3;\"><a href=\"' + unsub + '\" style=\"color:#9eb6c8;\">Unsubscribe</a></p></td></tr></table></td></tr></table></td></tr></table></body></html>';\n  out.push({ json: { campaign_id: campaign.campaign_id, status: campaign.status, subject: campaign.subject, preview_text: campaign.preview_text, from_name: campaign.from_name, from_email: campaign.from_email, reply_to: campaign.reply_to, heading: campaign.heading, body_text: campaign.body_text, cta_label: campaign.cta_label, cta_url: campaign.cta_url, logo_url: campaign.logo_url, shop_url: campaign.shop_url, test_email: campaign.test_email, delay_seconds: campaign.delay_seconds, email: rec.email, first_name: rec.first_name, unsubscribe_url: unsub, html: html } });\n}\nreturn out;"
    }
  },
  output: [{
    campaign_id: 'LN-TEST-001',
    status: 'test',
    subject: '[Test] Lab Notes inbox check',
    from_name: 'Palm Beach Vitality',
    from_email: 'info@palmbeach-vitality.com',
    reply_to: 'info@palmbeach-vitality.com',
    delay_seconds: 12,
    email: 'sales@palmbeach-vitality.com',
    first_name: 'Salvatore',
    html: '<p>test</p>'
  }]
});

const sendLoop = splitInBatches({
  version: 3,
  config: {
    name: 'send_one_at_a_time',
    parameters: { batchSize: 1 }
  }
});

const sendLabNotes = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'send_lab_notes',
    onError: 'continueErrorOutput',
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 2000,
    parameters: {
      resource: 'message',
      operation: 'send',
      sendTo: expr('{{ $json.email }}'),
      subject: expr('{{ $json.subject }}'),
      emailType: 'html',
      message: expr('{{ $json.html }}'),
      options: {
        senderName: expr('{{ $json.from_name }}'),
        appendAttribution: false,
        replyTo: expr('{{ $json.reply_to }}')
      }
    },
    credentials: gmailCred
  },
  output: [{ id: 'msg-test', threadId: 'thr-test' }]
});

const logSent = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'log_sent_fields',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'ls-cid', name: 'campaign_id', value: expr('{{ $("build_send_list").item.json.campaign_id }}'), type: 'string' },
          { id: 'ls-em', name: 'email', value: expr('{{ $("build_send_list").item.json.email }}'), type: 'string' },
          { id: 'ls-st', name: 'status', value: 'sent', type: 'string' },
          { id: 'ls-at', name: 'sent_at', value: expr('{{ $now.toISO() }}'), type: 'string' },
          { id: 'ls-gid', name: 'gmail_id', value: expr('{{ $json.id }}'), type: 'string' },
          { id: 'ls-err', name: 'error', value: '', type: 'string' }
        ]
      }
    }
  },
  output: [{ campaign_id: 'LN-TEST-001', email: 'sales@palmbeach-vitality.com', status: 'sent', sent_at: '2026-08-23T00:00:00.000Z', gmail_id: 'msg-test', error: '' }]
});

const logFailed = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'log_failed_fields',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'lf-cid', name: 'campaign_id', value: expr('{{ $("build_send_list").item.json.campaign_id }}'), type: 'string' },
          { id: 'lf-em', name: 'email', value: expr('{{ $("build_send_list").item.json.email }}'), type: 'string' },
          { id: 'lf-st', name: 'status', value: 'failed', type: 'string' },
          { id: 'lf-at', name: 'sent_at', value: expr('{{ $now.toISO() }}'), type: 'string' },
          { id: 'lf-gid', name: 'gmail_id', value: '', type: 'string' },
          { id: 'lf-err', name: 'error', value: expr('{{ $json.error && $json.error.message ? $json.error.message : JSON.stringify($json) }}'), type: 'string' }
        ]
      }
    }
  },
  output: [{ campaign_id: 'LN-TEST-001', email: 'sales@palmbeach-vitality.com', status: 'failed', sent_at: '2026-08-23T00:00:00.000Z', gmail_id: '', error: 'example' }]
});

const appendSendLog = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'append_send_log',
    parameters: {
      operation: 'append',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1orDdGe26RbWEUlIkqS9ZUpPbWZklmJ9Xc1Ga-Svrn0c',
        cachedResultName: 'Vitality.store_lab_notes_sends'
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '1970653833',
        cachedResultName: 'Untitled'
      },
      columns: {
        mappingMode: 'autoMapInputData',
        value: {},
        schema: [
          { id: 'campaign_id', displayName: 'campaign_id', required: true, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'email', displayName: 'email', required: true, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'status', displayName: 'status', required: true, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'sent_at', displayName: 'sent_at', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'gmail_id', displayName: 'gmail_id', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'error', displayName: 'error', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false }
        ]
      },
      options: { cellFormat: 'USER_ENTERED', handlingExtraData: 'ignoreIt' }
    },
    credentials: sheetsCred
  },
  output: [{ campaign_id: 'LN-TEST-001', email: 'sales@palmbeach-vitality.com', status: 'sent' }]
});

const paceSends = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: {
    name: 'pace_sends',
    parameters: {
      resume: 'timeInterval',
      amount: expr('{{ Number($("build_send_list").item.json.delay_seconds) }}'),
      unit: 'seconds'
    }
  },
  output: [{ campaign_id: 'LN-TEST-001', delay_seconds: 12 }]
});

const markFields = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'mark_campaign_fields',
    executeOnce: true,
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'mk-cid', name: 'campaign_id', value: expr('{{ $("pick_campaign").first().json.campaign_id }}'), type: 'string' },
          { id: 'mk-st', name: 'status', value: expr('{{ $("pick_campaign").first().json.status === "test" ? "tested" : "sent" }}'), type: 'string' }
        ]
      }
    }
  },
  output: [{ campaign_id: 'LN-TEST-001', status: 'tested' }]
});

const markCampaign = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'mark_campaign_done',
    parameters: {
      operation: 'update',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1rclpmXWCDVpXgWfQL-5JesB4XGjdgTlhM-bVaEd1Lhc',
        cachedResultName: 'Vitality.store_lab_notes_campaigns'
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '1259233093',
        cachedResultName: 'Untitled'
      },
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['campaign_id'],
        value: {
          campaign_id: expr('{{ $json.campaign_id }}'),
          status: expr('{{ $json.status }}')
        },
        schema: [
          { id: 'campaign_id', displayName: 'campaign_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'status', displayName: 'status', required: true, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false }
        ]
      },
      options: { cellFormat: 'USER_ENTERED' }
    },
    credentials: sheetsCred
  },
  output: [{ campaign_id: 'LN-TEST-001', status: 'tested' }]
});

const note = sticky(
  '# Vitality.store_newsletter_send (unpublished)\n\n**Weekly HTML** matching the Aug 21 mockup. Copy lives in the campaigns SHEET, not this canvas. Do not use MailPoet Sending Service.\n\nFrom is sales@palmbeach-vitality.com (Gmail account 2). Leave it. Reply-To is info@. Do not try fromAlias, Send mail as, or Gmail API HTTP to force info@.\n\n1. status=test → only test_email (start here).\n2. status=ready → subscribed rows, 1 email at a time, wait delay_seconds.\n3. Reply-To must be info@palmbeach-vitality.com.\n4. Write issue_line, industry, spotlight, status_box, and 3 research links. Alt+Enter for a new paragraph.\n5. Empty cells throw. Placeholder “write the …” copy throws.',
  [startTrigger, getCampaigns],
  { color: 4 }
);

export default workflow('vitality-store-newsletter-send', 'Vitality.store_newsletter_send')
  .add(startTrigger)
  .to(getCampaigns)
  .to(filterSendable)
  .to(pickCampaign)
  .to(getSends)
  .to(getSubscribers)
  .to(buildSendList)
  .to(
    sendLoop
      .onEachBatch(
        sendLabNotes
          .to(logSent.to(appendSendLog.to(paceSends.to(nextBatch(sendLoop)))))
      )
      .onDone(markFields.to(markCampaign))
  )
  .add(sendLabNotes.onError(logFailed.to(appendSendLog)))
  .add(note);
