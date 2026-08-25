var campaign = $('pick_campaign').first().json;
var sends = [];
try { sends = $('get_sends').all().map(function (i) { return i.json; }); } catch (e) { sends = []; }
var already = {};
for (var s = 0; s < sends.length; s++) {
  var row = sends[s] || {};
  var cid = String(row.campaign_id || '').trim();
  var em = String(row.email || '').trim().toLowerCase();
  var st = String(row.status || '').trim().toLowerCase();
  if (cid === campaign.campaign_id && em && st === 'sent') already[em] = true;
}
function emailOf(obj) {
  return String((obj && (obj.Email || obj.email)) || '').trim().toLowerCase();
}
function firstNameOf(obj) {
  return String((obj && (obj['First name'] || obj.first_name || obj.FirstName)) || '').trim();
}
function isSubscribed(obj) {
  var list = String((obj && (obj['List status'] || obj.list_status || obj.status)) || '').trim().toLowerCase();
  return list === 'subscribed';
}
var recipients = [];
if (campaign.status === 'test') {
  recipients.push({ email: campaign.test_email, first_name: '' });
} else {
  var items = $input.all();
  for (var i = 0; i < items.length; i++) {
    var em2 = emailOf(items[i].json);
    if (!em2 || em2.indexOf('@') === -1) continue;
    if (!isSubscribed(items[i].json)) continue;
    if (already[em2]) continue;
    recipients.push({ email: em2, first_name: firstNameOf(items[i].json) });
  }
}
if (!recipients.length) {
  throw new Error('build_send_list: no recipients. For test, fill test_email. For ready, need subscribed rows in Vitality.store_subscriber_list that were not already sent this campaign.');
}
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function splitLines(text) {
  var s = String(text || '').replace(/\r\n/g, '\n');
  s = s.replace(/\s+(Next step:)/g, '\n$1');
  return s.split('\n');
}
function paras(text) {
  var parts = splitLines(text);
  var html = '';
  for (var p = 0; p < parts.length; p++) {
    var line = parts[p].trim();
    if (!line) continue;
    html += '<p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1F293B;">' + esc(line) + '</p>';
  }
  return html;
}
function statusHtml(text) {
  var parts = splitLines(text);
  var html = '';
  for (var p = 0; p < parts.length; p++) {
    var line = parts[p].trim();
    if (!line) continue;
    html += '<div style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#F4F8FB;">' + esc(line) + '</div>';
  }
  return html;
}
function linkRow(text, url) {
  if (!String(text || '').trim() || !String(url || '').trim()) return '';
  return '<tr><td style="padding:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1F293B;">&#8226; ' + esc(text) + '<br><a href="' + esc(url) + '" style="color:#1A73E8;text-decoration:underline;word-break:break-all;">' + esc(url) + '</a></td></tr>';
}
function socialCell(href, bg, label) {
  return '<td style="padding:0 8px;"><a href="' + esc(href) + '" style="display:inline-block;width:24px;height:24px;line-height:24px;border-radius:12px;background:' + bg + ';color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;text-align:center;text-decoration:none;">' + label + '</a></td>';
}
var out = [];
for (var r = 0; r < recipients.length; r++) {
  var rec = recipients[r];
  var unsub = 'https://stockjohnson.app.n8n.cloud/webhook/vitality-store-lab-notes-unsubscribe?email=' + encodeURIComponent(rec.email);
  var html = ''
    + '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<title>' + esc(campaign.subject) + '</title></head>'
    + '<body style="margin:0;padding:0;background:#F7F8FA;">'
    + '<div style="display:none;font-size:1px;color:#F7F8FA;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">' + esc(campaign.preview_text) + '</div>'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;padding:0;">'
    + '<tr><td align="center">'
    + '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;">'
    + '<tr><td style="padding:0;background:#000000;">'
    + '<a href="' + esc(campaign.shop_url) + '" style="display:block;"><img src="' + esc(campaign.header_image_url) + '" alt="Palm Beach Vitality" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></a>'
    + '</td></tr>'
    + '<tr><td align="center" style="background:#6F2270;padding:10px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.4;color:#ffffff;">' + esc(campaign.issue_line) + '</td></tr>'
    + '<tr><td style="padding:28px 32px 8px;background:#ffffff;">'
    + '<div style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;color:#FA7317;">' + esc(campaign.industry_label).toUpperCase() + '</div>'
    + paras(campaign.industry_body)
    + '<div style="margin:22px 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;color:#FA7317;">' + esc(campaign.spotlight_label).toUpperCase() + '</div>'
    + '<div style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;line-height:1.3;color:#0F1726;">' + esc(campaign.spotlight_heading) + '</div>'
    + paras(campaign.spotlight_body)
    + '</td></tr>'
    + '<tr><td style="padding:8px 32px 24px;background:#ffffff;">'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0F1726;border-radius:8px;">'
    + '<tr><td style="padding:16px 18px;">' + statusHtml(campaign.status_box) + '</td></tr>'
    + '</table></td></tr>'
    + '<tr><td style="padding:0 32px 8px;background:#ffffff;">'
    + '<div style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;color:#FA7317;">' + esc(campaign.links_label).toUpperCase() + '</div>'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">'
    + linkRow(campaign.link_1_text, campaign.link_1_url)
    + linkRow(campaign.link_2_text, campaign.link_2_url)
    + linkRow(campaign.link_3_text, campaign.link_3_url)
    + '</table></td></tr>'
    + '<tr><td style="padding:8px 32px 28px;background:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.55;font-style:italic;color:#63738C;">' + esc(campaign.disclaimer) + '</td></tr>'
    + '<tr><td align="center" style="background:#0F1726;padding:20px 16px 8px;">'
    + '<table role="presentation" cellpadding="0" cellspacing="0"><tr>'
    + socialCell(campaign.facebook_url, '#1877F2', 'f')
    + socialCell(campaign.instagram_url, '#E1306C', 'ig')
    + socialCell(campaign.tiktok_url, '#111111', 'tk')
    + '</tr></table></td></tr>'
    + '<tr><td align="center" style="background:#0F1726;padding:8px 24px 10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#FABF24;">' + esc(campaign.footer_tagline) + '</td></tr>'
    + '<tr><td align="center" style="background:#0F1726;padding:0 24px 22px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#9EB6C8;">'
    + '<a href="' + unsub + '" style="color:#9EB6C8;text-decoration:underline;">Unsubscribe</a>'
    + '</td></tr>'
    + '</table></td></tr></table></body></html>';
  out.push({ json: {
    campaign_id: campaign.campaign_id,
    status: campaign.status,
    subject: campaign.subject,
    preview_text: campaign.preview_text,
    from_name: campaign.from_name,
    from_email: campaign.from_email,
    reply_to: campaign.reply_to,
    issue_line: campaign.issue_line,
    header_image_url: campaign.header_image_url,
    shop_url: campaign.shop_url,
    test_email: campaign.test_email,
    delay_seconds: campaign.delay_seconds,
    email: rec.email,
    first_name: rec.first_name,
    unsubscribe_url: unsub,
    html: html
  } });
}
return out;
