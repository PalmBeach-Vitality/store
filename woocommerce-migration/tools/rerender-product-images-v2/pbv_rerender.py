#!/usr/bin/env python3
"""
PalmBeach Vitality product-image re-render (v2): every pen is rebuilt on ONE master pen
(829 Cagrilintide 10mg Pen; blue collar/knob from 828 Retatrutide 48mg Pen for the
Semaglutide/Tirzepatide/Retatrutide family) and every vial on ONE master vial (825 KPV 10mg Vial),
with physically sized vials per volume class (10/5/3/2 mL, taken from each product's fill volume).
Only the label text differs per product (plus the blue liquid fill of the GLOW vial, ID 293); the text is
typeset (not generated) from the LABEL TABLE below: names from the product labels (with approved spelling
corrections), dose from the owner's product sheet, fill volume / concentration from the peptide protocol
app catalog (store descriptions where the app has no entry); see the comments at the LABEL TABLE.
Deterministic. Requires Python 3.10+, Pillow==12.3.0, numpy==2.2.4, scipy==1.18.1 and network
access to the public source URLs in SOURCES (checked by SHA256).

Usage:
  python3 pbv_rerender.py --out woocommerce-migration/data/standardized-product-images \
     --csv woocommerce-migration/data/standardized-product-images.csv \
     --raw-base https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/all-product-white-backgrounds-3232/woocommerce-migration/data/standardized-product-images
"""
import argparse, csv, json, os, re, sys
import numpy as np
from PIL import Image, ImageFont, ImageDraw
from scipy import ndimage as ndi

def slug(s):
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s.lower())).strip("-")

def out_name(ID, Name):
    return f"{ID}-{slug(Name)}.png"

# ================= product mask (identical to v1 pbv_standardize.py) =================


CORE_T = 230          # min(R,G,B) < CORE_T  => definite product pixel
BIG_COMP = 200        # core components >= this many px seed the product cluster
CLUSTER_MARGIN = 30   # px; small core bits within this margin of the cluster are kept
GLASS_T = 244         # min(R,G,B) < GLASS_T and connected to core => faint glass/highlight
BASE_CLAMP_MARGIN = 0.005  # fraction of product height
SHADOW_WING = 0.05    # base zone wider than body by > this fraction of product height => contact-shadow wings
                      # (measured: real vial/pen bases overhang <= 0.039, live-site shadows >= 0.062)
BASE_ZONE = 0.85      # rows below this fraction of product height = base zone
GRAD_T = 16           # min-channel central-difference edge threshold used in the base zone when a shadow is present
GLASS_BRIDGE = 2      # px; faint glass fragments this close to each other/the core are joined
CLOSE_FRAC = 0.04     # vertical closing length (fraction of src height) bridges faint glass bands
EDGE_DILATE = 3       # px; keep antialiased/faint pixels this close to the product silhouette
OUT_DILATE = 1        # px; output-space dilation of the resampled mask
S8 = np.ones((3, 3), bool)

def product_mask(a):
    """a: HxWx3 uint8. Returns bool mask of pixels that belong to the product
    (incl. faint glass, caps, highlights, soft edges)."""
    H, W, _ = a.shape
    m = a.min(axis=2)
    core = m < CORE_T
    lab, n = ndi.label(core, S8)
    if n == 0:
        raise RuntimeError("no product detected")
    sizes = np.bincount(lab.ravel())
    big = [i for i in range(1, n + 1) if sizes[i] >= BIG_COMP] or [int(np.argmax(sizes[1:]) + 1)]
    objs = ndi.find_objects(lab)
    y0 = min(objs[i - 1][0].start for i in big) - CLUSTER_MARGIN
    y1 = max(objs[i - 1][0].stop for i in big) + CLUSTER_MARGIN
    x0 = min(objs[i - 1][1].start for i in big) - CLUSTER_MARGIN
    x1 = max(objs[i - 1][1].stop for i in big) + CLUSTER_MARGIN
    keep_ids = np.zeros(n + 1, bool)
    for i in range(1, n + 1):
        sl = objs[i - 1]
        if sl[0].stop > y0 and sl[0].start < y1 and sl[1].stop > x0 and sl[1].start < x1:
            keep_ids[i] = True
    core = keep_ids[lab]
    # faint glass / highlight pixels connected to the product
    g0 = ndi.binary_closing(m < GLASS_T, structure=S8, iterations=GLASS_BRIDGE) | core
    glab, gn = ndi.label(g0, S8)
    seed = ndi.binary_dilation(core, structure=S8, iterations=GLASS_BRIDGE)
    gid = np.unique(glab[seed]); gid = gid[gid > 0]
    glass = np.isin(glab, gid)
    crow = np.flatnonzero(core.any(1))
    top = int(np.flatnonzero(glass.any(1))[0])   # faint tips above the core are product
    bot = int(crow[-1])                          # below the last core row = reflection / floor
    h = bot - top
    # body width (rows 45-85% of product height); the base rows may not be wider
    # than the body -> removes contact-shadow "wings" beside the base
    body = glass[top + int(0.45 * h): top + int(0.85 * h)]
    bx = np.flatnonzero(body.any(0))
    marg = int(round(BASE_CLAMP_MARGIN * h))
    base = glass[top + int(BASE_ZONE * h): bot + 1]
    ex = np.flatnonzero(base.any(0))
    wing = int(round(SHADOW_WING * h))
    # clamp a side only if the base zone sticks out far beyond the body (= contact shadow)
    xl = int(bx[0]) - marg if ex[0] < bx[0] - wing else 0
    xr = int(bx[-1]) + marg if ex[-1] > bx[-1] + wing else W - 1
    shadow = xl > 0 or xr < W - 1
    z0 = top + int(BASE_ZONE * h)
    if shadow:
        # contact shadow present: inside the base zone only pixels with real edge
        # structure (glass rim, knob) count as product; the smooth shadow gradient does not
        mf = m.astype(np.float32)
        g = np.zeros_like(mf)
        g[1:-1] = np.abs(mf[2:] - mf[:-2])
        g[:, 1:-1] = np.maximum(g[:, 1:-1], np.abs(mf[:, 2:] - mf[:, :-2]))
        zone = glass[z0:bot + 1] & (g[z0:bot + 1] > GRAD_T)
        zone[:, :max(xl, 0)] = False; zone[:, xr + 1:] = False
        glass = glass.copy(); glass[z0:bot + 1] = zone
        zr = np.flatnonzero(zone.any(1))
        bot = z0 + int(zr[-1])
        # per-column lowest edge pixel -> follows the curved rim instead of a flat cut
        has = zone.any(0)
        colbot = np.where(has, z0 + zone.shape[0] - 1 - np.argmax(zone[::-1], axis=0), -1)
        colbot = ndi.median_filter(colbot, size=7, mode="nearest")
    sil = np.zeros_like(core)
    for y in range(top, bot + 1):
        xs = np.flatnonzero(glass[y])
        if xs.size == 0:
            continue
        a0, a1 = int(xs[0]), int(xs[-1])
        if y >= z0:
            a0, a1 = max(a0, xl), min(a1, xr)
        if a1 >= a0:
            sil[y, a0:a1 + 1] = True
            if shadow and y >= z0:
                sil[y, a0:a1 + 1] &= colbot[a0:a1 + 1] >= y
    k = max(3, int(round(CLOSE_FRAC * H)) | 1)
    sil = ndi.binary_closing(np.pad(sil, ((k, k), (0, 0))), structure=np.ones((k, 1), bool))[k:-k]
    sil = ndi.binary_fill_holes(sil)
    near = ndi.binary_dilation(sil, structure=S8, iterations=EDGE_DILATE)
    if shadow:  # tight edge next to the shadow so no grey fringe survives
        near[z0:] = ndi.binary_dilation(sil, structure=S8, iterations=1)[z0:]
    return near & (m < 255), sil

def bbox(mask):
    ys = np.flatnonzero(mask.any(1)); xs = np.flatnonzero(mask.any(0))
    return int(xs[0]), int(ys[0]), int(xs[-1]) + 1, int(ys[-1]) + 1  # x0,y0,x1,y1 (exclusive)



# ================= labels =================

