#!/usr/bin/env python3
"""QA for the v2 re-render: per-type / per-volume geometry targets, pure-white background,
pixel-identical geometry within each template group, contact sheets and the vial size strip.
Usage: python3 pbv_qa_v2.py --dir out --json qa.json [--pens-sheet ..] [--vials-sheet ..] [--sizes ..]
Exit 1 on any failure."""
import argparse, hashlib, json, os, re, sys
from collections import defaultdict
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import importlib.util
spec = importlib.util.spec_from_file_location("R", os.path.join(os.path.dirname(os.path.abspath(__file__)), "pbv_rerender.py"))
R = importlib.util.module_from_spec(spec); spec.loader.exec_module(R)

TOL = 2
def targets(typ, vol=None):
    if typ == "pen":
        return dict(W=1080, H=1920, top=144, bottom=1724, cx=540)
    g = R.geom(vol)
    return dict(W=1152, H=1728, top=int(round(g["top"])), bottom=R.BOTTOM, cx=R.CX)

def geometry_signature(a):
    """Background = 255 pixels 8-connected to the canvas border; the product silhouette is its complement."""
    white = a.min(2) == 255
    lab, n = ndi.label(white, np.ones((3, 3), bool))
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, border[border > 0])
    return ~bg

def check(path, typ, vol, group):
    t = targets(typ, vol)
    im = Image.open(path)
    res = dict(file=os.path.basename(path), type=typ, volume_ml=vol, group=group, mode=im.mode,
               size=list(im.size), target_top=t["top"], target_bottom=t["bottom"], target_cx=t["cx"], fail=[])
    if im.format != "PNG": res["fail"].append("not PNG")
    if im.size != (t["W"], t["H"]): res["fail"].append(f"canvas {im.size}")
    a = np.asarray(im.convert("RGB"))
    nw = a.min(2) < 255
    ys = np.flatnonzero(nw.any(1)); xs = np.flatnonzero(nw.any(0))
    top, bot = int(ys[0]), int(ys[-1]) + 1; cx = (int(xs[0]) + int(xs[-1]) + 1) / 2
    res.update(top=top, bottom=bot, center_x=cx, width=int(xs[-1] + 1 - xs[0]),
               dtop=top - t["top"], dbottom=bot - t["bottom"], dcenter=cx - t["cx"])
    for k in ("dtop", "dbottom", "dcenter"):
        if abs(res[k]) > TOL: res["fail"].append(f"{k}={res[k]}")
    box = np.zeros_like(nw); box[t["top"] - TOL:t["bottom"] + TOL, xs[0]:xs[-1] + 1] = True
    res["non255_outside_box"] = int((nw & ~box).sum())
    keep, sil = R.product_mask(a)
    res["non255_outside_mask"] = int((nw & ~(keep | sil)).sum())
    res["border_non255"] = int(nw[0].sum() + nw[-1].sum() + nw[:, 0].sum() + nw[:, -1].sum())
    sig = geometry_signature(a)
    res["bg_all_255"] = bool((a[~sig] == 255).all())
    res["geometry_sha"] = hashlib.sha256(np.packbits(sig).tobytes()).hexdigest()[:16]
    for k in ("non255_outside_box", "non255_outside_mask", "border_non255"):
        if res[k]: res["fail"].append(f"{k}={res[k]}")
    if not res["bg_all_255"]: res["fail"].append("background not pure 255")
    return res, a

def font(sz, bold=True):
    for f in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",):
        if os.path.exists(f): return ImageFont.truetype(f, sz)
    return ImageFont.load_default()

