import { workflow, node, trigger, sticky, newCredential, ifElse, expr } from '@n8n/workflow-sdk';

const sheetsCred = { googleSheetsOAuth2Api: newCredential('Google Sheets account') };

const unsubTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Unsubscribe webhook',
    parameters: {
      httpMethod: 'GET',
      path: 'vitality-store-lab-notes-unsubscribe',
      responseMode: 'responseNode',
      options: {}
    }
  },
  output: [{ query: { email: 'sales@palmbeach-vitality.com' }, body: {} }]
});

const subTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Subscribe webhook',
    parameters: {
      httpMethod: 'POST',
      path: 'vitality-store-lab-notes-subscribe',
      responseMode: 'responseNode',
      options: {}
    }
  },
  output: [{ body: { email: 'new@example.com', first_name: 'Alex', source: 'homepage_subscribe_popup' } }]
});

const normalizeUnsub = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'normalize_unsubscribe',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "var raw = $input.first().json || {};\nvar q = raw.query || {};\nvar b = raw.body || {};\nvar email = String(q.email || b.email || raw.email || '').trim().toLowerCase();\nif (!email || email.indexOf('@') === -1) {\n  return [{ json: { ok: false, email: '', message: 'Missing email' } }];\n}\nreturn [{ json: { ok: true, Email: email, 'List status': 'unsubscribed', 'Global status': 'unsubscribed', 'Confirmation time': $now.toISO() } }];"
    }
  },
  output: [{ ok: true, Email: 'sales@palmbeach-vitality.com', 'List status': 'unsubscribed', 'Global status': 'unsubscribed', 'Confirmation time': '2026-08-23T00:00:00.000Z' }]
});

const hasUnsubEmail = ifElse({
  version: 2.3,
  config: {
    name: 'Has unsubscribe email?',
    parameters: {
      conditions: {
        combinator: 'and',
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [
          { id: 'unsub-ok', leftValue: expr('{{ $json.ok }}'), rightValue: true, operator: { type: 'boolean', operation: 'equals' } }
        ]
      }
    }
  }
});

const upsertUnsub = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'mark_unsubscribed',
    parameters: {
      operation: 'appendOrUpdate',
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
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['Email'],
        value: {
          Email: expr('{{ $json.Email }}'),
          'List status': expr('{{ $json[\"List status\"] }}'),
          'Global status': expr('{{ $json[\"Global status\"] }}'),
          'Confirmation time': expr('{{ $json[\"Confirmation time\"] }}')
        },
        schema: [
          { id: 'Email', displayName: 'Email', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'List status', displayName: 'List status', required: true, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'Global status', displayName: 'Global status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'Confirmation time', displayName: 'Confirmation time', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false }
        ]
      },
      options: { cellFormat: 'USER_ENTERED' }
    },
    credentials: sheetsCred
  },
  output: [{ Email: 'sales@palmbeach-vitality.com', 'List status': 'unsubscribed' }]
});

const respondUnsubOk = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond unsubscribed',
    parameters: {
      respondWith: 'text',
      responseBody: 'You have been unsubscribed from Palm Beach Vitality Lab Notes. If this was a mistake, write info@palmbeach-vitality.com.',
      options: {
        responseCode: 200,
        responseHeaders: {
          entries: [{ name: 'content-type', value: 'text/plain; charset=utf-8' }]
        }
      }
    }
  },
  output: [{ ok: true }]
});

const respondUnsubBad = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond missing email',
    parameters: {
      respondWith: 'text',
      responseBody: 'Missing email. Use the unsubscribe link from your Lab Notes message.',
      options: {
        responseCode: 400,
        responseHeaders: {
          entries: [{ name: 'content-type', value: 'text/plain; charset=utf-8' }]
        }
      }
    }
  },
  output: [{ ok: false }]
});

const normalizeSub = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'normalize_subscribe',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "var raw = $input.first().json || {};\nvar b = raw.body || raw;\nvar email = String(b.email || raw.email || '').trim().toLowerCase();\nvar first = String(b.first_name || b.firstName || '').trim();\nvar last = String(b.last_name || b.lastName || '').trim();\nvar source = String(b.source || 'n8n_subscribe_webhook').trim();\nif (!email || email.indexOf('@') === -1) {\n  throw new Error('normalize_subscribe: missing or invalid email');\n}\nreturn [{ json: { Email: email, 'First name': first, 'Last name': last, 'Subscription time': $now.toISO(), 'Confirmation time': '', 'List status': 'subscribed', 'Global status': 'subscribed', List: 'Palm Beach Vitality', source: source } }];"
    }
  },
  output: [{
    Email: 'new@example.com',
    'First name': 'Alex',
    'Last name': '',
    'Subscription time': '2026-08-23T00:00:00.000Z',
    'Confirmation time': '',
    'List status': 'subscribed',
    'Global status': 'subscribed',
    List: 'Palm Beach Vitality',
    source: 'homepage_subscribe_popup'
  }]
});

const upsertSub = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'upsert_subscriber',
    parameters: {
      operation: 'appendOrUpdate',
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
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['Email'],
        value: {
          Email: expr('{{ $json.Email }}'),
          'First name': expr('{{ $json[\"First name\"] }}'),
          'Last name': expr('{{ $json[\"Last name\"] }}'),
          'Subscription time': expr('{{ $json[\"Subscription time\"] }}'),
          'List status': expr('{{ $json[\"List status\"] }}'),
          'Global status': expr('{{ $json[\"Global status\"] }}'),
          List: expr('{{ $json.List }}')
        },
        schema: [
          { id: 'Email', displayName: 'Email', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'First name', displayName: 'First name', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'Last name', displayName: 'Last name', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'Subscription time', displayName: 'Subscription time', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'List status', displayName: 'List status', required: true, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'Global status', displayName: 'Global status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'List', displayName: 'List', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false }
        ]
      },
      options: { cellFormat: 'USER_ENTERED' }
    },
    credentials: sheetsCred
  },
  output: [{ Email: 'new@example.com', 'List status': 'subscribed' }]
});

const respondSubOk = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond subscribed',
    parameters: {
      respondWith: 'json',
      responseBody: expr('{{ JSON.stringify({ ok: true, email: $json.Email || $(\"normalize_subscribe\").first().json.Email }) }}'),
      options: { responseCode: 200 }
    }
  },
  output: [{ ok: true }]
});

const note = sticky(
  '# Lab Notes list\n\nUnsubscribe GET and subscribe POST against Vitality.store_subscriber_list.\n\nDo not use MailPoet Sending Service. This sheet is the send list.',
  [unsubTrigger, subTrigger],
  { color: 4 }
);

export default workflow('vitality-store-lab-notes-list', 'Vitality.store_lab_notes_list')
  .add(unsubTrigger)
  .to(normalizeUnsub)
  .to(
    hasUnsubEmail
      .onTrue(upsertUnsub.to(respondUnsubOk))
      .onFalse(respondUnsubBad)
  )
  .add(subTrigger)
  .to(normalizeSub)
  .to(upsertSub)
  .to(respondSubOk)
  .add(note);