# ---------------- label table --------------------------------------------------------------------
# Name text: transcribed from each product's own label, with the owner-approved spelling corrections:
#   167 Terzepatide->Tirzepatide, 299 Semorelin->Sermorelin, 114 Melonotan->Melanotan,
#   289 Cagrilinitide->Cagrilintide, 153 5-Amino-MQ->5-Amino-1MQ, pens 197/199/201/203/204/828 Retartutide->Retatrutide.
# Dose: the owner's product sheet (PBV_full_product_list_09-15-2026) Product Name wherever it gives a dose,
#   otherwise the product's Store API description (https://palmbeach-vitality.store/wp-json/wc/store/v1/
#   products/<id>, fetched 2026-09-25); every sheet dose agrees with its description. Blends show the split.
# Fill volume / concentration: the peptide protocol app catalog (PalmBeach-Vitality/peptide_protocol_app,
#   src/data/catalog.ts @ main 2026-09-25) wherever it covers the product, else the description. Exception:
#   193 BPC-157 20mg Vial, where the app says 20 mL / 1 mg/mL (no 20 mL vial size fits the canvas), keeps the
#   description's 10 mL / 2 mg/mL. The vial size class follows the fill volume. Units/capitalisation keep each
#   label's existing style. All label-text changes vs the original labels are listed in dosage-changes.csv.
# pens: ID: (name, dose line, family)      family "blue" = Semaglutide/Tirzepatide/Retatrutide pens
PENS = {
    123: ("KLOW", "10/10/10/50mg 3ml Pen", "red"),
    125: ("MOTS-C", "20mg 3ml", "red"),
    129: ("PT-141", "10mg 3ml", "red"),
    131: ("SEMAX", "20mg 3ml", "red"),
    133: ("Selank", "20mg 3ml", "red"),
    135: ("Sermorelin", "10mg 3ml", "red"),
    137: ("TA-1", "10mg 3ml", "red"),
    139: ("Tesamorelin", "10mg 3ml", "red"),
    141: ("Tesamorelin", "30mg 3ml", "red"),
    143: ("Tesamorelin/Ipamorelin", "12/3mg 3ml Pen", "red"),
    145: ("BPC-157/TB-500", "10/10mg 3ml", "red"),
    147: ("CJC/Ipamorelin", "10/10mg 3ml", "red"),
    149: ("DSIP", "5mg 3ml", "red"),
    151: ("GHK-Cu", "50mg 3ml", "red"),
    153: ("5-Amino-1MQ", "50mg 3ml", "red"),
    155: ("GLOW", "10/10/50mg 3ml Pen", "red"),
    157: ("SS-31", "50mg 3ml", "red"),
    159: ("KPV", "10mg 3ml", "red"),
    169: ("Semaglutide", "1.5mg 0.6ml pen", "blue"),
    171: ("Semaglutide", "3.5mg 0.7ml pen", "blue"),
    173: ("Semaglutide", "5.5mg 1.1ml pen", "blue"),
    175: ("Semaglutide", "7.5mg 1.5ml pen", "blue"),
    177: ("Semaglutide", "10mg 2ml pen", "blue"),
    179: ("Semaglutide", "15mg 3ml pen", "blue"),
    181: ("Tirzepatide", "10mg 0.5ml pen", "blue"),
    183: ("Tirzepatide", "20mg 1ml pen", "blue"),
    185: ("Tirzepatide", "30mg 1.5ml pen", "blue"),
    187: ("Tirzepatide", "40mg 2ml pen", "blue"),
    191: ("Tirzepatide", "60mg 3ml pen", "blue"),
    195: ("Tirzepatide", "50mg 2.5ml pen", "blue"),
    197: ("Retatrutide", "8mg 0.4ml pen", "blue"),
    199: ("Retatrutide", "16mg 0.8ml pen", "blue"),
    201: ("Retatrutide", "24mg 1.2ml pen", "blue"),
    203: ("Retatrutide", "32mg 1.6ml pen", "blue"),
    204: ("Retatrutide", "40mg 2ml pen", "blue"),
    208: ("NAD+", "500mg 3ml", "red"),
    614: ("BPC-157", "20mg 3ml", "red"),
    828: ("Retatrutide", "48mg 2.4ml pen", "blue"),
    829: ("Cagrilintide", "10mg 3ml", "red"),
    830: ("BPC-157", "10mg 3ml", "red"),
    831: ("TB-500", "10mg 3ml", "red"),
    832: ("NAD+", "1000mg 3ml", "red"),
    833: ("NAD+", "1600mg 3ml", "red"),
    834: ("Epithalon", "60mg 3ml", "red"),
    835: ("CJC-1295", "10mg 3ml", "red"),
    836: ("Ipamorelin", "30mg 3ml", "red"),
    837: ("IGF-LR3", "1mg 3ml", "red"),
    838: ("Kisspeptin", "5mg 3ml", "red"),
    839: ("Dihexa", "10mg 3ml", "red"),
    840: ("Melanotan II", "10mg 3ml", "red"),
    841: ("Glutathione", "600mg 3ml", "red"),
    842: ("MOTS-C", "40mg 3ml", "red"),
}

# App-only pen strengths (peptide protocol app catalog ids 901-908; no store product exists as of 2026-09-25,
# Store API search/slug lookups empty, /product/<slug>/ redirects to /shop/). Rendered to <slug>.png only
# with --app-only-out; never written to the store CSV. Name/dose styling from the sibling pen, fill from the app.
# slug: (name, dose line, family, app id, product name, sibling store ID)
APP_ONLY_PENS = {
    "ss-31-100mg-pen": ("SS-31", "100mg 3ml", "red", 906, "SS-31 100mg Pen", 157),
    "ss-31-150mg-pen": ("SS-31", "150mg 3ml", "red", 907, "SS-31 150mg Pen", 157),
    "cagrilintide-20mg-pen": ("Cagrilintide", "20mg 3ml", "red", 901, "Cagrilintide 20mg Pen", 829),
    "ghk-cu-100mg-pen": ("GHK-Cu", "100mg 3ml", "red", 904, "GHK-Cu 100mg Pen", 151),
    "cjc-ipamorelin-20-20mg-pen": ("CJC/Ipamorelin", "20/20mg 3ml", "red", 902, "CJC/Ipamorelin 20/20mg Pen", 147),
    "tesamorelin-ipamorelin-36-9mg-pen": ("Tesamorelin/Ipamorelin", "36/9mg 3ml Pen", "red", 908, "Tesamorelin/Ipamorelin 36/9mg Pen", 143),
}

# vials: ID: (name, dose (bar), concentration, footer, volume mL)
VIALS = {
    108: ("TA-1", "10mg", "1mg/1ml", "10ml Sterile Multi-Use Vial", 10),
    111: ("AOD-9604", "10mg", "1mg/ml", "10ml Sterile Multi-Use Vial", 10),
    114: ("Melanotan 2", "10MG", "1mg/ml", "10ml Sterile Multi-Use Vial", 10),
    117: ("Retatrutide", "60mg", "6mg/ml", "10ml Sterile Multi-Use Vial", 10),
    119: ("Tirzepatide", "100mg", "10mg/ml", "10ml Sterile Multi-Use Vial", 10),
    121: ("Semaglutide", "25mg", "2.5mg/ml", "10ml Sterile Multi-Dose Vial", 10),
    161: ("Semaglutide", "50mg", "5mg/ml", "10ml Sterile Multi-Use Vial", 10),
    163: ("Retatrutide", "100mg", "10mg/ml", "10ml Sterile Multi-Use Vial", 10),
    165: ("Retatrutide", "200mg", "20mg/ml", "10ml Sterile Multi-Use Vial", 10),
    167: ("Tirzepatide", "200mg", "20mg/ml", "10mL Sterile Multi-Dose Vial", 10),
    189: ("NAD+", "1000mg", "100mg/ml", "10ml Sterile Multi-Dose Vial", 10),
    193: ("BPC-157", "20mg", "2mg/ml", "10ml Sterile Multi-Dose Vial", 10),
    206: ("NAD+", "500mg", "50mg/mL", "10ml Sterile Multi-Use Vial", 10),
    288: ("BPC-157", "10mg", "1mg/ml", "10ml Sterile Multi-Dose Vial", 10),
    289: ("Cagrilintide", "25mg", "5mg/ml", "5ml Sterile Multi-Dose Vial", 5),
    290: ("CJC", "10mg", "1mg/ml", "10ml Sterile Multi-Dose Vial", 10),
    291: ("CJC/Ipamorelin", "10mg/10mg", "1mg/1ml / 1mg/1ml", "10ml Sterile Multi-Use Vial", 10),
    292: ("GHK-Cu", "50mg", "5mg/ml", "10ml Sterile Multi-Use Vial", 10),
    293: ("GLOW", "10/10/50mg", "1/1/5mg/ml", "10ml Sterile Multi-Use Vial", 10),
    294: ("KLOW", "10/10/10/50mg", "1/1/1/5mg/ml", "10ml Sterile Multi-Use Vial", 10),
    295: ("MOTS-C", "25mg", "5mg/mL", "5ml Sterile Multi-Use Vial", 5),
    296: ("PT-141", "20mg", "2mg/ml", "10mL Sterile Multi-Dose Vial", 10),
    297: ("Selank", "10mg", "1mg/ml", "10mL Sterile Multi-Dose Vial", 10),
    298: ("Semax", "10MG", "1mg/mL", "10mL Sterile Multi-Dose Vial", 10),
    299: ("Sermorelin", "10mg", "1mg/ml", "10mL Sterile Multi-Dose Vial", 10),
    300: ("SS-31", "10mg", "1mg/ml", "10ml Sterile Multi-Dose Vial", 10),
    301: ("TB-500", "10mg", "1mg/ml", "10mL Sterile Multi-Dose Vial", 10),
    302: ("Tesamorelin", "30mg", "3mg/ml", "10ml Sterile Multi-Dose Vial", 10),
    303: ("BPC-157/TB-500", "10mg/10mg", "1mg/ml / 1mg/ml", "10mL Sterile Multi-Dose Vial", 10),
    821: ("Retatrutide", "20mg", "10 mg/mL", "2ml Sterile Multi-Use Vial", 2),
    822: ("Retatrutide", "30mg", "15 mg/mL", "2ml Sterile Multi-Use Vial", 2),
    823: ("Retatrutide", "50mg", "16.67 mg/mL", "3ml Sterile Multi-Use Vial", 3),
    824: ("Tirzepatide", "50mg", "10 mg/mL", "5ml Sterile Multi-Use Vial", 5),
    825: ("KPV", "10mg", "1mg/ml", "10mL Sterile Multi-Dose Vial", 10),
    826: ("Ipamorelin", "10mg", "1mg/ml", "10mL Sterile Multi-Dose Vial", 10),
    827: ("Tesamorelin / Ipamorelin", "12mg / 3mg", "1.2mg/ml / 0.3mg/ml", "10ml Sterile Multi-Use Vial", 10),
}

