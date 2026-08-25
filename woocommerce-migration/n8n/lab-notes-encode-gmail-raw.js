var j = $json;
var fromEmail = String(j.from_email || '').trim().toLowerCase();
if (fromEmail !== 'info@palmbeach-vitality.com') {
  throw new Error('encode_gmail_raw: from_email must be info@palmbeach-vitality.com. Got: ' + fromEmail);
}
var to = String(j.email || '').trim();
if (!to || to.indexOf('@') === -1) {
  throw new Error('encode_gmail_raw: empty recipient email');
}
var html = String(j.html || '');
if (!html) {
  throw new Error('encode_gmail_raw: empty html');
}
function asciiHeader(s) {
  return String(s || '').replace(/\r|\n/g, ' ');
}
var fromName = asciiHeader(j.from_name || 'Palm Beach Vitality');
var subject = asciiHeader(j.subject);
var replyTo = String(j.reply_to || fromEmail).trim();
var bodyB64 = Buffer.from(html, 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n');
var mime = 'From: ' + fromName + ' <' + fromEmail + '>\r\n'
  + 'To: ' + to + '\r\n'
  + 'Reply-To: ' + replyTo + '\r\n'
  + 'Subject: ' + subject + '\r\n'
  + 'MIME-Version: 1.0\r\n'
  + 'Content-Type: text/html; charset=UTF-8\r\n'
  + 'Content-Transfer-Encoding: base64\r\n'
  + '\r\n'
  + bodyB64;
var raw = Buffer.from(mime, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
return { json: Object.assign({}, j, { raw: raw }) };
