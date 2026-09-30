// n8n Code node: check_flux_still
// Workflow: site_tiles_flux_gen
// Mode: Run Once for Each Item (one item per take).
// After: flux_2_max_still   Before: flux_still_to_file
//
// FLUX.2 on OpenRouter takes no size or resolution, so the only proof of pixels is the
// file header. A take smaller than the sheet's min_width x min_height is still saved
// (it is already paid for) but flagged size_ok = false, and collect_tile_takes marks it
// on the sheet so it is never dropped into the theme as if it were full size.

var res = $input.item.json;
var pick = $('pick_site_tile').item.json;
var img = (res.data || [])[0];
if (!img || !img.b64_json) {
  throw new Error(
    'check_flux_still: ' + pick.tile_id + ' take ' + pick.take_index + ': OpenRouter returned no image' +
      (res.error ? ': ' + JSON.stringify(res.error) : '.')
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
  return null;
}

var b64 = String(img.b64_json).replace(/^data:[^,]*,/, '');
var size = imageSize(Buffer.from(b64, 'base64'));
if (!size) {
  throw new Error('check_flux_still: could not read the image size (media_type ' + (img.media_type || 'missing') + ').');
}

return {
  json: {
    tile_id: pick.tile_id,
    take_index: pick.take_index,
    take_file_name: pick.take_file_name + '.' + size.ext,
    still_b64: b64,
    still_mime: size.mime,
    still_width: size.width,
    still_height: size.height,
    size_ok: size.width >= pick.min_width && size.height >= pick.min_height,
    still_cost_usd: res.usage && res.usage.cost !== undefined ? Number(res.usage.cost) : null,
  },
};