# vials that show liquid through the glass (all others are rendered empty)
LIQUID = {293: "ghk_blue"}   # GLOW vial: copper-peptide blue fill



MANIFEST = [
    (108, 'PBV-TA-1', 'TA-1 Vial', 'vial'),
    (111, 'PBV-AOD-9604', 'AOD-9604 Vial', 'vial'),
    (114, 'PBV-MELANOTAN-II', 'Melanotan II Vial', 'vial'),
    (117, 'PBV-RETATRUTIDE', 'Retatrutide 60mg', 'vial'),
    (119, 'PBV-TIRZEPATIDE', 'Tirzepatide 100mg', 'vial'),
    (121, 'PBV-SEMAGLUTIDE', 'Semaglutide 25mg', 'vial'),
    (123, 'PBV-KLOW-PEN', 'KLOW Pen', 'pen'),
    (125, 'PBV-MOTS-C', 'MOTS-C 20mg Pen', 'pen'),
    (129, 'PBV-PT-141-PEN', 'PT-141 Pen', 'pen'),
    (131, 'PBV-SEMAX-PEN', 'Semax Pen', 'pen'),
    (133, 'PBV-SELANK-PEN', 'Selank Pen', 'pen'),
    (135, 'PBV-SERMORELIN-PEN', 'Sermorelin Pen', 'pen'),
    (137, 'PBV-TA-2', 'TA-1 Pen', 'pen'),
    (139, 'PBV-TESAMORELIN-10MG-PEN', 'Tesamorelin 10mg Pen', 'pen'),
    (141, 'PBV-TESAMORELIN-30MG-PEN', 'Tesamorelin 30mg Pen', 'pen'),
    (143, 'PBV-TESAMORELIN-IPAMORELIN-PEN', 'Tesamorelin/Ipamorelin Pen', 'pen'),
    (145, 'PBV-WOLVERINE-PEN', 'Wolverine Pen', 'pen'),
    (147, 'PBV-CJC-IPAMORELIN-1', 'CJC/Ipamorelin Pen', 'pen'),
    (149, 'PBV-DSIP-PEN', 'DSIP Pen', 'pen'),
    (151, 'PBV-GHK-CU-PEN', 'GHK-Cu Pen', 'pen'),
    (153, 'PBV-5-AMINO-1MQ-PEN', '5-Amino-1MQ Pen', 'pen'),
    (155, 'PBV-GLOW-PEN', 'GLOW Pen', 'pen'),
    (157, 'PBV-SS-31-PEN', 'SS-31 Pen', 'pen'),
    (159, 'PBV-KPV', 'KPV Pen', 'pen'),
    (161, 'PBV-SEMAGLUTIDE-50MG', 'Semaglutide 50mg', 'vial'),
    (163, 'PBV-RETATRUTIDE-100MG', 'Retatrutide 100mg', 'vial'),
    (165, 'PBV-RETATRUTIDE-200MG', 'Retatrutide 200mg', 'vial'),
    (167, 'PBV-TIRZEPATIDE-200MG', 'Tirzepatide 200mg', 'vial'),
    (169, 'PBV-SEMAGLUTIDE-1-5MG-PEN', 'Semaglutide 1.5mg Pen', 'pen'),
    (171, 'PBV-SEMAGLUTIDE-3-5MG-PEN', 'Semaglutide 3.5mg Pen', 'pen'),
    (173, 'PBV-SEMAGLUTIDE-5-5MG-PEN', 'Semaglutide 5.5mg Pen', 'pen'),
    (175, 'PBV-SEMAGLUTIDE-7-5MG-PEN', 'Semaglutide 7.5mg Pen', 'pen'),
    (177, 'PBV-SEMAGLUTIDE-10MG-PEN', 'Semaglutide 10mg Pen', 'pen'),
    (179, 'PBV-SEMAGLUTIDE-15MG-PEN', 'Semaglutide 15mg Pen', 'pen'),
    (181, 'PBV-TIRZEPATIDE-10MG-PEN', 'Tirzepatide 10mg Pen', 'pen'),
    (183, 'PBV-TIRZEPATIDE-20MG-PEN', 'Tirzepatide 20mg Pen', 'pen'),
    (185, 'PBV-TIRZEPATIDE-30MG-PEN', 'Tirzepatide 30mg Pen', 'pen'),
    (187, 'PBV-TIRZEPATIDE-40MG-PEN', 'Tirzepatide 40mg Pen', 'pen'),
    (189, 'PBV-NAD-1', 'NAD+ 1000mg Vial', 'vial'),
    (191, 'PBV-TIRZEPATIDE-60MG-PEN', 'Tirzepatide 60mg Pen', 'pen'),
    (193, 'PBV-BPC-157-20MG', 'BPC-157 20mg Vial', 'vial'),
    (195, 'PBV-TIRZEPATIDE-50MG-PEN', 'Tirzepatide 50mg Pen', 'pen'),
    (197, 'PBV-RETATRUTIDE-8MG-PEN', 'Retatrutide 8mg Pen', 'pen'),
    (199, 'PBV-RETATRUTIDE-16MG-PEN', 'Retatrutide 16mg Pen', 'pen'),
    (201, 'PBV-RETATRUTIDE-24MG-PEN', 'Retatrutide 24mg Pen', 'pen'),
    (203, 'PBV-RETATRUTIDE-32MG-PEN', 'Retatrutide 32mg Pen', 'pen'),
    (204, 'PBV-RETATRUTIDE-40MG-PEN', 'Retatrutide 40mg Pen', 'pen'),
    (206, 'PBV-NAD-500MG', 'NAD+ 500mg Vial', 'vial'),
    (208, 'PBV-NAD-PEN-500MG', 'NAD+ Pen 500mg', 'pen'),
    (288, 'PBV-BPC-157-10MG', 'BPC-157 10mg Vial', 'vial'),
    (289, 'PBV-CAGRILINTIDE', 'Cagrilintide Vial', 'vial'),
    (290, 'PBV-CJC-VIAL', 'CJC 10mg Vial', 'vial'),
    (291, 'PBV-CJC-IPAMORELIN-VIAL', 'CJC/Ipamorelin Vial', 'vial'),
    (292, 'PBV-GHK-CU-VIAL', 'GHK-Cu Vial', 'vial'),
    (293, 'PBV-GLOW-VIAL', 'GLOW Vial', 'vial'),
    (294, 'PBV-KLOW-VIAL', 'KLOW Vial', 'vial'),
    (295, 'PBV-MOTS-C-VIAL', 'MOTS-C 25mg Vial', 'vial'),
    (296, 'PBV-PT-141-VIAL', 'PT-141 Vial', 'vial'),
    (297, 'PBV-SELANK-VIAL', 'Selank Vial', 'vial'),
    (298, 'PBV-SEMAX-VIAL', 'Semax 10mg Vial', 'vial'),
    (299, 'PBV-SERMORELIN-VIAL', 'Sermorelin 10mg Vial', 'vial'),
    (300, 'PBV-SS-31-VIAL', 'SS-31 Vial', 'vial'),
    (301, 'PBV-TB-500-VIAL', 'TB-500 Vial', 'vial'),
    (302, 'PBV-TESAMORELIN-VIAL', 'Tesamorelin Vial', 'vial'),
    (303, 'PBV-WOLVERINE-VIAL', 'Wolverine Vial', 'vial'),
    (614, '', 'BPC-157 20mg Pen', 'pen'),
    (821, 'RETATRUTIDE_20MG_VIAL', 'Retatrutide 20mg Vial', 'vial'),
    (822, 'RETATRUTIDE_30MG_VIAL', 'Retatrutide 30mg Vial', 'vial'),
    (823, 'RETATRUTIDE_50MG_VIAL', 'Retatrutide 50mg Vial', 'vial'),
    (824, 'TIRZEPATIDE_50MG_VIAL', 'Tirzepatide 50mg Vial', 'vial'),
    (825, 'KPV_10MG_VIAL', 'KPV 10mg Vial', 'vial'),
    (826, 'IPAMORELIN_10MG_VIAL', 'Ipamorelin 10mg Vial', 'vial'),
    (827, 'TESAMORELIN_IPAMORELIN_VIAL', 'Tesamorelin / Ipamorelin 12mg/3mg Vial', 'vial'),
    (828, 'RETATRUTIDE_48MG_PEN', 'Retatrutide 48mg Pen', 'pen'),
    (829, 'CAGRILINTIDE_10MG_PEN', 'Cagrilintide 10mg Pen', 'pen'),
    (830, 'BPC_157_10MG_PEN', 'BPC-157 10mg Pen', 'pen'),
    (831, 'TB_500_10MG_PEN', 'TB-500 10mg Pen', 'pen'),
    (832, 'NAD_1000MG_PEN', 'NAD+ 1000mg Pen', 'pen'),
    (833, 'NAD_1600MG_PEN', 'NAD+ 1600mg Pen', 'pen'),
    (834, 'EPITHALON_50MG_PEN', 'Epithalon 50mg Pen', 'pen'),
    (835, 'CJC_1295_10MG_PEN', 'CJC-1295 10mg Pen', 'pen'),
    (836, 'IPAMORELIN_30MG_PEN', 'Ipamorelin 30mg Pen', 'pen'),
    (837, 'IGF_LR3_1MG_PEN', 'IGF-LR3 1mg Pen', 'pen'),
    (838, 'KISSPEPTIN_10MG_PEN', 'Kisspeptin 10mg Pen', 'pen'),
    (839, 'DIHEXA_10MG_PEN', 'Dihexa 10mg Pen', 'pen'),
    (840, 'MELANOTAN_II_10MG_PEN', 'Melanotan II 10mg Pen', 'pen'),
    (841, 'GLUTATHIONE_600MG_PEN', 'Glutathione 600mg Pen', 'pen'),
    (842, 'MOTS_C_40MG_PEN', 'MOTS-C 40mg Pen', 'pen'),
]


