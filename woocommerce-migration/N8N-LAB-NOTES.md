# Lab Notes — Google Workspace + n8n (no MailPoet Sending Service)

**Priority:** land in the inbox, not spam. Automation is second.

MailPoet stays a **list only**. Do **not** send Lab Notes (or any marketing) through MailPoet Sending Service. WordPress.com `wp_mail` is also out — DMARC will fail.

This path is the same authenticated Gmail send that already works for the welcome email: n8n → **Gmail account 2** (`IVBMByCjDhHJYhXB`) logged in as **sales@palmbeach-vitality.com**, **Send mail as** / Reply-To **info@palmbeach-vitality.com**.

| | |
|---|---|
| Send workflow | [`Vitality.store_newsletter_send`](https://stockjohnson.app.n8n.cloud/workflow/J4ZmB8VsgynkWsVt) (id `J4ZmB8VsgynkWsVt`) — **unpublished** until the inbox check passes |
| List workflow | [`Vitality.store_lab_notes_list`](https://stockjohnson.app.n8n.cloud/workflow/pY2SCaWGf9QPDB90) (id `pY2SCaWGf9QPDB90`) — **published** |
| Campaigns sheet | [Vitality.store_lab_notes_campaigns](https://docs.google.com/spreadsheets/d/1rclpmXWCDVpXgWfQL-5JesB4XGjdgTlhM-bVaEd1Lhc/edit) (weekly layout) |
| Subscriber list | [Vitality.store_subscriber_list](https://docs.google.com/spreadsheets/d/1pqqDnTmpl4konPrwWKZ3jd1kGhINcuhi_jFo1aOZ5Yw/edit) |
| Send log | [Vitality.store_lab_notes_sends](https://docs.google.com/spreadsheets/d/1orDdGe26RbWEUlIkqS9ZUpPbWZklmJ9Xc1Ga-Svrn0c/edit) |
| Unsubscribe (GET) | `https://stockjohnson.app.n8n.cloud/webhook/vitality-store-lab-notes-unsubscribe?email=` |
| Subscribe (POST) | `https://stockjohnson.app.n8n.cloud/webhook/vitality-store-lab-notes-subscribe` |

SDK sources: [`n8n/Vitality.store_newsletter_send.sdk.js`](./n8n/Vitality.store_newsletter_send.sdk.js), [`n8n/lab-notes-pick-campaign.js`](./n8n/lab-notes-pick-campaign.js), [`n8n/lab-notes-build-send-list.js`](./n8n/lab-notes-build-send-list.js), [`n8n/Vitality.store_lab_notes_list.sdk.js`](./n8n/Vitality.store_lab_notes_list.sdk.js).

## What you click first (inbox check)

1. In Gmail as **sales@** → ⚙️ → **See all settings** → **Accounts and Import** → **Send mail as**:
   - `info@palmbeach-vitality.com` must exist (you already tested Send mail as).
   - Set **info@** as the **default**. n8n’s Gmail node has no From field — it uses that default. Name: **Palm Beach Vitality**.
2. Open [LN-TEST-001](https://docs.google.com/spreadsheets/d/1rclpmXWCDVpXgWfQL-5JesB4XGjdgTlhM-bVaEd1Lhc/edit). Status is already `test`. `test_email` is `sales@palmbeach-vitality.com`.
3. Open [Vitality.store_newsletter_send](https://stockjohnson.app.n8n.cloud/workflow/J4ZmB8VsgynkWsVt). Confirm **send_lab_notes** uses credential **Gmail account 2**.
4. Click **Test workflow**. It sends **one** email to `sales@` only. Wait ~12 seconds, then it marks the row `tested`.
5. Open that message → **⋮ → Show original**. You want:
   - `From: Palm Beach Vitality <info@palmbeach-vitality.com>` (or sales@ if Send mail as is not default yet — fix step 1)
   - `Reply-To: info@palmbeach-vitality.com`
   - `SPF: PASS`, `DKIM: PASS` with `d=palmbeach-vitality.com`, `DMARC: PASS`
   - Primary inbox, not spam
6. Only after that: `LN-001` already has the Aug 28 mockup copy as `draft`. Set it to `test`, run the send workflow, then `ready` for the list.

Do **not** Publish the send workflow until you are happy clicking Test by hand. Publishing is for later (a schedule), not for the first issues.

## Where you write the newsletter

You do **not** paste a finished HTML email into n8n or Gmail. You fill **one row** in the campaigns sheet. n8n wraps those cells in the weekly template (sunset header, purple date bar, orange section labels, navy status box, three research links, gold footer).

Format in the cells: **plain text**. New paragraph = **Alt+Enter** inside the cell. Do not paste `<html>`. Links belong in the `link_*_url` columns, not inside the body.

`LN-001` is already filled with the Aug 28 issue from the mockup (`status=draft`). Duplicate that row for later weeks.

## Campaign sheet fields

Empty cells fail. Placeholder draft copy (`write the …`) also fails. Do not leave `from_email` / `reply_to` as anything except `info@palmbeach-vitality.com`.

| Column | Required | Notes |
|---|---|---|
| `campaign_id` | yes | Unique, e.g. `LN-001` |
| `status` | yes | `draft` ignored. `test` = `test_email` only. `ready` = all subscribed. After a run: `tested` or `sent` |
| `subject` | yes | Gmail subject. Short, not shouty |
| `preview_text` | yes | Hidden inbox preheader |
| `from_name` | yes | `Palm Beach Vitality` |
| `from_email` | yes | Must be `info@palmbeach-vitality.com` |
| `reply_to` | yes | Must be `info@palmbeach-vitality.com` |
| `issue_line` | yes | Purple bar, e.g. `Weekly Research Update  ·  August 28, 2026` |
| `header_image_url` | yes | HTTPS image. Default is the Lab Notes sunset header in this repo |
| `shop_url` | yes | Logo/header click-through |
| `industry_label` | yes | Orange kicker, usually `INDUSTRY UPDATE` |
| `industry_body` | yes | One paragraph per line (Alt+Enter) |
| `spotlight_label` | yes | Usually `PRODUCT SPOTLIGHT` |
| `spotlight_heading` | yes | Bold title under the kicker |
| `spotlight_body` | yes | One paragraph per line |
| `status_box` | yes | Navy callout. Put `Next step:` on its own line |
| `links_label` | yes | Usually `RECENT RESEARCH & SCIENCE LINKS` |
| `link_1_text` / `link_1_url` | yes | Citation + URL |
| `link_2_text` / `link_2_url` | yes | Citation + URL |
| `link_3_text` / `link_3_url` | yes | Citation + URL |
| `disclaimer` | yes | Research-use footer line |
| `footer_tagline` | yes | Gold line, e.g. `Research Peptides · Verified Purity · COA Documentation` |
| `facebook_url` | yes | |
| `instagram_url` | yes | |
| `tiktok_url` | yes | |
| `test_email` | yes | Your inbox for `status=test` |
| `delay_seconds` | yes | **5 or more**. Default `12` |

## Why this stays out of spam

- Authenticated Google Workspace send (same SPF/DKIM as welcome). Not MailPoet. Not WordPress.com.
- From / Reply-To **info@** (marketing), not a mismatch with `sales@`.
- **One recipient per message.** No BCC blast.
- **Pause between sends** from the sheet (`delay_seconds`).
- Skips `unsubscribed` and anyone already `sent` for that `campaign_id`.
- Unsubscribe link in every footer.
- Physical address + research disclaimer in the footer.
- Start with a 1-person test, then the current 5-person list. Do not import a cold list.
- Workspace daily cap is typically ~2,000. Stay far under that while the domain is warming.

## n8n node map — send

unwired → **manual_trigger** → get_campaigns

manual_trigger → **get_campaigns** → filter_sendable

get_campaigns → **filter_sendable** → pick_campaign

filter_sendable → **pick_campaign** → get_sends

pick_campaign → **get_sends** → get_subscribers

get_sends → **get_subscribers** → build_send_list

get_subscribers → **build_send_list** → send_one_at_a_time

build_send_list → **send_one_at_a_time** → send_lab_notes

send_one_at_a_time → **send_lab_notes** → log_sent_fields

send_lab_notes → **log_sent_fields** → append_send_log

log_sent_fields → **append_send_log** → pace_sends

append_send_log → **pace_sends** → send_one_at_a_time

send_lab_notes → **log_failed_fields** → append_send_log

send_one_at_a_time → **mark_campaign_fields** → mark_campaign_done

mark_campaign_fields → **mark_campaign_done** → end

### get_campaigns

manual_trigger → **get_campaigns** → filter_sendable

- Credential: **Google Sheets account** (`OGHfxWtOUeZbDesw`)
- Document: `Vitality.store_lab_notes_campaigns`
- Operation: Read

### pick_campaign

filter_sendable → **pick_campaign** → get_sends

- Prefers `status=test` over `ready`
- Throws if `from_email` / `reply_to` are not `info@palmbeach-vitality.com`
- Throws if `delay_seconds` &lt; 5
- Throws if the row still has “write the …” placeholder copy

### send_lab_notes

send_one_at_a_time → **send_lab_notes** → log_sent_fields

- Credential: **Gmail account 2** (`IVBMByCjDhHJYhXB`) — sales@ Workspace
- Send To: `{{ $json.email }}`
- Subject: `{{ $json.subject }}`
- Email Type: HTML
- Sender Name: `{{ $json.from_name }}`
- Reply To: `{{ $json.reply_to }}`
- Append n8n attribution: **off**
- On error: continue (log `failed`, keep going)

### pace_sends

append_send_log → **pace_sends** → send_one_at_a_time

- Wait `{{ Number($("build_send_list").item.json.delay_seconds) }}` seconds

## n8n node map — list

### Unsubscribe webhook

unwired → **Unsubscribe webhook** → normalize_unsubscribe

Unsubscribe webhook → **normalize_unsubscribe** → Has unsubscribe email?

normalize_unsubscribe → **Has unsubscribe email?** → mark_unsubscribed

Has unsubscribe email? → **mark_unsubscribed** → Respond unsubscribed

Has unsubscribe email? → **Respond missing email** → end

mark_unsubscribed → **Respond unsubscribed** → end

- Method: GET
- Path: `vitality-store-lab-notes-unsubscribe`
- Production: `https://stockjohnson.app.n8n.cloud/webhook/vitality-store-lab-notes-unsubscribe?email=`

### Subscribe webhook

unwired → **Subscribe webhook** → normalize_subscribe

Subscribe webhook → **normalize_subscribe** → upsert_subscriber

normalize_subscribe → **upsert_subscriber** → Respond subscribed

upsert_subscriber → **Respond subscribed** → end

- Method: POST
- Path: `vitality-store-lab-notes-subscribe`
- Production: `https://stockjohnson.app.n8n.cloud/webhook/vitality-store-lab-notes-subscribe`
- Body: `{ "email": "...", "first_name": "", "source": "homepage_subscribe_popup" }`

normalize_subscribe → **upsert_subscriber** → Respond subscribed → end

To keep new popup signups on this list, add a second HTTP Request on `Vitality.store_email_webhook` (that workflow is not MCP-editable) that POSTs the same email to the subscribe webhook. MailPoet can stay in WordPress as a mirror; it is not the send engine.

## Export MailPoet into the sheet

If the sheet is missing people who only live in MailPoet:

1. WP Admin → MailPoet → Subscribers → export **Palm Beach Vitality**
2. Paste into [Vitality.store_subscriber_list](https://docs.google.com/spreadsheets/d/1pqqDnTmpl4konPrwWKZ3jd1kGhINcuhi_jFo1aOZ5Yw/edit)
3. Keep headers: `Email`, `First name`, `Last name`, `Subscription time`, `Confirmation time`, `List status`, `Global status`, `List`
4. Only rows with `List status` = `subscribed` get Lab Notes

## After the inbox check

When you want a monthly schedule (automation #2): add a Schedule Trigger to the send workflow, keep `status=ready` as the gate, then Publish. Do not schedule until `LN-TEST-001` passed Show original.

If you want failure alerts (email/Slack when a production run dies), say whether you prefer a shared Error Trigger workflow or an Error Trigger inside this one — I will not turn that on silently.
