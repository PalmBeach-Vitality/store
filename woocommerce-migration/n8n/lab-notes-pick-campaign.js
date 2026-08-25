function val(obj, names) {
  for (var i = 0; i < names.length; i++) {
    var n = names[i];
    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') return obj[n];
  }
  var keys = Object.keys(obj || {});
  for (var w = 0; w < names.length; w++) {
    var want = String(names[w]).toLowerCase().split(' ').join('_');
    for (var k = 0; k < keys.length; k++) {
      if (keys[k].toLowerCase().split(' ').join('_') === want && String(obj[keys[k]]).trim() !== '') return obj[keys[k]];
    }
  }
  return '';
}
function must(obj, names, label) {
  var v = val(obj, names);
  if (v === undefined || v === null || String(v).trim() === '') {
    throw new Error('pick_campaign: empty sheet field ' + label + ' on Vitality.store_lab_notes_campaigns. Fill that cell first.');
  }
  return String(v).trim();
}
var rows = $input.all().map(function (i) { return i.json; });
if (!rows.length) {
  throw new Error('No campaign with status test or ready. Set LN-TEST-001 to test or LN-001 to ready in Vitality.store_lab_notes_campaigns.');
}
var tests = rows.filter(function (r) { return String(val(r, ['status'])).toLowerCase() === 'test'; });
var pick = tests.length ? tests[0] : rows[0];
var campaign_id = must(pick, ['campaign_id'], 'campaign_id');
var status = must(pick, ['status'], 'status').toLowerCase();
var subject = must(pick, ['subject'], 'subject');
var preview_text = must(pick, ['preview_text'], 'preview_text');
var from_name = must(pick, ['from_name'], 'from_name');
var from_email = must(pick, ['from_email'], 'from_email').toLowerCase();
var reply_to = must(pick, ['reply_to'], 'reply_to').toLowerCase();
var issue_line = must(pick, ['issue_line'], 'issue_line');
var header_image_url = must(pick, ['header_image_url', 'logo_url'], 'header_image_url');
var shop_url = must(pick, ['shop_url'], 'shop_url');
var industry_label = must(pick, ['industry_label'], 'industry_label');
var industry_body = must(pick, ['industry_body'], 'industry_body');
var spotlight_label = must(pick, ['spotlight_label'], 'spotlight_label');
var spotlight_heading = must(pick, ['spotlight_heading'], 'spotlight_heading');
var spotlight_body = must(pick, ['spotlight_body'], 'spotlight_body');
var status_box = must(pick, ['status_box'], 'status_box');
var links_label = must(pick, ['links_label'], 'links_label');
var link_1_text = must(pick, ['link_1_text'], 'link_1_text');
var link_1_url = must(pick, ['link_1_url'], 'link_1_url');
var link_2_text = must(pick, ['link_2_text'], 'link_2_text');
var link_2_url = must(pick, ['link_2_url'], 'link_2_url');
var link_3_text = must(pick, ['link_3_text'], 'link_3_text');
var link_3_url = must(pick, ['link_3_url'], 'link_3_url');
var disclaimer = must(pick, ['disclaimer'], 'disclaimer');
var footer_tagline = must(pick, ['footer_tagline'], 'footer_tagline');
var facebook_url = must(pick, ['facebook_url'], 'facebook_url');
var instagram_url = must(pick, ['instagram_url'], 'instagram_url');
var tiktok_url = must(pick, ['tiktok_url'], 'tiktok_url');
var test_email = must(pick, ['test_email'], 'test_email').toLowerCase();
var delay_seconds = Number(must(pick, ['delay_seconds'], 'delay_seconds'));
// Sheet from_email stays info@ (Reply-To brand). Gmail From is always sales@. Leave it.
if (from_email !== 'info@palmbeach-vitality.com') {
  throw new Error('pick_campaign: from_email must be info@palmbeach-vitality.com. Got: ' + from_email);
}
if (reply_to !== 'info@palmbeach-vitality.com') {
  throw new Error('pick_campaign: reply_to must be info@palmbeach-vitality.com. Got: ' + reply_to);
}
if (status !== 'test' && status !== 'ready') {
  throw new Error('pick_campaign: status must be test or ready. Got: ' + status);
}
if (!delay_seconds || delay_seconds < 5) {
  throw new Error('pick_campaign: delay_seconds must be 5 or more so Gmail does not treat this as a blast. Got: ' + delay_seconds);
}
var blob = (subject + ' ' + industry_body + ' ' + spotlight_body).toLowerCase();
if (blob.indexOf('write the') !== -1 || blob.indexOf('write the lab notes body') !== -1) {
  throw new Error('pick_campaign: ' + campaign_id + ' still has placeholder copy. Write the weekly Lab Notes sections in the sheet first.');
}
return [{ json: {
  campaign_id: campaign_id,
  status: status,
  subject: subject,
  preview_text: preview_text,
  from_name: from_name,
  from_email: from_email,
  reply_to: reply_to,
  issue_line: issue_line,
  header_image_url: header_image_url,
  shop_url: shop_url,
  industry_label: industry_label,
  industry_body: industry_body,
  spotlight_label: spotlight_label,
  spotlight_heading: spotlight_heading,
  spotlight_body: spotlight_body,
  status_box: status_box,
  links_label: links_label,
  link_1_text: link_1_text,
  link_1_url: link_1_url,
  link_2_text: link_2_text,
  link_2_url: link_2_url,
  link_3_text: link_3_text,
  link_3_url: link_3_url,
  disclaimer: disclaimer,
  footer_tagline: footer_tagline,
  facebook_url: facebook_url,
  instagram_url: instagram_url,
  tiktok_url: tiktok_url,
  test_email: test_email,
  delay_seconds: delay_seconds
} }];