# ================= vial master =================

"""Vial master construction + per-volume rendering (imported by pbv_rerender.py)."""

# ---------------- master (825 KPV 10mg vial, 1664x2496 PNG) measurements -----------
M_KEEP_Y0, M_KEEP_Y1 = 242, 2102        # product rows (exclusive end) from product_mask
M_CX = 841.0                            # product centre x (keep bbox 469..1213)
M_CAP_W, M_BODY_W = 694.0, 738.0        # silhouette widths: crimp cap, body
SEG_NECK_END = 770.0                    # rows < this scale with the cap diameter
SEG_SHOULDER_END = 980.0                # rows >= this scale with the body diameter
LABEL_Y0, LABEL_Y1 = 957, 1946          # label band (centre column)
LABEL_X0, LABEL_X1 = 472, 1209
LABEL_CX = 840.5
STRIP_TOP = (975, 1000); STRIP_BOT = (1882, 1906)
FILL_X = (496, 1186)
LOGO_BOX = (755, 1000, 945, 1336)       # x0,y0,x1,y1
BAR_BOX = (538, 1508, 1149, 1673)
BAR_IN = (545, 1514, 1142, 1665)
# master text ink boxes (x0,y0,x1,y1 incl.) and the reference strings they contain
REF = {
    "name": ("KPV", "B", (692, 1365, 1002, 1489)),
    "dose": ("10mg", "B", (707, 1545, 984, 1658)),
    "conc": ("1mg/ml", "R", (721, 1707, 972, 1800)),
    "foot": ("10mL Sterile Multi-Dose Vial", "R", (536, 1812, 1145, 1875)),
}
INK = {"name": (87, 1, 1), "dose": (253, 253, 253), "conc": (4, 4, 4), "foot": (6, 6, 6)}

# ---------------- physical volume classes -----------------------------------------
# (body diameter mm, total height mm, crimp-cap diameter mm) - typical crimp-top serum vials
VOL = {10: (24.0, 50.0, 20.0), 5: (22.0, 40.0, 20.0), 3: (17.0, 38.0, 13.0), 2: (16.0, 35.0, 13.0)}
CANVAS = (1152, 1728); BOTTOM = 1472; TOP10 = 168; CX = 576
PX_PER_MM = (BOTTOM - TOP10) / VOL[10][1]           # 26.08 px/mm on the output canvas
SS = 2                                               # supersampling factor

def geom(v):
    D, Hmm, C = VOL[v]
    D10, H10, C10 = VOL[10]
    w, c = D / D10, C / C10
    S = (BOTTOM - TOP10) / (M_KEEP_Y1 - M_KEEP_Y0)     # vertical px per master row (10 mL)
    sx_cap = C10 * PX_PER_MM / M_CAP_W                  # horizontal px per master px (10 mL)
    sx_body = D10 * PX_PER_MM / M_BODY_W
    Htot = float(round(Hmm * PX_PER_MM))           # integer-pixel height per volume class
    h_top = (SEG_NECK_END - M_KEEP_Y0) * S * c
    h_sh = (SEG_SHOULDER_END - SEG_NECK_END) * S * (c + w) / 2
    h_body = Htot - h_top - h_sh
    vb = h_body / ((M_KEEP_Y1 - SEG_SHOULDER_END) * S)
    # output-row knots (1x) <-> master-row knots
    top = BOTTOM - Htot
    ko = np.array([top, top + h_top, top + h_top + h_sh, BOTTOM])
    km = np.array([M_KEEP_Y0, SEG_NECK_END, SEG_SHOULDER_END, M_KEEP_Y1], float)
    k = min(w, vb)                                      # uniform label-content scale vs 10 mL
    return dict(v=v, w=w, c=c, S=S, sx_cap=sx_cap * c, sx_body=sx_body * w, top=top,
                ko=ko, km=km, vb=vb, k=k, content_scale=S * k,
                label_w=(LABEL_X1 - LABEL_X0 + 1) * sx_body * w)

def out_to_master_y(g, yo):
    return np.interp(yo, g["ko"], g["km"])

def master_to_out_y(g, ym):
    return np.interp(ym, g["km"], g["ko"])

def sx_of(g, ym):
    t = np.clip((ym - SEG_NECK_END) / (SEG_SHOULDER_END - SEG_NECK_END), 0, 1)
    t = t * t * (3 - 2 * t)
    return g["sx_cap"] * (1 - t) + g["sx_body"] * t

def remap(g, img_f, mask_f):
    """img_f HxWx3 float (white bg), mask_f HxW float. Returns SS-res canvas arrays."""
    W, H = CANVAS[0] * SS, CANVAS[1] * SS
    yo = (np.arange(H) + 0.5) / SS
    ym = out_to_master_y(g, yo)
    sx = sx_of(g, ym)
    xo = (np.arange(W) + 0.5) / SS
    XM = M_CX + (xo[None, :] - CX) / sx[:, None]
    YM = np.repeat(ym[:, None], W, 1)
    inside = (yo >= g["top"] - 2) & (yo <= BOTTOM + 2)
    coords = np.array([YM - 0.5, XM - 0.5])
    out = np.empty((H, W, 3), np.float32)
    for ch in range(3):
        out[..., ch] = ndi.map_coordinates(img_f[..., ch], coords, order=3, mode="constant", cval=255.0)
    msk = ndi.map_coordinates(mask_f, coords, order=1, mode="constant", cval=0.0)
    out[~inside] = 255; msk[~inside] = 0
    return np.clip(out, 0, 255), msk