def sheet(items, typ, out, cols):
    W, H = (1080, 1920) if typ == "pen" else (1152, 1728)
    cw = 300; ch = int(round(cw * H / W)); lab = 44; gap = 6
    rows = (len(items) + cols - 1) // cols
    S = Image.new("RGB", (cols * (cw + gap) + gap, rows * (ch + lab + gap) + gap + 40), (150, 150, 150))
    d = ImageDraw.Draw(S); f = font(17); fs = font(13)
    hdr = (f"PENS n={len(items)} canvas 1080x1920 target top=144 bottom=1724 (red ticks)" if typ == "pen" else
           f"VIALS n={len(items)} canvas 1152x1728 bottom=1472; top per volume 10mL=168 5mL=429 3mL=481 2mL=559 (red ticks)")
    d.text((gap, 10), hdr, fill=(0, 0, 0), font=f)
    for k, (res, a) in enumerate(items):
        x = gap + (k % cols) * (cw + gap); y = 40 + gap + (k // cols) * (ch + lab + gap)
        S.paste(Image.fromarray(a).resize((cw, ch), Image.LANCZOS), (x, y))
        for fy in (res["target_top"], res["target_bottom"]):
            yy = y + int(round(fy / H * ch))
            d.line([(x, yy), (x + 12, yy)], fill=(255, 0, 0), width=2); d.line([(x + cw - 12, yy), (x + cw, yy)], fill=(255, 0, 0), width=2)
        ok = not res["fail"]
        d.rectangle([x, y + ch, x + cw, y + ch + lab], fill=(255, 255, 255) if ok else (255, 200, 200))
        d.text((x + 5, y + ch + 3), res["label"][:30], fill=(0, 0, 0), font=f)
        extra = f"  {res['volume_ml']} mL" if res["volume_ml"] else f"  {res['group']}"
        d.text((x + 5, y + ch + 24), f"ID {res['ID']}{extra}" + ("" if ok else "  QA FAIL"), fill=(90, 90, 90), font=fs)
    S.save(out, quality=90)

def sizes_strip(reps, out):
    """One vial per volume class, same scale (full canvas px), common baseline, mm ruler."""
    crop_top = 130; crop_bot = 1530
    tiles = []
    for vol in (10, 5, 3, 2):
        res, a = reps[vol]
        tiles.append((vol, res, a[crop_top:crop_bot, 206:946]))
    tw = 740; lab = 150; gap = 30; ruler = 150
    Wd = ruler + len(tiles) * (tw + gap) + gap; Hd = (crop_bot - crop_top) + lab + 80
    S = Image.new("RGB", (Wd, Hd), (255, 255, 255)); d = ImageDraw.Draw(S)
    f = font(34); fs = font(24, bold=False)
    d.text((gap, 18), "Vial size classes - same master, same scale (26.08 px/mm), common baseline y=1472", fill=(0, 0, 0), font=f)
    oy = 70
    base = oy + (1472 - crop_top)
    pxmm = R.PX_PER_MM
    # ruler (mm)
    for mm in range(0, 51):
        yy = base - mm * pxmm; L = 30 if mm % 10 == 0 else (18 if mm % 5 == 0 else 9)
        d.line([(ruler - 20 - L, yy), (ruler - 20, yy)], fill=(0, 0, 0), width=2)
        if mm % 10 == 0: d.text((10, yy - 12), f"{mm} mm", fill=(0, 0, 0), font=fs)
    d.line([(ruler - 20, base), (ruler - 20, base - 50 * pxmm)], fill=(0, 0, 0), width=2)
    for i, (vol, res, t) in enumerate(tiles):
        x = ruler + gap + i * (tw + gap)
        S.paste(Image.fromarray(t), (x, oy))
        D, Hm, C = R.VOL[vol]
        yt = oy + res["top"] - crop_top
        d.line([(x, yt), (x + tw, yt)], fill=(230, 60, 60), width=2)
        d.text((x + 10, base + 14), f"{vol} mL  (ID {res['ID']})", fill=(0, 0, 0), font=f)
        d.text((x + 10, base + 58), f"body {D:g} x {Hm:g} mm, cap {C:g} mm", fill=(60, 60, 60), font=fs)
        d.text((x + 10, base + 90), f"top y={res['top']}  width {res['width']} px", fill=(60, 60, 60), font=fs)
    d.line([(ruler - 20, base), (Wd - gap, base)], fill=(230, 60, 60), width=2)
    S.save(out, quality=92)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True); ap.add_argument("--json")
    ap.add_argument("--app-only-dir", default=None, help="also check the app-only pens (<slug>.png)")
    ap.add_argument("--pens-sheet"); ap.add_argument("--vials-sheet"); ap.add_argument("--sizes")
    args = ap.parse_args()
    results = []; items = {"pen": [], "vial": []}; groups = defaultdict(list); reps = {}
    for ID, SKU, Name, Type in R.MANIFEST:
        fn = R.out_name(ID, Name); p = os.path.join(args.dir, fn)
        if Type == "pen":
            vol = None; group = "pen-" + R.PENS[ID][2]; label = R.PENS[ID][0] + " " + R.PENS[ID][1].split()[0]
        else:
            vol = R.VIALS[ID][4]; group = f"vial-{vol}mL"; label = R.VIALS[ID][0]
        if not os.path.exists(p):
            results.append(dict(file=fn, ID=ID, fail=["missing"])); continue
        res, a = check(p, Type, vol, group)
        res.update(ID=ID, Name=Name, label=label)
        if Type == "vial":   # footer volume text must agree with the assigned size class
            m = re.match(r"(\d+)m[lL]", R.VIALS[ID][3])
            res["footer_volume"] = int(m.group(1)) if m else None
            if res["footer_volume"] != vol: res["fail"].append(f"footer volume {res['footer_volume']} != {vol}")
            reps.setdefault(vol, (res, a))
        results.append(res); items[Type].append((res, a)); groups[group].append(res)
    if args.app_only_dir:
        for sl, (name, dose, fam, app_id, pname, sib) in R.APP_ONLY_PENS.items():
            p = os.path.join(args.app_only_dir, sl + ".png"); group = "pen-" + fam
            if not os.path.exists(p):
                results.append(dict(file=sl + ".png", ID=f"app{app_id}", fail=["missing"])); continue
            res, a = check(p, "pen", None, group)
            res.update(ID=f"app{app_id}", Name=pname, label=name + " " + dose.split()[0], app_only=True, dir=args.app_only_dir)
            results.append(res); items["pen"].append((res, a)); groups[group].append(res)
    # pixel-identical geometry within each template group
    gsum = {}
    for g, rs in groups.items():
        shas = sorted(set(r["geometry_sha"] for r in rs))
        gsum[g] = dict(n=len(rs), distinct_geometries=len(shas), top=sorted(set(r["top"] for r in rs)),
                       bottom=sorted(set(r["bottom"] for r in rs)), width=sorted(set(r["width"] for r in rs)))
        if len(shas) != 1:
            for r in rs: r["fail"].append(f"geometry differs within {g}")
    # all pens share the same product box
    pb = set((r["top"], r["bottom"], r["center_x"]) for r in results if r.get("type") == "pen")
    if len(pb) != 1:
        for r in results:
            if r.get("type") == "pen": r["fail"].append("pen product box differs")
    # no two products may share a byte-identical image (e.g. BPC-157 10mg vs 20mg pens)
    byhash = defaultdict(list)
    for r in results:
        p = os.path.join(r.get("dir", args.dir), r["file"]) if "file" in r else None
        if p and os.path.exists(p):
            r["sha256"] = hashlib.sha256(open(p, "rb").read()).hexdigest()
            byhash[r["sha256"]].append(r)
    dups = [[x["ID"] for x in rs] for rs in byhash.values() if len(rs) > 1]
    for rs in byhash.values():
        if len(rs) > 1:
            for r in rs: r["fail"].append("identical image shared with " + ",".join(str(x["ID"]) for x in rs if x is not r))
    # BPC-157 single-peptide set: 10/20 mg x vial/pen, each with its own image and matching dose text
    BPC = {288: ("vial", "10mg"), 193: ("vial", "20mg"), 830: ("pen", "10mg"), 614: ("pen", "20mg")}
    bpc = {}
    for r in results:
        if r["ID"] in BPC:
            t, dose = BPC[r["ID"]]
            txt = (R.PENS[r["ID"]][1] if t == "pen" else R.VIALS[r["ID"]][1])
            ok = txt.split()[0].lower() == dose and r.get("type") == t
            if not ok: r["fail"].append(f"BPC-157 expected {t} {dose}, label says {txt!r}")
            bpc[r["ID"]] = dict(type=t, dose=txt, sha256=r.get("sha256", "")[:16], ok=ok)
    nfail = sum(1 for r in results if r["fail"])
    summary = dict(total=len(results), failed=nfail, groups=gsum, pen_boxes=sorted(pb),
                   identical_image_groups=dups, bpc157=bpc)
    if args.json: json.dump(dict(summary=summary, results=results), open(args.json, "w"), indent=1, default=str)
    for r in results:
        print(f"{r['ID']:>4} {r.get('group',''):<10} top={r.get('top')} bot={r.get('bottom')} cx={r.get('center_x')} "
              f"geo={r.get('geometry_sha')} {'OK' if not r['fail'] else 'FAIL ' + '; '.join(r['fail'])}")
    print(json.dumps(summary, indent=1, default=str))
    if args.pens_sheet: sheet(items["pen"], "pen", args.pens_sheet, 8)
    if args.vials_sheet: sheet(items["vial"], "vial", args.vials_sheet, 6)
    if args.sizes: sizes_strip(reps, args.sizes)
    sys.exit(1 if nfail else 0)

if __name__ == "__main__":
    main()
