# Creatomate background music (baked in before Buffer)

**Goal:** Final package MP4 already has music, so Buffer / IG / FB / TikTok get soundtrack with no manual edit.

**Where it happens:** Workflow B → `creatomate_render` (not Buffer, not Grok).

```text
map_creatomate_from_url → creatomate_render → … → save_creatomate_url → Buffer
```

Keep **`main_video` muted**. Music comes from a separate Creatomate **Audio** element.

---

## 1) Creatomate template (one-time)

Template: `c5d54774-b029-4786-af04-d5af345dc7f2` (`5 Facts Story`)

1. Open the template editor  
2. **Add → Audio**  
3. Rename the element exactly **`bg_music`** (lowercase, underscore)  
4. Stretch it across the **full** composition duration (same length as the reel)  
5. Optional: set a default track in the editor for testing  
6. Volume in editor ~30–40% (n8n can override)  
7. **Save** the template  

`main_video` stays **muted / volume 0%** so Grok clip noise never fights the track.

---

## 2) Host the music file

Creatomate must **fetch** the file (same rule as video):

1. Use a track you have rights to (royalty-free / licensed for social)  
2. Upload **MP3** (or WAV/M4A) to [catbox.moe](https://catbox.moe)  
3. Copy the direct URL, e.g. `https://files.catbox.moe/xxxx.mp3`

Do **not** use private Drive links, Spotify, YouTube, or preview pages.

---

## 3) `video_url_input` fields

| Field | Value |
|---|---|
| `input_video_url` | catbox `.mp4` (unchanged) |
| `music_url` | catbox `.mp3` (or leave blank to skip music) |
| `music_volume` | optional, default `35%` (e.g. `25%`, `40%`) |

Paste once and leave Fixed if you use the **same** track every day. Change only when you rotate songs.

---

## 4) Re-paste map Code

Node **`map_creatomate_from_url`** → paste latest  
`marketing/n8n-code-map-creatomate-from-url.js`

It outputs `music_url` + `music_volume` when set.

---

## 5) `creatomate_render` modifications

Keep existing `main_video` / text mods. **Add** when `music_url` is present:

```js
={{
(() => {
  const video =
    $json.input_video_url ||
    $json.public_video_url ||
    $json.catbox_video_url ||
    '';
  if (!/^https?:\/\//i.test(String(video))) {
    throw new Error('creatomate_render: missing catbox video URL');
  }
  const mods = {
    'main_video': video,
    'main_video.source': video,
    'main_video.muted': true,
    'main_video.volume': '0%',
    'main_video.loop': false,
    'Intro-Text.text': $json.mod_intro,
    'Fact-1-text.text': $json.mod_fact_1,
    'Fact-2-text.text': $json.mod_fact_2,
    'Fact-3-text.text': $json.mod_fact_3,
    'Fact-4-text.text': $json.mod_fact_4,
    'Fact-5-text.text': $json.mod_fact_5,
    'end-text-link.text': $json.end_text_link
  };
  if ($json.end_hold_url) mods['end_hold'] = $json.end_hold_url;

  // Soundtrack — element name must match template: bg_music
  if ($json.music_url) {
    mods['bg_music'] = $json.music_url;
    mods['bg_music.source'] = $json.music_url;
    mods['bg_music.volume'] = $json.music_volume || '35%';
  }

  return {
    template_id: $json.template_id || 'c5d54774-b029-4786-af04-d5af345dc7f2',
    render_scale: 1,
    modifications: mods
  };
})()
}}
```

---

## 6) Check

1. Render succeeds → open `save_creatomate_url.video_url`  
2. Play with sound — music under the reel, no Grok clip audio  
3. Buffer posts that **same** Creatomate URL (already wired)

---

## Optional later

- Rotate tracks via a Sheet column (`music_url`) + pick node  
- Different volumes per platform (usually unnecessary — one bake-in is enough)

---

## Licensing note

Buffer/IG/FB/TikTok do **not** add Instagram’s commercial music library for you.  
Use tracks you’re allowed to use in ads / brand posts.