# ---------------- master preparation ---------------------------------------------------
def _isolate(r, thr=0.05, grow=5, blur=2.0):
    """Normalise a ratio layer to its box border (label paper = 1.0) and fade everything that is
    not artwork back to exactly 1.0, so no rectangular box edge is carried into the new label."""
    b = 6
    border = np.concatenate([r[:b].reshape(-1, 3), r[-b:].reshape(-1, 3), r[:, :b].reshape(-1, 3), r[:, -b:].reshape(-1, 3)])
    r = r / np.median(border, 0)
    art = (np.abs(1 - r).max(2) > thr)
    art = ndi.binary_dilation(art, iterations=grow)
    w = np.clip(ndi.gaussian_filter(art.astype(np.float32), blur), 0, 1)[..., None]
    return 1 - (1 - r) * w

def prepare_master(a, product_mask):
    a = a.astype(np.uint8)
    keep, sil = product_mask(a)
    keep = keep | sil                     # filled silhouette (interior highlights may be exactly 255)
    af = a.astype(np.float32)
    clean = af.copy(); clean[~keep] = 255
    # blank label: per-column linear fit between two clean strips
    blank = clean.copy()
    t0, t1 = STRIP_TOP; b0, b1 = STRIP_BOT
    yt, yb = (t0 + t1 - 1) / 2, (b0 + b1 - 1) / 2
    top_m = af[t0:t1].mean(0); bot_m = af[b0:b1].mean(0)
    top_m = ndi.uniform_filter1d(top_m, 9, axis=0); bot_m = ndi.uniform_filter1d(bot_m, 9, axis=0)
    ys = np.arange(t0, b1)
    tt = ((ys - yt) / (yb - yt))[:, None, None]
    fill = top_m[None] * (1 - tt) + bot_m[None] * tt
    x0, x1 = FILL_X
    wx = np.ones(a.shape[1], np.float32); wx[:x0] = 0; wx[x1:] = 0
    ramp = 12
    wx[x0:x0 + ramp] = np.linspace(0, 1, ramp); wx[x1 - ramp:x1] = np.linspace(1, 0, ramp)
    wy = np.ones(len(ys), np.float32); r2 = 6
    wy[:r2] = np.linspace(0, 1, r2); wy[-r2:] = np.linspace(1, 0, r2)
    wgt = (wy[:, None] * wx[None, :])[..., None]
    blank[t0:b1] = clean[t0:b1] * (1 - wgt) + fill * wgt
    # bar: remove the dose text, keep the bar's own shading and edges
    bx0, by0, bx1, by1 = BAR_IN
    bar = af.copy()
    colbase = af[by0 + 4:by0 + 24, bx0:bx1 + 1].mean(0)                       # per-column colour
    prof = af[by0:by1 + 1, bx0 + 12:bx0 + 150].mean(1)                         # vertical profile (text-free cols)
    prof = prof - prof[4:24].mean(0)
    synth = colbase[None] + prof[:, None]
    interior = np.zeros(a.shape[:2], bool); interior[by0 + 3:by1 - 2, bx0 + 3:bx1 - 2] = True
    bar[by0:by1 + 1, bx0:bx1 + 1] = np.where(interior[by0:by1 + 1, bx0:bx1 + 1, None],
                                             synth, af[by0:by1 + 1, bx0:bx1 + 1])
    X0, Y0, X1, Y1 = BAR_BOX
    bar_ratio = np.clip(bar[Y0:Y1, X0:X1] / np.maximum(blank[Y0:Y1, X0:X1], 1), 0, 1.15)
    X0, Y0, X1, Y1 = LOGO_BOX
    logo_ratio = np.clip(af[Y0:Y1, X0:X1] / np.maximum(blank[Y0:Y1, X0:X1], 1), 0, 1.15)
    bar_ratio = _isolate(bar_ratio); logo_ratio = _isolate(logo_ratio)
    return dict(clean=clean, blank=blank, keep=keep, sil=sil, bar_ratio=bar_ratio, logo_ratio=logo_ratio)

# ---------------- typesetting -----------------------------------------------------------
class Typesetter:
    def __init__(self, fonts):
        self.fonts = fonts   # {"B": path, "R": path}
        self.cal = {}
        for key, (txt, fk, (x0, y0, x1, y1)) in REF.items():
            f = ImageFont.truetype(fonts[fk], 1000)
            b = f.getbbox(txt, anchor="ls")
            size = (y1 - y0 + 1) / (b[3] - b[1]) * 1000
            f2 = ImageFont.truetype(fonts[fk], 1000)
            hs = (x1 - x0 + 1) / ((b[2] - b[0]) * size / 1000)
            base = y1 + 1 - b[3] * size / 1000           # baseline row (master px)
            self.cal[key] = dict(font=fk, size=size, hscale=hs, baseline=base)

    def render(self, txt, fk, size_px, hscale, ss=4):
        """Anti-aliased coverage mask (float 0..1), plus baseline offset & ink x-extent."""
        f = ImageFont.truetype(self.fonts[fk], max(1, int(round(size_px * ss))))
        b = f.getbbox(txt, anchor="ls")
        pad = 4 * ss
        Wd, Hd = b[2] - b[0] + 2 * pad, b[3] - b[1] + 2 * pad
        im = Image.new("L", (Wd, Hd), 0)
        ImageDraw.Draw(im).text((pad - b[0], pad - b[1]), txt, font=f, fill=255, anchor="ls")
        base_y = pad - b[1]                      # baseline row in im
        nw = max(1, int(round(Wd * hscale / ss))); nh = max(1, int(round(Hd / ss)))
        im = im.resize((nw, nh), Image.LANCZOS)
        cov = np.asarray(im, np.float32) / 255
        return cov, base_y / ss * (nh / (Hd / ss)), pad / ss * hscale

def composite_cov(base, cov, x0, y0, ink, mode):
    """Place coverage at integer offset; mode 'over' (paint ink)."""
    H, W = base.shape[:2]
    h, w = cov.shape
    xa, ya = max(0, x0), max(0, y0); xb, yb = min(W, x0 + w), min(H, y0 + h)
    if xb <= xa or yb <= ya: return
    c = cov[ya - y0:yb - y0, xa - x0:xb - x0][..., None]
    reg = base[ya:yb, xa:xb]
    ink = np.array(ink, np.float32)
    base[ya:yb, xa:xb] = reg * (1 - c) + ink * c

# ---------------- label layout (master px units; scaled by content_scale) ---------------
BUDGET = {"name": 720, "dose": 560, "conc": 700, "foot": 700}
CAP_H = 1409 / 2048          # Liberation Sans cap height / em
NAME_ZONE = (1350, 1489)      # two-line names must fit between these master rows
LOGO_SHIFT = LABEL_CX - (773 + 926) / 2
BAR_SHIFT = LABEL_CX - (545 + 1141) / 2

