// n8n Code node: check_gpt_still
// After: gpt_image_molecule_still   Before: gpt_still_to_file
//
// OpenRouter normalizes `size` per provider, so the request alone proves nothing. This
// reads the image header and stops the run before any video spend unless the still is
// exactly the sheet's still_size. No output_format is sent, so the provider default comes
// back (PNG for OpenAI); JPEG and WebP are read too so a paid still is never thrown away
// over its container.

var res = $input.first().json;
var pick = $('pick_molecule_creation').first().json;
var img = (res.data || [])[0];
if (!img || !img.b64_json) {
  throw new Error(
    'check_gpt_still: OpenRouter returned no image' + (res.error ? ': ' + JSON.stringify(res.error) : '.')
  );
}

function imageSize(buf) {
  if (buf.length >= 24 && buf.toString('ascii', 1, 4) === 'PNG' && buf.toString('ascii', 12, 16) === 'IHDR') {
    return { mime: 'image/png', ext: 'png', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    var i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      var marker = buf[i + 1];
      if (marker === 0xff) {
        i++;
        continue;
      }
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
        i += 2;
        continue;
      }
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { mime: 'image/jpeg', ext: 'jpg', width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
    return null;
  }
  if (buf.length >= 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    var chunk = buf.toString('ascii', 12, 16);
    var webp = { mime: 'image/webp', ext: 'webp' };
    if (chunk === 'VP8X') {
      webp.width = 1 + buf.readUIntLE(24, 3);
      webp.height = 1 + buf.readUIntLE(27, 3);
    } else if (chunk === 'VP8 ') {
      webp.width = buf.readUInt16LE(26) & 0x3fff;
      webp.height = buf.readUInt16LE(28) & 0x3fff;
    } else if (chunk === 'VP8L') {
      var bits = buf.readUInt32LE(21);
      webp.width = 1 + (bits & 0x3fff);
      webp.height = 1 + ((bits >> 14) & 0x3fff);
    } else {
      return null;
    }
    return webp;
  }
  return null;
}

var b64 = String(img.b64_json).replace(/^data:[^,]*,/, '');
var size = imageSize(Buffer.from(b64, 'base64'));
if (!size) {
  throw new Error('check_gpt_still: could not read the image size (media_type ' + (img.media_type || 'missing') + ').');
}
var want = pick.still_size.split('x').map(Number);
if (size.width !== want[0] || size.height !== want[1]) {
  throw new Error(
    'check_gpt_still: got ' + size.width + 'x' + size.height + ', sheet still_size is ' + pick.still_size +
      '. Stopped before any video spend.'
  );
}

return [
  {
    json: {
      still_b64: b64,
      still_mime: size.mime,
      still_ext: size.ext,
      still_width: size.width,
      still_height: size.height,
      still_cost_usd: res.usage && res.usage.cost !== undefined ? res.usage.cost : null,
    },
  },
];