class VialRenderer:
    def __init__(self, master, fonts, product_mask):
        self.m = master; self.ts = Typesetter(fonts); self.pm = product_mask
        self.cache = {}

    def base(self, v, liquid=None):
        key = (v, liquid)
        if key not in self.cache:
            g = geom(v)
            src = self.m["blank"] if liquid is None else add_liquid(self.m["blank"], self.m["sil"], liquid)
            img, msk = remap(g, src, self.m["keep"].astype(np.float32))
            self.cache[key] = (g, img, msk)
        return self.cache[key]

    def _line(self, canvas, g, key, txt, center_y_m=None, size_mul=1.0, forced_size=None):
        cal = self.ts.cal[key]; cs = g["content_scale"]
        size = cal["size"] if forced_size is None else forced_size
        # fit
        f = ImageFont.truetype(self.ts.fonts[cal["font"]], 1000)
        b = f.getbbox(txt, anchor="ls")
        w_m = (b[2] - b[0]) * size / 1000 * cal["hscale"]
        fit = min(1.0, BUDGET[key] / w_m)
        size_m = size * fit * size_mul
        ref_center = cal["baseline"] - CAP_H * cal["size"] / 2 if center_y_m is None else center_y_m
        baseline_m = ref_center + CAP_H * size_m / 2
        yc_m = (LABEL_Y0 + LABEL_Y1) / 2; yc_o = master_to_out_y(g, yc_m)
        sc = cs * SS
        cov, base_off, pad_off = self.ts.render(txt, cal["font"], size_m * sc, cal["hscale"])
        ink_w = (b[2] - b[0]) * size_m * sc / 1000 * cal["hscale"]
        x_center = CX * SS
        x0 = int(round(x_center - ink_w / 2 - pad_off))
        by = (yc_o + (baseline_m - yc_m) * cs) * SS
        y0 = int(round(by - base_off))
        composite_cov(canvas, cov, x0, y0, INK[key], "over")
        return fit * size_mul, size_m

    def render(self, v, lab, liquid=None):
        g, img, msk = self.base(v, liquid)
        cv = img.copy()
        cs = g["content_scale"]; sc = cs * SS
        yc_m = (LABEL_Y0 + LABEL_Y1) / 2; yc_o = master_to_out_y(g, yc_m)
        def to_out(xm, ym):
            return ((CX + (xm - LABEL_CX) * cs) * SS, (yc_o + (ym - yc_m) * cs) * SS)
        # logo
        X0, Y0, X1, Y1 = LOGO_BOX
        lr = self.m["logo_ratio"]
        ox, oy = to_out(X0 + LOGO_SHIFT, Y0)
        lw, lh = int(round((X1 - X0) * sc)), int(round((Y1 - Y0) * sc))
        lrs = np.stack([np.asarray(Image.fromarray(lr[..., c].astype(np.float32), "F").resize((lw, lh), Image.LANCZOS)) for c in range(3)], -1)
        ox, oy = int(round(ox)), int(round(oy))
        cv[oy:oy + lh, ox:ox + lw] *= lrs
        # bar: height with content scale, width with the label width
        X0, Y0, X1, Y1 = BAR_BOX
        br = self.m["bar_ratio"]
        bw = int(round((X1 - X0) * g["label_w"] / (LABEL_X1 - LABEL_X0 + 1) * SS))
        bh = int(round((Y1 - Y0) * sc))
        brs = np.stack([np.asarray(Image.fromarray(br[..., c].astype(np.float32), "F").resize((bw, bh), Image.LANCZOS)) for c in range(3)], -1)
        _, by = to_out(0, Y0)
        bx = int(round(CX * SS - bw / 2 + BAR_SHIFT * 0)); by = int(round(by))
        cv[by:by + bh, bx:bx + bw] *= brs
        info = {}
        # name (1 or 2 lines)
        cal = self.ts.cal["name"]
        f = ImageFont.truetype(self.ts.fonts["B"], 1000); b = f.getbbox(lab["name"], anchor="ls")
        fit1 = min(1.0, BUDGET["name"] / ((b[2] - b[0]) * cal["size"] / 1000 * cal["hscale"]))
        if fit1 < 0.5 and "/" in lab["name"]:
            i = lab["name"].index("/")
            l1, l2 = lab["name"][:i + 1].strip(), lab["name"][i + 1:].strip()
            capmax = (NAME_ZONE[1] - NAME_ZONE[0]) / 2.15
            smax = capmax / CAP_H
            sizes = []
            for t in (l1, l2):
                bb = f.getbbox(t, anchor="ls")
                sizes.append(min(smax, BUDGET["name"] / ((bb[2] - bb[0]) / 1000 * cal["hscale"])))
            s2 = min(sizes); cap = CAP_H * s2
            c2 = NAME_ZONE[1] - cap / 2; c1 = c2 - 1.15 * cap
            self._line(cv, g, "name", l1, center_y_m=c1, forced_size=s2)
            self._line(cv, g, "name", l2, center_y_m=c2, forced_size=s2)
            info["name_scale"] = round(s2 / cal["size"], 3); info["name_lines"] = 2
        else:
            info["name_scale"] = round(self._line(cv, g, "name", lab["name"])[0], 3); info["name_lines"] = 1
        for key in ("dose", "conc", "foot"):
            info[key + "_scale"] = round(self._line(cv, g, key, lab[key])[0], 3)
        # to 1x
        out = np.asarray(Image.fromarray(np.clip(cv + 0.5, 0, 255).astype(np.uint8)).resize(CANVAS, Image.LANCZOS)).copy()
        m1 = np.asarray(Image.fromarray(msk.astype(np.float32), "F").resize(CANVAS, Image.BOX)) > 0.02
        m1[:int(round(g["top"]))] = False; m1[BOTTOM:] = False      # hard per-volume row limits
        out[~m1] = 255
        for _ in range(3):
            keep2, _ = self.pm(out)
            if not ((out.min(2) < 255) & ~keep2).any(): break
            out[~keep2] = 255
        info.update(volume_ml=v, liquid=liquid, top_target=round(g["top"], 2), content_scale=round(cs, 4))
        return out, info

# ---------------- optional liquid fill (master coordinates; label paper is never touched) ------------
LIQ_LEVEL = 898.0            # back rim of the liquid surface (straight body, below the shoulder curve)
LIQ_B = 11.0                 # half-height of the surface ellipse seen from slightly above
LIQ_BOTTOM = 2012.0          # inner floor (back); front edge drops by LIQ_FLOOR_B
LIQ_FLOOR_B = 26.0
WALL = 15                    # glass wall thickness (master px)
LIQUIDS = {  # target transmitted colour through the full cylinder centre on white (sRGB-ish)
    "ghk_blue": dict(centre=(50, 116, 210), surface_gain=0.35),
}

def _label_rows(x):
    u = np.clip((x - LABEL_CX) / ((LABEL_X1 - LABEL_X0 + 1) / 2), -1, 1)
    return 955.0 + 13.0 * u * u - 2, 1947.0 - 30.0 * u * u + 3

def add_liquid(blank, sil, kind):
    spec = LIQUIDS[kind]
    img = blank.copy()
    H, W, _ = img.shape
    k = -np.log(np.clip(np.array(spec["centre"], np.float32) / 250.0, 1e-3, 1))   # Beer-Lambert per channel
    ys = np.arange(H, dtype=np.float32)[:, None]; xs = np.arange(W, dtype=np.float32)[None, :]
    # interior half-width per row from the silhouette minus the wall
    rows = np.arange(int(LIQ_LEVEL - 40), int(LIQ_BOTTOM + LIQ_FLOOR_B + 4))
    y0, y1 = rows[0], rows[-1] + 1
    xl = np.array([np.flatnonzero(sil[y])[0] if sil[y].any() else M_CX for y in rows], np.float32) + WALL
    xr = np.array([np.flatnonzero(sil[y])[-1] if sil[y].any() else M_CX for y in rows], np.float32) - WALL
    cx = (xl + xr) / 2; R = np.maximum((xr - xl) / 2, 1)
    X = xs.repeat(len(rows), 0); Y = ys[y0:y1].repeat(W, 1)
    u = (X - cx[:, None]) / R[:, None]
    inside = np.clip((1 - np.abs(u)) * R[:, None] / 2.5, 0, 1)                          # soft inner wall edge
    s = np.sqrt(np.clip(1 - u * u, 0, 1))
    rise = 14.0 * np.exp(-(1 - np.clip(np.abs(u), 0, 1)) / 0.07)                      # meniscus climbs the wall
    back = LIQ_LEVEL - LIQ_B * s - rise
    front = LIQ_LEVEL + LIQ_B * s - rise
    floor = LIQ_BOTTOM + LIQ_FLOOR_B * s
    body = np.clip(Y - back + 0.5, 0, 1) * np.clip(floor - Y + 0.5, 0, 1)            # liquid column (incl. surface)
    surf = np.clip(Y - back + 0.5, 0, 1) * np.clip(front - Y + 0.5, 0, 1)            # visible top surface band
    path = 0.35 + 0.65 * s                                                            # longer path through the centre
    dens = body * (1 - surf * (1 - spec["surface_gain"])) * path * inside
    T = np.exp(-k[None, None, :] * dens[..., None])
    reg = img[y0:y1].astype(np.float32)
    # keep the glass's own specular streaks partly white (they sit on the outer surface)
    mn = reg.min(2)
    loc = ndi.uniform_filter(mn, 31)
    spec_w = np.clip((mn - loc - 4) / 14, 0, 1)[..., None] * 0.6
    tinted = reg * T
    sheen = surf * inside * (0.18 + 0.22 * np.clip((Y - back) / np.maximum(front - back, 1), 0, 1))
    tinted = tinted + (255 - tinted) * sheen[..., None]
    tinted = tinted * (1 - spec_w) + reg * spec_w
    # dark meniscus line at the front rim, faint light line at the back rim
    line = np.exp(-((Y - front) / 1.6) ** 2) * inside
    tinted *= (1 - 0.35 * line)[..., None]
    hl = np.exp(-((Y - back - 1.5) / 1.0) ** 2) * inside
    tinted = tinted + (255 - tinted) * (0.35 * hl)[..., None]
    # never touch the label paper
    lt, lb = _label_rows(xs[0])
    paper = (Y >= lt[None, :]) & (Y <= lb[None, :])
    wmask = (~paper).astype(np.float32)[..., None]
    img[y0:y1] = reg * (1 - wmask) + tinted * wmask
    return img

# ================= pen master =================

"""Pen master construction + typesetting (imported by pbv_rerender.py)."""

# master 829 Cagrilintide 10mg Pen (1584x2816 PNG)
PEN_BLANK_ROWS = (1400, 2200)             # text area blanked (logo above 1391 kept as-is)
PEN_STRIP_TOP = (1400, 1440); PEN_STRIP_BOT = (2125, 2190)
PEN_FILL_X = (684, 934)
PEN_BASE_ROW = 2304                        # collar/knob start (below lower grey band) in 829
PEN_BASE_END = 2528
PEN_BODY_X = (666, 950)                    # body silhouette columns in 829 (exclusive end)
# 828 Retatrutide 48mg Pen blue collar + knob
PEN_B828_ROWS = (2309, 2519); PEN_B828_X = (645, 952)
# text crop (pen coords) that is rotated 90 deg CCW so text is horizontal
PEN_CROP = (668, 1440, 948, 2200)          # x0,y0,x1,y1
PEN_REF = {  # rotated-space ink boxes (u0,r0,u1,r1 incl.) of the master strings
    "name": ("Cagrilintide", "Bold", (56, 57, 664, 162)),
    "dose": ("10mg 3ml", "Regular", (71, 189, 361, 244)),
}
PEN_MAX_U = 690                            # ink may not extend past this rotated column (pen row 2130)
PEN_INK = {"red": (126, 29, 29), "blue": (30, 72, 132), "dose": (32, 32, 30)}
PEN_SHADE_REF = 245.0
PEN_FONT_CAP = 700 / 1000                  # Figtree cap-height / em

def blank_label(af):
    out = af.copy()
    t0, t1 = PEN_STRIP_TOP; b0, b1 = PEN_STRIP_BOT
    top_m = ndi.uniform_filter1d(af[t0:t1].mean(0), 5, axis=0)
    bot_m = ndi.uniform_filter1d(af[b0:b1].mean(0), 5, axis=0)
    yt, yb = (t0 + t1 - 1) / 2, (b0 + b1 - 1) / 2
    y0, y1 = PEN_BLANK_ROWS
    ys = np.arange(y0, y1)
    tt = np.clip((ys - yt) / (yb - yt), 0, 1)[:, None, None]
    fill = top_m[None] * (1 - tt) + bot_m[None] * tt
    x0, x1 = PEN_FILL_X; W = af.shape[1]
    wx = np.zeros(W, np.float32); wx[x0:x1] = 1; r = 10
    wx[x0:x0 + r] = np.linspace(0, 1, r); wx[x1 - r:x1] = np.linspace(1, 0, r)
    wy = np.ones(len(ys), np.float32); r2 = 8
    wy[:r2] = np.linspace(0, 1, r2); wy[-r2:] = np.linspace(1, 0, r2)
    w = (wy[:, None] * wx[None])[..., None]
    out[y0:y1] = af[y0:y1] * (1 - w) + fill * w
    return out

def blue_variant(red_clean, clean828, keep828):
    """Replace 829's collar+knob with 828's blue collar+knob fitted to the same span."""
    out = red_clean.copy()
    out[PEN_BASE_ROW:] = 255.0
    r0, r1 = PEN_B828_ROWS; x0, x1 = PEN_B828_X
    pad = 40
    src = clean828[r0:r1, x0 - pad:x1 + pad]
    msk = keep828[r0:r1, x0 - pad:x1 + pad].astype(np.float32)
    sx = (PEN_BODY_X[1] - PEN_BODY_X[0]) / (x1 - x0); sy = (PEN_BASE_END - PEN_BASE_ROW) / (r1 - r0)
    nw = int(round(src.shape[1] * sx)); nh = PEN_BASE_END - PEN_BASE_ROW
    rs = np.stack([np.asarray(Image.fromarray(src[..., c].astype(np.float32), "F").resize((nw, nh), Image.LANCZOS)) for c in range(3)], -1)
    ms = np.asarray(Image.fromarray(msk, "F").resize((nw, nh), Image.BILINEAR))
    cx_dst = (PEN_BODY_X[0] + PEN_BODY_X[1]) / 2
    cx_src_in = (pad + (x1 - x0) / 2) * sx
    ox = int(round(cx_dst - cx_src_in))
    reg = out[PEN_BASE_ROW:PEN_BASE_END, ox:ox + nw]
    a = np.clip(ms, 0, 1)[..., None]
    out[PEN_BASE_ROW:PEN_BASE_END, ox:ox + nw] = reg * (1 - a) + np.clip(rs, 0, 255) * a
    return out

class PenTypesetter:
    def __init__(self, font_path):
        self.fp = font_path; self.cal = {}
        for k, (txt, var, (u0, r0, u1, r1)) in PEN_REF.items():
            f = self.font(var, 1000); b = f.getbbox(txt, anchor="ls")
            size = (r1 - r0 + 1) / (b[3] - b[1]) * 1000
            hs = (u1 - u0 + 1) / ((b[2] - b[0]) * size / 1000)
            base = r1 + 1 - b[3] * size / 1000
            origin = u0 - b[0] * size / 1000 * hs
            self.cal[k] = dict(var=var, size=size, hscale=hs, baseline=base, origin=origin,
                               center=base - PEN_FONT_CAP * size / 2)

    def font(self, var, size):
        f = ImageFont.truetype(self.fp, max(1, int(round(size))))
        f.set_variation_by_name(var)
        return f

    def cov(self, txt, var, size, hs, ss=4):
        f = self.font(var, size * ss); b = f.getbbox(txt, anchor="ls")
        pad = 4 * ss
        Wd, Hd = b[2] - b[0] + 2 * pad, b[3] - b[1] + 2 * pad
        im = Image.new("L", (Wd, Hd), 0)
        ImageDraw.Draw(im).text((pad - b[0], pad - b[1]), txt, font=f, fill=255, anchor="ls")
        nw, nh = max(1, int(round(Wd * hs / ss))), max(1, int(round(Hd / ss)))
        c = np.asarray(im.resize((nw, nh), Image.LANCZOS), np.float32) / 255
        # position of origin/baseline inside c
        return c, (pad - b[0]) / ss * hs * (nw / (Wd * hs / ss)), (pad - b[1]) / ss * (nh / (Hd / ss)), b

    def place(self, rot, key, txt, ink):
        cal = self.cal[key]
        f = self.font(cal["var"], 1000); b = f.getbbox(txt, anchor="ls")
        ink_w = (b[2] - b[0]) / 1000 * cal["size"] * cal["hscale"]
        start = cal["origin"] + b[0] / 1000 * cal["size"] * cal["hscale"]
        fit = min(1.0, (PEN_MAX_U - start) / ink_w)
        size = cal["size"] * fit
        base = cal["center"] + PEN_FONT_CAP * size / 2
        c, ox, oy, _ = self.cov(txt, cal["var"], size, cal["hscale"])
        x0 = int(round(cal["origin"] - ox)); y0 = int(round(base - oy))
        H, W = rot.shape[:2]; h, w = c.shape
        xa, ya, xb, yb = max(0, x0), max(0, y0), min(W, x0 + w), min(H, y0 + h)
        a = c[ya - y0:yb - y0, xa - x0:xb - x0][..., None]
        reg = rot[ya:yb, xa:xb]
        shade = np.clip(reg.mean(2, keepdims=True) / PEN_SHADE_REF, 0.8, 1.04)
        rot[ya:yb, xa:xb] = reg * (1 - a) + np.array(ink, np.float32) * shade * a
        return round(fit, 3)

def typeset(base, ts, name, dose, family):
    out = base.copy()
    x0, y0, x1, y1 = PEN_CROP
    crop = out[y0:y1, x0:x1]
    rot = np.ascontiguousarray(np.rot90(crop, 1))      # 90 deg CCW -> text horizontal
    fn = ts.place(rot, "name", name, PEN_INK[family])
    fd = ts.place(rot, "dose", dose, PEN_INK["dose"])
    out[y0:y1, x0:x1] = np.rot90(rot, -1)
    return out, dict(name_scale=fn, dose_scale=fd)

# ================= pipeline =================

# ---------------- sources (public) ------------------------------------------------------
SOURCES = {
    "vial_master": ("https://palmbeach-vitality.store/wp-content/uploads/2026/09/kpv-10mg-vial.png",
                    "2f2925dc3de618e0c68189f50d58031c3ff37bdee3bcb14e7731eb95b6df5eb1"),
    "pen_master": ("https://palmbeach-vitality.store/wp-content/uploads/2026/09/cagrilintide-10mg-pen.png",
                   "e784af9fc3bcb8040b9417f5f54967f36858b304de7dba830d8ec4d08ecc593c"),
    "pen_blue_base": ("https://palmbeach-vitality.store/wp-content/uploads/2026/09/retatrutide-48mg-pen.png",
                      "dfdd10bf81c1958e036ef9908ae64306a6ded3e0f4590ec81bd8ed1f02c912d8"),
    "figtree": ("https://raw.githubusercontent.com/google/fonts/main/ofl/figtree/Figtree%5Bwght%5D.ttf",
                "26ad3db9b31ff7dde67a91ff515d022d2f495cd506590699cf264f0bfe6fb714"),
    "liberation": ("https://github.com/liberationfonts/liberation-fonts/files/7261482/liberation-fonts-ttf-2.1.5.tar.gz",
                   "7191c669bf38899f73a2094ed00f7b800553364f90e2637010a69c0e268f25d0"),
}

def fetch(key, cache):
    import hashlib, urllib.request
    url, sha = SOURCES[key]
    os.makedirs(cache, exist_ok=True)
    fn = os.path.join(cache, key + "_" + os.path.basename(url).replace("%5B", "[").replace("%5D", "]"))
    if not os.path.exists(fn) or hashlib.sha256(open(fn, "rb").read()).hexdigest() != sha:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=120) as r:
            data = r.read()
        got = hashlib.sha256(data).hexdigest()
        if got != sha:
            raise SystemExit(f"SHA256 mismatch for {url}: {got} != {sha}")
        open(fn, "wb").write(data)
    return fn

def liberation_fonts(tgz, cache):
    import tarfile
    out = {}
    with tarfile.open(tgz) as t:
        for m in t.getmembers():
            b = os.path.basename(m.name)
            if b in ("LiberationSans-Bold.ttf", "LiberationSans-Regular.ttf"):
                p = os.path.join(cache, b)
                with t.extractfile(m) as src, open(p, "wb") as dst:
                    dst.write(src.read())
                out["B" if "Bold" in b else "R"] = p
    return out

def load_rgb(path):
    im = Image.open(path); im.load()
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA"); bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
        im = Image.alpha_composite(bg, im)
    return np.asarray(im.convert("RGB"))

PEN_SPEC = {"W": 1080, "H": 1920, "top": 144, "bottom": 1724}

def frame_pen(a, keep):
    """Scale/crop/pad onto the pen canvas with a fixed product mask (same math as v1)."""
    W, H = PEN_SPEC["W"], PEN_SPEC["H"]
    clean = a.copy(); clean[~keep] = 255
    bx0, by0, bx1, by1 = bbox(keep)
    ty0, ty1 = PEN_SPEC["top"], PEN_SPEC["bottom"]
    s = (ty1 - ty0) / (by1 - by0)
    cx = (bx0 + bx1) / 2.0
    sx0 = cx - (W / 2.0) / s; sy0 = by1 - ty1 / s
    sx1 = sx0 + W / s; sy1 = sy0 + H / s
    pad = int(np.ceil(max(0, -sx0, -sy0, sx1 - a.shape[1], sy1 - a.shape[0]))) + 8
    src = Image.fromarray(np.pad(clean, ((pad, pad), (pad, pad), (0, 0)), constant_values=255))
    msk = Image.fromarray(np.pad(keep.astype(np.uint8) * 255, pad))
    box = (sx0 + pad, sy0 + pad, sx1 + pad, sy1 + pad)
    out = np.asarray(src.resize((W, H), Image.LANCZOS, box=box)).copy()
    om = np.asarray(msk.resize((W, H), Image.BILINEAR, box=box)) > 0
    om = ndi.binary_dilation(om, structure=S8, iterations=OUT_DILATE)
    om[:ty0] = False; om[ty1:] = False
    out[~om] = 255
    for _ in range(3):
        keep2, _ = product_mask(out)
        if not ((out.min(2) < 255) & ~keep2).any():
            break
        out[~keep2] = 255
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True, help="output folder for the 88 PNGs")
    ap.add_argument("--csv", default=None); ap.add_argument("--raw-base", default=None)
    ap.add_argument("--cache", default="/tmp/pbv-v2-cache"); ap.add_argument("--report", default=None)
    ap.add_argument("--ids", default=None, help="comma-separated subset")
    ap.add_argument("--app-only-out", default=None, help="also render the app-only pens (APP_ONLY_PENS) as <slug>.png here")
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)
    fonts = liberation_fonts(fetch("liberation", args.cache), args.cache)
    figtree = fetch("figtree", args.cache)
    only = set(int(x) for x in args.ids.split(",")) if args.ids else None
    # ---- vial master
    va = load_rgb(fetch("vial_master", args.cache))
    VM = prepare_master(va, product_mask)
    VR = VialRenderer(VM, fonts, product_mask)
    # ---- pen masters (red = 829 as-is, blue = 829 + 828 collar/knob), label text removed
    pa = load_rgb(fetch("pen_master", args.cache)); pk, _ = product_mask(pa)
    pf = pa.astype(np.float32); pf[~pk] = 255
    red = blank_label(pf)
    ba = load_rgb(fetch("pen_blue_base", args.cache)); bk, _ = product_mask(ba)
    bf = ba.astype(np.float32); bf[~bk] = 255
    blue = blue_variant(red, bf, bk)
    bases = {}
    for fam, arr in (("red", red), ("blue", blue)):
        u8 = np.clip(arr + 0.5, 0, 255).astype(np.uint8)
        k, sil = product_mask(u8)
        bases[fam] = (arr, k | sil)          # filled silhouette: label highlights may be exactly 255
    ts = PenTypesetter(figtree)
    report, csv_rows = [], []
    for ID, SKU, Name, Type in MANIFEST:
        if only and ID not in only:
            continue
        fn = out_name(ID, Name)
        if Type == "pen":
            name, dose, fam = PENS[ID]
            arr, k = bases[fam]
            o, info = typeset(arr, ts, name, dose, fam)
            out = frame_pen(np.clip(o + 0.5, 0, 255).astype(np.uint8), k)
            info.update(family=fam, name=name, dose=dose)
        else:
            name, dose, conc, foot, vol = VIALS[ID]
            out, info = VR.render(vol, dict(name=name, dose=dose, conc=conc, foot=foot), liquid=LIQUID.get(ID))
            info.update(name=name, dose=dose, conc=conc, foot=foot)
        Image.fromarray(out, "RGB").save(os.path.join(args.out, fn), "PNG", optimize=True)
        info.update(ID=ID, Name=Name, Type=Type, file=fn)
        report.append(info)
        print(f"{ID:>4} {Type:<4} {fn}", flush=True)
        if args.raw_base:
            csv_rows.append([ID, SKU, Name, args.raw_base.rstrip("/") + "/" + fn])
    if args.app_only_out:   # not store products: separate folder, never in the CSV
        os.makedirs(args.app_only_out, exist_ok=True)
        for sl, (name, dose, fam, app_id, pname, sib) in APP_ONLY_PENS.items():
            arr, k = bases[fam]
            o, info = typeset(arr, ts, name, dose, fam)
            out = frame_pen(np.clip(o + 0.5, 0, 255).astype(np.uint8), k)
            fn = sl + ".png"
            Image.fromarray(out, "RGB").save(os.path.join(args.app_only_out, fn), "PNG", optimize=True)
            info.update(family=fam, name=name, dose=dose, ID=None, app_id=app_id, Name=pname, Type="pen", file=fn, app_only=True)
            report.append(info)
            print(f" app pen  {fn}", flush=True)
    if args.csv:
        with open(args.csv, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f, lineterminator="\r\n")
            w.writerow(["ID", "SKU", "Name", "Images"]); w.writerows(csv_rows)
    if args.report:
        json.dump(report, open(args.report, "w"), indent=1)

if __name__ == "__main__":
    main()
