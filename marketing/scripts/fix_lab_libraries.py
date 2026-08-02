#!/usr/bin/env python3
"""
Audit + fix lab-item / creation / Creatomate-text libraries.

- Replace multi-subject / dual-chamber / twin items with single realistic subjects
- Purge boxes / cartons / trays / packaging — prefer premium equipment, vials, powders, sterile labs
- Never bake "creation motif / LAB-### / 000/500" into prompts (Grok prints it on products)
- Enforce SINGLE SUBJECT wording in every video_prompt
- Interleave categories by rank so early picks are not vial→vial→vial
- Ensure text library has text_id filled and strips · ref/motif suffixes
"""

from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"

# Problematic lab_item → (new_name, new_detail)
# Rule: ONE clear primary subject; no extra vials/pens; no stacks that read as many products.
REPLACEMENTS: dict[str, tuple[str, str]] = {
    # --- prior multi-subject fixes ---
    "dual-chamber lyophilized research vial": (
        "single-chamber lyophilized research vial",
        "one clear glass vial, single chamber only, white lyophilized cake, sealed septum, aluminum crimp",
    ),
    "single-chamber lyophilized research vial": (
        "single-chamber lyophilized research vial",
        "one clear glass vial, single chamber only, white lyophilized cake, sealed septum, aluminum crimp",
    ),
    "clear vial cluster in cardboard vial tray": (
        "single research vial seated in cardboard tray well",
        "exactly one clear vial in one die-cut well, other wells empty, no second vial",
    ),
    "pair of matched peptide vials side by side": (
        "single peptide vial catalog hero",
        "exactly one clear peptide vial, centered, sealed cap, no second vial",
    ),
    "two research pens parallel on slate": (
        "single research pen on slate",
        "exactly one capped research pen, centered on slate, no second pen",
    ),
    "dual research pens crossed at 15 degrees": (
        "single research pen angled catalog pose",
        "exactly one research pen at a slight angle, cap on, no second pen",
    ),
    "research pen components laid out as kit": (
        "assembled research pen sealed catalog hero",
        "one complete capped research pen only, not disassembled components",
    ),
    "cuvette pair in foam": (
        "single quartz cuvette in foam well",
        "exactly one clear cuvette seated in foam, adjacent wells empty",
    ),
    "pair of nitrile gloves laid flat unused": (
        "single unused nitrile glove laid flat",
        "exactly one glove, flat, unused, no pair visible",
    ),
    "single unused nitrile glove laid flat": (
        "single unused nitrile glove laid flat",
        "exactly one glove, flat, unused, no second glove",
    ),
    "twin-pack vials in clear clamshell": (
        "single vial in clear clamshell well",
        "exactly one vial in open clamshell, second well empty",
    ),
    "research pen with spare cartridge pair": (
        "research pen with one spare cartridge",
        "one pen and one cartridge only, no duplicate pens",
    ),
    "research pen capped and uncapped twins": (
        "research pen capped catalog hero",
        "exactly one capped research pen, no uncapped duplicate",
    ),
    "serological pipette individually wrapped bundle": (
        "single serological pipette individually wrapped",
        "exactly one wrapped pipette, no bundle stack",
    ),
    "single serological pipette individually wrapped": (
        "single serological pipette individually wrapped",
        "exactly one wrapped pipette, paper/plastic wrap intact",
    ),
    "LN2 glove pair boxed": (
        "single cryogenic glove on box lid",
        "exactly one cryo glove displayed, box as prop only",
    ),
    "dropper assembly components laid out": (
        "assembled research dropper bottle sealed",
        "one complete sealed dropper bottle only",
    ),
    "PET clam for dual pens": (
        "PET clamshell with single research pen",
        "clamshell holding exactly one pen, second cavity empty",
    ),
    "sleeve protector pair packaged": (
        "single sleeve protector packaged",
        "one packaged sleeve protector only",
    ),
    "cut-resistant glove pair folded": (
        "single cut-resistant glove folded",
        "exactly one glove, folded, unused",
    ),
    "sterile gloves individually wrapped pair": (
        "single sterile glove individually wrapped",
        "exactly one wrapped sterile glove",
    ),
    # --- cross-category vials (confuses Grok into dual subjects) ---
    "brushed stainless steel lab tray with vial": (
        "empty brushed stainless steel lab tray",
        "one empty rectangular stainless tray, clean mirror finish, no vials or products on it",
    ),
    "laboratory freezer box cardboard with vials": (
        "empty cardboard laboratory freezer box",
        "one closed cardboard freezer storage box, no vials visible",
    ),
    "open carton revealing foam-cradled vial": (
        "open research carton with empty foam insert",
        "one open white carton, empty foam well, no vial inside",
    ),
    "autosampler tray with vials partial": (
        "empty HPLC autosampler tray",
        "one empty plastic autosampler tray, vacant wells only, no vials",
    ),
    "foil pouch resealable with vial silhouette": (
        "resealable foil barrier pouch sealed flat",
        "one flat sealed foil pouch, no vial silhouette, no product inside view",
    ),
    "corrugated mailer for vials": (
        "corrugated laboratory mailer box closed",
        "one small closed corrugated mailer, plain, no vials shown",
    ),
    "frosted ice pan with sealed vials": (
        "empty stainless ice pan with crushed ice",
        "one metal ice pan with ice only, no vials",
    ),
    "refrigerator shelf bin with labeled vials": (
        "empty laboratory refrigerator shelf bin",
        "one empty plastic fridge bin, no vials",
    ),
    "ceramic tile sample with amber vial": (
        "cool gray ceramic lab tile sample square",
        "one ceramic tile square only, no vial",
    ),
    "wire chrome basket with cleaned vials": (
        "empty chrome wire laboratory basket",
        "one empty wire basket, no glassware inside",
    ),
    "void fill kraft paper and vial box": (
        "kraft void-fill paper roll",
        "one kraft paper roll for packing, no vial box",
    ),
    "analytical balance with vial on pan": (
        "analytical balance with empty weighing pan",
        "one analytical balance, draft shield, empty pan, no vial on pan",
    ),
    "cryo cane with clip for vials": (
        "empty aluminum cryogenic cane",
        "one metal cryo cane with empty clips, no vials attached",
    ),
    "insulated vial sleeve neoprene": (
        "neoprene insulated bottle sleeve empty",
        "one empty neoprene sleeve standing open, no bottle or vial inside",
    ),
    "probe thermometer in vial sleeve": (
        "digital probe thermometer alone",
        "one digital probe thermometer on bench, no sleeve, no vial",
    ),
    "child-resistant research vial cap assortment": (
        "single child-resistant research bottle cap",
        "exactly one white CR cap, centered, no assortment pile",
    ),
    "calipers measuring a vial diameter": (
        "digital calipers partially open empty",
        "one digital caliper tool only, jaws open, nothing between jaws",
    ),
    "rigid plastic vial wallet": (
        "rigid plastic sample card holder empty",
        "one empty rigid plastic holder, no vials",
    ),
    "cryobox cardboard 10x10 with partial vials": (
        "empty cardboard cryobox 10x10 grid",
        "one open empty cryobox, all wells vacant, no vials",
    ),
    "bench linear organizer with vials pens": (
        "empty bench linear organizer tray",
        "one empty desk organizer for lab bench, no pens or vials",
    ),
    "drawer organizer custom vial wells": (
        "empty foam drawer organizer insert",
        "one empty foam insert with vacant wells, no vials",
    ),
    "autoclave tape roll and indicator vial": (
        "autoclave indicator tape roll",
        "one roll of autoclave tape only, no vial",
    ),
    "molded pulp egg-crate for vials": (
        "empty molded pulp shipping tray",
        "one empty molded pulp tray, vacant cells, no vials",
    ),
    "barcode scanner beside vial": (
        "handheld laboratory barcode scanner",
        "one barcode scanner only, no vial beside it",
    ),
    # --- stacks / multiples / weird props ---
    "beaker nest set of three": (
        "single borosilicate beaker 250ml",
        "exactly one clear beaker, empty, graduation marks visible",
    ),
    "three-neck flask dry": (
        "single-neck round bottom flask dry",
        "one round-bottom flask, single neck, dry glass, no extra necks in use",
    ),
    "stack of Petri dishes": (
        "single sterile Petri dish closed",
        "exactly one closed Petri dish, clear lid, no stack",
    ),
    "sieve stack for powders": (
        "single laboratory test sieve",
        "exactly one metal test sieve, mesh visible, no stacked sieves",
    ),
    "multipack sleeve holding three cartons": (
        "single research product carton closed",
        "exactly one closed carton, no multipack sleeve",
    ),
    "unit dose blister of research cartridges five": (
        "single research cartridge in blister cell",
        "one blister card showing exactly one cartridge cell, others empty or cropped out",
    ),
    "stainless utility cart two shelf": (
        "stainless laboratory utility cart",
        "one stainless utility cart, empty shelves, no products on it",
    ),
    "cold brick stack of two": (
        "single laboratory cold brick pack",
        "exactly one cold pack brick, flat on bench",
    ),
    "research pen body disassembled halves": (
        "research pen capped intact catalog hero",
        "one intact capped research pen, not disassembled",
    ),
    "chemical absorbent pads stack": (
        "single chemical absorbent pad",
        "exactly one absorbent pad laid flat",
    ),
    "sterile gauze stack in tray": (
        "single sterile gauze pack sealed",
        "one sealed gauze pack in a tray, not a tall stack",
    ),
    "cuvette rack acrylic holding four": (
        "empty acrylic cuvette rack",
        "one empty cuvette rack, vacant slots, no cuvettes",
    ),
    "research pen on white infinity cyclorama": (
        "research pen on matte white seamless paper",
        "one capped research pen on plain white paper backdrop",
    ),
    "clear vial suspended in acrylic block embed mock": (
        "clear research vial on acrylic display block",
        "one vial standing on a solid acrylic block base, not embedded inside plastic",
    ),
    "serialized hologram sticker pack": (
        "serialized tamper-evident sticker sheet",
        "one flat sheet of tamper stickers, matte print, no hologram fantasy glow",
    ),
    "research pen clipped to lab coat pocket fabric still": (
        "research pen on folded lab-coat fabric swatch",
        "one pen resting on a fabric swatch only, no person, no body",
    ),
    "lab stool base only cropped": (
        "laboratory stool with metal base",
        "one lab stool, full object, empty seat, no person",
    ),
    "gowning bench empty": (
        "empty cleanroom gowning bench",
        "one empty wooden or laminate gowning bench, no people",
    ),
    "hands-free sensor trash can closed lab": (
        "closed laboratory step-can waste container",
        "one closed stainless or plastic lab waste can, no hands, no sensors emphasized",
    ),
    "hand sanitizer pump bottle lab brand-agnostic": (
        "isopropyl alcohol wash bottle",
        "one labeled IPA wash bottle, squeeze style, laboratory, no hands",
    ),
    "acrylic glove box exterior gloves hanging": (
        "closed acrylic glove box exterior",
        "one glove box chamber exterior, ports capped, no hanging glove shapes that look like hands in use",
    ),
    "cryogenic gloves folded beside cryobox": (
        "single cryogenic glove folded",
        "exactly one cryo glove folded, no cryobox, no second glove",
    ),
    "septum vial with needle-free research adapter nearby": (
        "septum research vial with sealed crimp",
        "one sealed septum vial only, no adapter, no needle hardware",
    ),
    "vial in vacuum skin-pack card": (
        "research vial in simple blister card",
        "one vial on a flat card blister, realistic retail lab pack, no vacuum skin distortion",
    ),
    "amber powder jar with scoop nested on lid": (
        "amber powder jar sealed lid only",
        "one amber jar, lid sealed, no scoop on lid",
    ),
    "box of nitrile gloves blue closed": (
        "closed box of nitrile examination gloves",
        "one closed glove dispenser box, blue, no gloves outside the box",
    ),
    "finger cots box": (
        "closed box of laboratory finger cots",
        "one closed small product box, catalog still, no fingers or skin",
    ),
    # --- injection-adjacent (realistic lab tools, but high Grok misfire risk) ---
    "cold finger condenser": (
        "glass cold-finger condenser apparatus",
        "one glass condenser piece for lab distillation, clear borosilicate, no body parts",
    ),
    "glass Hamilton-style syringe pipette": (
        "glass microliter pipette with metal plunger",
        "one precision glass pipette tool, no hypodermic needle, research liquid handling only",
    ),
    "sterile syringe filter attached to syringe no needle": (
        "sterile syringe-filter disc unit alone",
        "one 0.22 micron filter unit only, no syringe body, no needle",
    ),
    "glass syringe without needle research only": (
        "glass research barrel with Luer lock cap",
        "one glass barrel capped, no needle, no injection context",
    ),
    "syringe pump bare with research syringe glass": (
        "laboratory syringe pump instrument empty",
        "one syringe pump chassis on bench, empty clamp, no needle, no skin context",
    ),
    "syringe filter unit 0.22 micron": (
        "0.22 micron membrane filter cartridge",
        "one small disc filter cartridge only, packaged or bare, no needle, no syringe body",
    ),
    "0.22 micron syringe-filter cartridge": (
        "0.22 micron membrane filter cartridge",
        "one small disc filter cartridge only, no needle, no syringe body",
    ),
    "sterile syringe-filter disc unit alone": (
        "sterile 0.22 micron membrane filter unit",
        "one sterile filter disc unit only, no syringe, no needle",
    ),
    "laboratory syringe pump instrument empty": (
        "laboratory infusion pump chassis empty",
        "one benchtop pump instrument, empty clamp bay, no needle, no consumable loaded",
    ),
    "laboratory infusion pump chassis empty": (
        "laboratory infusion pump chassis empty",
        "one benchtop pump instrument, empty clamp bay, no needle, no consumable loaded",
    ),
    # --- lyophilized / "beside" scenes that cause stacked dual-chamber vials ---
    "single-chamber lyophilized research vial": (
        "clear liquid-filled research vial with crimp seal",
        "one clear single-chamber vial, liquid fill with sharp meniscus, aluminum crimp, rubber stopper, NOT lyophilized cake, NOT dual-chamber",
    ),
    "clear vial with lyophilized white cake": (
        "clear research vial with colorless liquid fill",
        "one single-chamber vial, clear liquid only, no cake, no powder plug, no dual chamber",
    ),
    "lyo vial with cake cracked texture visible": (
        "amber research vial with clear liquid fill",
        "one amber single-chamber vial, liquid fill, one crimp cap, no lyophilized cake, no stacked chambers",
    ),
    "research vial beside matching empty carton": (
        "research vial catalog hero alone",
        "exactly one sealed research vial centered, no carton, no second object",
    ),
    "glass vial with desiccant canister beside it": (
        "glass research vial sealed alone",
        "exactly one sealed glass vial, no desiccant tin, no second object",
    ),
    "research vial next to calibrated weight set": (
        "research vial standing alone on bench",
        "exactly one sealed vial, no weight set in frame",
    ),
    "amber vial beside silica canister mini": (
        "amber research vial sealed alone",
        "exactly one amber vial, no silica canister",
    ),
    "amber vial next to calibrated pipette tip": (
        "amber research vial sealed alone",
        "exactly one amber vial, no pipette tip in frame",
    ),
    "vial rack aluminum 5x10 empty slots with one vial": (
        "single research vial standing alone on bench",
        "one vial only, no rack, no other slots or vials",
    ),
    "HPLC sample vial with insert": (
        "HPLC autosampler vial sealed",
        "one 2ml vial with septum cap, single chamber, no nested insert that looks like a second vial",
    ),
    "single research vial seated in cardboard tray well": (
        "single research vial standing on matte bench",
        "one vial only, no tray, no other wells",
    ),
    "research vial in individual carton window": (
        "research vial standing free on white surface",
        "one vial only, no carton window framing",
    ),
    # --- boring "empty" props → exciting single science heroes ---
    "empty brushed stainless steel lab tray": (
        "precision analytical microbalance under glass draft shield",
        "one closed draft-shield balance, brushed steel, glowing blue status LED, ultra sharp hero product shot",
    ),
    "empty cardboard laboratory freezer box": (
        "ultra-low temperature freezer door with frost-edged window port",
        "one closed ULT freezer door detail, frost texture, clinical cold-chain drama, no vials visible",
    ),
    "open research carton with empty foam insert": (
        "premium research carton with embossed lot panel",
        "one closed white research carton, crisp edges, soft shadow, catalog hero",
    ),
    "empty HPLC autosampler tray": (
        "HPLC system front panel with solvent lines idle",
        "one instrument face, metal and polymer, status lights, no sample vials in frame",
    ),
    "empty stainless ice pan with crushed ice": (
        "laboratory recirculating chiller unit",
        "one compact chiller, hose couplings, cool blue indicator light, industrial science aesthetic",
    ),
    "empty laboratory refrigerator shelf bin": (
        "pharmacy-grade laboratory refrigerator with glass door closed",
        "one fridge unit hero, glass door reflections, cold LED interior glow, shelves empty",
    ),
    "empty chrome wire laboratory basket": (
        "stainless laboratory ultrasonic cleaner bath",
        "one ultrasonic cleaner, brushed lid, control dial, water-ready basin closed or empty",
    ),
    "empty aluminum cryogenic cane": (
        "liquid nitrogen dewar with vented cap",
        "one LN2 dewar, frost on shoulder, vapor hint at vent only, no people, no vials",
    ),
    "empty cardboard cryobox 10x10 grid": (
        "cryogenic storage dewar neck with locking lid",
        "one dewar lid assembly macro, cold metal, scientific drama",
    ),
    "empty bench linear organizer tray": (
        "RGB-illuminated laboratory vortex mixer",
        "one vortex mixer, rubber cup empty, accent LED ring, dynamic catalog pose",
    ),
    "empty foam drawer organizer insert": (
        "modular laboratory hotplate stirrer",
        "one hotplate-stirrer, ceramic top, digital display lit, no glassware on plate",
    ),
    "empty acrylic cuvette rack": (
        "UV-Vis spectrophotometer sample compartment open",
        "one spectrophotometer, open bay empty, optical bench detail, premium instrument hero",
    ),
    "empty molded pulp shipping tray": (
        "tamper-evident research shipper with humidity indicator card",
        "one sealed shipper box, humidity card window, logistics-science aesthetic",
    ),
    "borosilicate Erlenmeyer flask 250ml empty": (
        "borosilicate Erlenmeyer flask with vivid blue copper sulfate solution",
        "one flask, bright blue liquid, sharp meniscus, dramatic side light through glass, no other glassware",
    ),
    "analytical balance with empty weighing pan": (
        "analytical microbalance with illuminated draft chamber",
        "one balance hero, internal light on empty pan, mirrored steel, luxury lab catalog",
    ),
    "open microcentrifuge showing rotor empty": (
        "refrigerated microcentrifuge with lid open showing empty rotor",
        "one centrifuge, empty rotor only, teal interior accent, no tubes",
    ),
    "gel electrophoresis tank empty": (
        "gel electrophoresis tank with buffer fill and empty gel tray",
        "one tank, clear buffer, electrodes visible, electric-science mood, no samples loaded",
    ),
    "thermocycler block alone empty": (
        "PCR thermocycler with colorful block and lit display",
        "one thermocycler, lid open or closed, vivid block, sharp UI, no tubes",
    ),
    "deep-well plate empty": (
        "96-well PCR plate clear on black acrylic",
        "one empty plate, geometric well grid, specular highlights, macro catalog",
    ),
    "laboratory infusion pump chassis empty": (
        "programmable syringe-free laboratory metering pump",
        "one metering pump instrument, digital panel lit, industrial science hero",
    ),
    "research pen next to empty packaging tray": (
        "research pen low-angle hero on mirrored black acrylic",
        "one capped research pen, dramatic reflection, rim light, no tray",
    ),
}

SINGLE_SUBJECT = (
    "SINGLE SUBJECT ONLY: exactly one primary laboratory object, sharp and centered. "
    "If the subject is a vial: ONE continuous glass body, ONE chamber, ONE cap/stopper only. "
    "FORBIDDEN: dual-chamber vials, vial stacked on another vial, two vials fused, "
    "lyophilized cake that looks like a second vial underneath, twin packs, "
    "extra vials in frame, product collage, reflections that read as a second product."
)

AVOID = (
    "No cardboard product boxes, no shipping cartons, no mailers, no trays as the hero, "
    "no packaging props, no blister cards, no clamshells, no foam inserts as the subject. "
    "NO invented on-product text: no 'creation motif', no 'LAB-###', no '000/500', "
    "no 'research carton' panel, no fake lot banners, no watermark counters on the object. "
    "Labels if any must be minimal/blank/generic — never show creation IDs or motif copy. "
    "No abstract shapes, no glass orbs, no crystal balls, no surreal spheres, no CGI blobs, "
    "no nebula, no galaxies, no fantasy energy, no particle portals, no impossible geometry, "
    "no melting objects, no dreamscape, no people, no faces, no hands, no bare skin, "
    "no needles penetrating skin, no injection act, no clinic patient scene, no gym, "
    "no lifestyle, no wellness claims, no nicknames, no supplements aesthetic"
)

# Names/details that match these are replaced with premium equipment / vials / sterile scenes.
BORING_SUBJECT_RE = re.compile(
    r"\b("
    r"box|boxes|tray|trays|carton|cartons|mailer|shipper|clamshell|packaging|"
    r"pouch|void-?fill|bubble wrap|label sheet|sticker|desiccant|insert card|"
    r"foam|kraft|dispenser|blister|shipping label|pallet of|retail shelf|"
    r"tamper sleeve|security tape|qr code|lot sticker|pack insert|silica gel|"
    r"evaluation box|compartment box|kimwipe|recycling bin|bootie|cryobox|"
    r"freezer box|styrofoam|cold box|glove box|instrument tray|lab tray|"
    r"parts bin|kanban|spill kit|weighing paper book|clipboard|sample log|"
    r"tape rolls|sharpies|first-aid|paper towel|waste container|step-can|"
    r"gowning|utility cart|laboratory stool|anti-fatigue|floor marked|"
    r"pass cart|die-cut|brand stamp|ink pad|oxygen absorber|measuring scoop|"
    r"humidity control pack|induction seal wad|glassine|cap assortment|"
    r"child-resistant|mailer|shipper|corrugated|unit carton|window showing|"
    r"velvet-lined|tip boxes|prep pads box|finger cots|gc column box|"
    r"controller box|slide box|cover slips in plastic|alcohol prep|"
    r"insulated shipper|vapor shipper|cold packs flanking|validated shipping|"
    r"neoprene insulated bottle sleeve|ice sleeve|cooling core|"
    r"face shield for cryo boxed|vapor plug|indicator tape on sterilized|"
    r"ear plugs|half-mask respirator unused on tray|safety glasses on lab tray|"
    r"sleeve covers packaged|sleeve protector|nitrile examination gloves|"
    r"bottle-top dispenser|"
    r"esd mat with research carton|marble pass-through shelf with sealed box|"
    r"modular lab shelving with neat reagent|pegboard with hanging|"
    r"blue absorbent bench underpad|lab notebook closed|"
    r"color-coded tape|wall-mounted glove dispenser empty|"
    r"closed laboratory step-can|recycling bin for tip|"
    r"empty cleanroom gowning|gowning mirror|step-over bench|"
    r"interlocking pass cart|gas cylinder restraint|cylinder cap and valve|"
    r"room differential|magnehelic|hepa filter grill exterior|"
    r"cleanroom light panel glow on products|pass-through chamber closed|"
    r"cleanroom cart with sealed|acid cabinet|chemical storage cabinet closed|"
    r"rigid plastic sample card|pump spray research solvent bottle empty|"
    r"assembled research dropper|aluminum bottle for light-sensitive|"
    r"research cartridge in blister|perforation tear strip|"
    r"soft-touch laminate carton|windowless matte black carton|"
    r"carton with embossed|tamper-evident research shipper|"
    r"pet clamshell|kraft tube|foam-in-place|silica gel pillow|"
    r"pack insert accordion|lot sticker sheets|humidity indicator|"
    r"single vial in clear clamshell|vial shipper insert pulp|"
    r"amber ampule on reflective tray|research pen on brushed aluminum tray|"
    r"laminar flow hood interior empty product tray|"
    r"gel electrophoresis tank with buffer fill and empty gel tray"
    r")\b",
    re.I,
)

# Premium replacements: (name, detail, category)
# Used for packaging purge + any boring box/tray subject.
PREMIUM_POOL: list[tuple[str, str, str]] = [
    ("confocal laser scanning microscope", "one premium confocal microscope body with objective turret and illuminated stage, no samples loaded", "premium_equipment"),
    ("inverted fluorescence microscope", "one inverted scope, fluorescence illuminator housing, clean stage, museum-grade instrument hero", "premium_equipment"),
    ("research stereo microscope on boom stand", "one stereo microscope, dual eyepieces, polished boom arm, black lab field", "premium_equipment"),
    ("scanning electron microscope column", "one SEM column exterior, brushed metal, status LEDs, ultra-premium hardware", "premium_equipment"),
    ("transmission electron microscope console", "one TEM instrument console section, high-tech metal panels, cinematic lab", "premium_equipment"),
    ("HPLC chromatography system stack", "one analytical HPLC stack, solvent bottles seated, illuminated display, no people", "premium_equipment"),
    ("UPLC ultra-performance LC system", "one compact UPLC instrument, glossy panels, sharp UI, pharmaceutical QC aesthetic", "premium_equipment"),
    ("triple quadrupole mass spectrometer", "one LC-MS instrument, iconic quadrupole housing, cool status lights", "premium_equipment"),
    ("orbitrap high-resolution mass spectrometer", "one orbitrap MS unit, premium research hardware hero", "premium_equipment"),
    ("NMR spectrometer console detail", "one NMR console / magnet room instrument detail, clinical steel and warning accents, no people", "premium_equipment"),
    ("FTIR spectrometer with sample compartment open", "one FTIR bench instrument, open bay, optical path visible, empty of samples", "premium_equipment"),
    ("UV-Vis spectrophotometer", "one dual-beam spectrophotometer, quartz-ready compartment, lit display", "premium_equipment"),
    ("fluorescence plate reader", "one multimode plate reader, drawer ajar empty, premium biotech instrument", "premium_equipment"),
    ("flow cytometer analyzer", "one flow cytometer, fluidics panel, glowing status, cleanroom-ready", "premium_equipment"),
    ("next-generation DNA sequencer", "one benchtop NGS sequencer, glossy white/black housing, lit touchscreen", "premium_equipment"),
    ("Sanger sequencing capillary instrument", "one capillary sequencer module, premium genetics lab hardware", "premium_equipment"),
    ("real-time PCR thermocycler", "one qPCR instrument, block closed, vivid display curves aesthetic without readable patient data", "premium_equipment"),
    ("digital PCR system", "one digital PCR instrument, compact premium biotech hero", "premium_equipment"),
    ("automated liquid handling robot", "one deck of a liquid handler with gantry arm parked, empty tips nests, no plates loaded with samples", "premium_equipment"),
    ("biosafety cabinet class II interior", "one BSC work zone empty, HEPA grille, stainless work surface, sterile blue light mood", "sterile_env"),
    ("laminar flow hood sterile work zone", "one laminar hood interior, empty stainless deck, vertical airflow grille, sterile catalog", "sterile_env"),
    ("walk-in cleanroom airlock doors", "one cleanroom airlock with interlocking doors, magnehelic gauge, sterile architecture", "sterile_env"),
    ("ISO cleanroom sterile anteroom empty", "one sterile anteroom architecture, benches empty, HEPA glow, no garment clutter", "sterile_env"),
    ("laboratory autoclave chamber door", "one autoclave, heavy door, stainless, analog/digital gauges, industrial science", "premium_equipment"),
    ("benchtop autoclave sterilizer", "one compact autoclave, polished steel, status ready light", "premium_equipment"),
    ("ultracentrifuge with lid closed", "one floor ultracentrifuge, iconic cylindrical form, cool LED ring", "premium_equipment"),
    ("refrigerated high-speed centrifuge", "one refrigerated centrifuge, lid closed, frost-free steel, premium lab", "premium_equipment"),
    ("microcentrifuge refrigerated lid open empty rotor", "one microcentrifuge, empty rotor only, teal interior, no tubes", "premium_equipment"),
    ("cryostat microtome", "one cryostat, chamber open empty, frost texture, histology instrument", "premium_equipment"),
    ("rotary microtome", "one precision microtome, blade guard on, brass/steel craftsmanship", "premium_equipment"),
    ("lyophilizer freeze-dryer chamber", "one lyophilizer, acrylic chamber, condenser detail, pharma research", "premium_equipment"),
    ("rotary evaporator with glassware seated", "one rotovap, pear flask empty, condenser coils, deep vacuum science mood", "premium_equipment"),
    ("vacuum manifold Schlenk line detail", "one Schlenk vacuum manifold, glass stopcocks, polished clamps, chemistry research", "premium_equipment"),
    ("glovebox anaerobic workstation exterior", "one sealed glovebox workstation, viewing window, gas scrubbers, no hands in gloves", "sterile_env"),
    ("CO2 incubator interior shelves empty", "one incubator chamber, empty polished shelves, warm amber interior light", "sterile_env"),
    ("hypoxia cell culture chamber", "one hypoxia workstation, sealed glass, instrument panels lit", "sterile_env"),
    ("laboratory freeze dryer shelf stack", "one lyophilizer shelf stack detail, frost and steel, premium pharma", "premium_equipment"),
    ("particle counter handheld research grade", "one airborne particle counter, OLED display, cleanroom QA tool", "qc_analytical"),
    ("toc analyzer for ultrapure water", "one TOC analyzer, pharma water QC instrument, stainless fittings", "qc_analytical"),
    ("karl fischer titrator", "one KF titrator, glass titration cell empty, analytical chemistry hero", "qc_analytical"),
    ("differential scanning calorimeter", "one DSC instrument, furnace head, thermal analysis premium", "qc_analytical"),
    ("rheometer measuring head", "one rheometer geometry head, polished steel, materials science", "qc_analytical"),
    ("nanodrop spectrophotometer pedestal", "one microvolume spectrophotometer pedestal, lit measurement surface empty", "qc_analytical"),
    ("dynamic light scattering particle sizer", "one DLS instrument, cuvette bay empty, biotech QC", "qc_analytical"),
    ("x-ray diffractometer goniometer", "one XRD goniometer stage, precision motors, materials lab", "premium_equipment"),
    ("raman microscope system", "one Raman microscope, laser safety shroud, spectroscopic research", "premium_equipment"),
    ("atomic force microscope head", "one AFM scan head, vibration isolation table, nanoscience", "premium_equipment"),
    ("ion chromatography system", "one IC instrument stack, eluent bottles seated, analytical chemistry", "premium_equipment"),
    ("gas chromatograph with autosampler", "one GC, oven door closed, autosampler tower, no vials loaded", "premium_equipment"),
    ("inductively coupled plasma MS torch housing", "one ICP-MS instrument, RF generator housing, elemental analysis", "premium_equipment"),
    ("laboratory water purification system", "one ultrapure water polisher, illuminated purity display, cleanroom wet lab", "sterile_env"),
    ("peristaltic pump precision drive", "one multi-channel peristaltic pump, rollers visible, bioprocess aesthetic", "instruments"),
    ("syringe pump dual-drive research", "one dual syringe pump chassis, lead screws, no needles attached", "instruments"),
    ("laboratory hotplate stirrer ceramic top", "one ceramic-top hotplate stirrer, digital setpoints, clean deck empty", "instruments"),
    ("overhead stirrer on retort stand", "one overhead stirrer motor, stainless chuck empty, chemistry bench", "instruments"),
    ("vortex mixer RGB-accent laboratory", "one vortex mixer, rubber cup empty, neon accent lighting science", "instruments"),
    ("ultrasonic homogenizer probe unit", "one sonicator, probe tip guarded, bioprocessing instrument", "instruments"),
    ("bead mill homogenizer", "one bead mill, sample chamber closed, proteomics prep", "instruments"),
    ("laboratory vacuum pump oil-free", "one oil-free scroll vacuum pump, industrial science hero", "instruments"),
    ("diaphragm vacuum pump compact", "one lab diaphragm pump, PTFE heads, clean chemistry support", "instruments"),
    ("precision analytical microbalance draft chamber", "one microbalance under glass, illuminated pan empty, luxury catalog", "instruments"),
    ("semi-micro balance with draft shield", "one semi-micro balance, doors closed, mirrored steel", "instruments"),
    ("moisture analyzer halogen", "one halogen moisture balance, lid open empty, QC lab", "qc_analytical"),
    ("melting point apparatus digital", "one melting point instrument, sample block empty, organic chemistry", "qc_analytical"),
    ("polarimeter research grade", "one polarimeter tube bay, optical bench aesthetic", "qc_analytical"),
    ("refractometer Abbe digital", "one digital refractometer, prism hatch closed, QC", "qc_analytical"),
    ("laboratory pH meter with electrode stand", "one benchtop pH meter, electrode in storage sleeve, no beaker clutter", "qc_analytical"),
    ("conductivity meter probe station", "one conductivity meter, probe clipped, water QC", "qc_analytical"),
    ("dissolved oxygen meter research", "one DO meter, optical probe, bioprocess QA", "qc_analytical"),
    ("laboratory osmometer freezing-point", "one osmometer, sample well empty, clinical research device", "qc_analytical"),
    ("microplate washer automated", "one plate washer, manifold head, ELISA automation", "premium_equipment"),
    ("ELISA plate reader absorbance", "one absorbance plate reader, drawer empty, diagnostics research", "premium_equipment"),
    ("western blot imager chemiluminescence", "one gel/blot imager cabinet, door ajar dark interior glow", "premium_equipment"),
    ("gel documentation UV system", "one gel doc hood, UV transilluminator off/safe, molecular biology", "premium_equipment"),
    ("electrophoresis power supply premium", "one electrophoresis power supply, banana jacks, vivid display", "instruments"),
    ("horizontal gel electrophoresis tank", "one gel tank with buffer, empty gel tray bed, electrodes visible", "instruments"),
    ("vertical protein gel rig", "one mini-PROTEAN style rig, plates seated empty, protein research", "instruments"),
    ("transilluminator blue-light safe", "one blue-light transilluminator, amber shield up, DNA viz", "instruments"),
    ("cryogenic storage dewar exterior", "one LN2 dewar, frosted neck, vapor wisp, cold-chain drama — no boxes", "cold_chain"),
    ("controlled-rate freezer chamber", "one CRF chamber interior empty, cryobiology instrument", "cold_chain"),
    ("ultra-low freezer interior racks empty", "one ULT freezer interior, empty stainless racks, frost edge", "cold_chain"),
    ("laboratory cold room stainless corridor", "one cold-room aisle, stainless shelving empty, sterile cold light", "cold_chain"),
    ("peptide research powder on weighing paper", "one small pile of white research powder on glassine weigh paper under draft shield, microbalance context, single subject powder focus", "vials_containers"),
    ("lyophilized peptide cake in open vial", "one clear vial, open septum removed, white lyophilized cake only, single chamber, no second vial", "vials_containers"),
    ("amber research vial sealed septum close-up", "one amber glass vial, aluminum crimp, white septum, sharp fill line, luxury catalog", "vials_containers"),
    ("clear peptide vial with lyophilized plug", "one clear vial, white lyophilized plug, crimp seal, single subject", "vials_containers"),
    ("research powder vial sealed aluminum crimp", "one sealed vial of white research powder, no label clutter, single chamber", "vials_containers"),
    ("borosilicate volumetric flask with meniscus", "one volumetric flask, precise meniscus, etched mark, dramatic side light", "glassware"),
    ("jacketed glass reactor vessel empty", "one jacketed reactor, ground-glass joints, chemistry scale-up aesthetic", "glassware"),
    ("separatory funnel on ring stand", "one separatory funnel, stopcock closed, empty, organic chemistry", "glassware"),
    ("soxhlet extractor assembly", "one Soxhlet glassware on stand, condenser top, research chemistry", "glassware"),
    ("precision graduated cylinder with meniscus", "one tall graduated cylinder, sharp meniscus, catalog hero", "glassware"),
    ("single quartz cuvette optical faces", "one quartz cuvette only, optical faces clean, spectrophotometer ready", "glassware"),
    ("microscope oil-immersion objective turret", "one objective turret macro, engraved magnification rings, premium optics", "premium_equipment"),
    ("motorized microscope stage XY", "one motorized stage, empty slide clips, precision engraved scales", "premium_equipment"),
    ("laser optical table with beam path hardware", "one optical breadboard section with mounts only, no people, photonics lab", "premium_equipment"),
    ("femtosecond laser enclosure research", "one laser enclosure panel with interlock, ultrafast lab aesthetic", "premium_equipment"),
    ("patch-clamp electrophysiology rig detail", "one micromanipulator and amplifier headstage, neuroscience research hardware, no tissue", "premium_equipment"),
    ("bioreactor benchtop glass vessel", "one glass bioreactor vessel on skid, impeller visible, bioprocess", "premium_equipment"),
    ("tangential flow filtration cassette holder", "one TFF holder, sanitary clamps, biopharma processing", "premium_equipment"),
    ("FPLC chromatography system", "one FPLC stack, fraction collector empty, protein purification", "premium_equipment"),
    ("AKTA-style purification skid", "one protein purification skid, illuminated panels, biotech", "premium_equipment"),
    ("laboratory robot collaborative arm idle", "one cleanroom-rated cobot arm over empty deck, automation science", "premium_equipment"),
    ("high-content imaging microscope", "one HCI microscope, environmental chamber stage empty", "premium_equipment"),
    ("spinning disk confocal unit", "one spinning-disk confocal scan unit, premium photonics", "premium_equipment"),
    ("multiphoton microscope laser launch", "one multiphoton laser launch cabinet, deep research optics", "premium_equipment"),
    ("cryo-EM sample preparation workstation", "one cryo-EM prep station, glow-discharge unit, structural biology", "premium_equipment"),
    ("vitrification robot for cryo-EM", "one vitrobot-style plunger, humidity chamber, cryo sample prep", "premium_equipment"),
    ("microtome diamond knife boat", "one ultramicrotome knife boat detail, precision cutting science", "premium_equipment"),
    ("laboratory plasma cleaner chamber", "one plasma cleaner, quartz chamber, surface science", "instruments"),
    ("sputter coater for SEM", "one sputter coater, vacuum bell, materials prep", "instruments"),
    ("critical point dryer", "one CPD instrument, pressure chamber, EM prep", "instruments"),
    ("lab oven forced-air stainless", "one forced-air lab oven, door closed, digital controller", "instruments"),
    ("vacuum oven with acrylic door", "one vacuum oven, gauges, materials curing", "instruments"),
    ("muffle furnace laboratory", "one muffle furnace, ceramic chamber door, high-temp research", "instruments"),
    ("environmental test chamber", "one benchtop environmental chamber, viewport, stability testing", "instruments"),
    ("shaking incubator orbital", "one orbital shaking incubator, platform empty, cell culture support", "sterile_env"),
    ("roller bottle apparatus empty", "one roller apparatus, empty positions, cell culture hardware", "sterile_env"),
    ("hypoxia glovebox incubator hybrid", "one sealed culture workstation, touchscreen, sterile gas mix", "sterile_env"),
    ("cleanroom stainless process vessel", "one small stainless process vessel on cart, sanitary fittings, biopharma", "sterile_env"),
    ("laboratory isolator positive pressure", "one isolator chamber, glove ports empty (no hands), sterile fill aesthetic", "sterile_env"),
    ("lyophilized powder cake macro in vial neck", "extreme macro of white lyophilized cake inside one vial neck, single chamber only", "vials_containers"),
    ("research peptide powder crystal sparkle macro", "macro of white crystalline research powder on black obsidian, no packaging", "vials_containers"),
    ("sealed crimp vial with frozen research solution", "one vial, clear frozen plug, frost on glass, cold-chain research", "vials_containers"),
    ("single amber vial cinematic hero", "exactly one amber vial, septum sealed, cinematic rim light", "vials_containers"),
    ("stainless sterile sampling valve", "one sanitary sampling valve on process pipe, biopharma detail", "sterile_env"),
    ("HEPA fan filter unit ceiling grid", "one FFU in cleanroom ceiling grid, sterile architecture hero", "sterile_env"),
    ("cleanroom pass-through with interlocking lights", "one stainless pass-through chamber, status lights, sterile logistics — not a cardboard box", "sterile_env"),
    ("laboratory glasswash machine interior", "one glasswash chamber interior empty, stainless jets, sterile support", "sterile_env"),
    ("depyrogenation oven tunnel detail", "one depyrogenation oven section, pharma glassware processing", "sterile_env"),
    ("pharmaceutical isolator fill finish mock empty", "one isolator fill-finish deck empty of product, sterile steel, no vials loaded", "sterile_env"),
    ("confocal microscope objective immersion macro", "macro of premium objective lens tip, engraved rings, optical glass perfection", "premium_equipment"),
    ("mass spec ESI source housing", "one electrospray source housing open/closed, analytical MS detail", "premium_equipment"),
    ("HPLC diode array detector module", "one DAD module, fiber optics ports, chromatography stack", "premium_equipment"),
    ("fraction collector carousel empty", "one fraction collector, empty carousel positions, purification lab", "premium_equipment"),
    ("laboratory balance anti-vibration table", "one granite anti-vibration table with microbalance seated, metrology", "instruments"),
    ("pipette calibration workstation balance", "one pipette calibration balance under draft cover, metrology lab", "instruments"),
    ("multichannel electronic pipette idle", "one electronic multichannel pipette upright in stand, no tip box", "liquid_handling"),
    ("positive displacement pipette research", "one positive-displacement pipette, premium liquid handling tool", "liquid_handling"),
    ("repeater pipette instrument", "one repeater pipette, volume dial, research liquid handling", "liquid_handling"),
    ("bottle-top reagent dispenser on amber bottle", "one bottle-top reagent dispenser seated on amber bottle, precise volume science", "liquid_handling"),
    ("serological pipette controller motorized", "one motorized pipette controller, sterile plastic pipette attached empty", "liquid_handling"),
    ("laboratory aspirator vacuum workstation", "one aspiration workstation, collection bottle, cell culture support", "liquid_handling"),
    ("microfluidic chip on imaging stage", "one microfluidic chip seated on microscope stage, organ-on-chip research", "premium_equipment"),
    ("organ-on-chip perfusion pump", "one microfluidic perfusion pump, tubing manifolds, advanced biology", "premium_equipment"),
    ("super-resolution STED microscope", "one STED microscope body, depletion laser path housing, Nobel-tech aesthetic", "premium_equipment"),
    ("light-sheet microscope chamber", "one light-sheet microscope sample chamber empty, advanced imaging", "premium_equipment"),
    ("cryogenic TEM autoloader", "one cryo-TEM autoloader, frost and steel, structural biology", "premium_equipment"),
    ("focused ion beam SEM dual beam", "one FIB-SEM dual-beam column, nanofabrication research", "premium_equipment"),
    ("laboratory Raman probe immersion head", "one Raman immersion probe head, process analytical technology", "qc_analytical"),
    ("NIR spectrometer process head", "one NIR process spectrometer head, PAT biopharma", "qc_analytical"),
    ("laboratory viscometer cone-plate", "one cone-plate viscometer, rheology QC", "qc_analytical"),
    ("tensiometer pendant drop", "one optical tensiometer, camera and stage, surface science", "qc_analytical"),
    ("microcalorimeter isothermal titration", "one ITC instrument, titration syringe housing, biophysics", "qc_analytical"),
    ("surface plasmon resonance instrument", "one SPR biosensor instrument, optics block, binding kinetics", "premium_equipment"),
    ("biolayer interferometry instrument", "one BLI instrument, sensor tray empty, biologics QC", "premium_equipment"),
    ("capillary electrophoresis system", "one CE instrument, cartridge bay, analytical separations", "premium_equipment"),
    ("amino acid analyzer", "one AAA instrument, ninhydrin chemistry aesthetic, protein research", "qc_analytical"),
    ("peptide synthesizer benchtop", "one automated peptide synthesizer, valve blocks, research chemistry — empty bottles aesthetic ok", "premium_equipment"),
    ("microwave peptide synthesizer", "one microwave-assisted synthesizer, cavity closed, chemistry research", "premium_equipment"),
    ("flash chromatography system", "one flash chromatography instrument, column seated empty fraction path", "premium_equipment"),
    ("preparative HPLC system", "one prep HPLC, large column, purification suite", "premium_equipment"),
    ("laboratory hydrogen generator", "one H2 generator for GC, steel chassis, analytical support", "instruments"),
    ("zero air generator laboratory", "one zero-air generator, GC support hardware", "instruments"),
    ("nitrogen generator membrane", "one N2 generator, LC-MS support, clean utility aesthetic", "instruments"),
    ("laboratory chillers recirculating", "one recirculating chiller, status display, instrument support", "instruments"),
    ("turbomolecular vacuum pump", "one turbopump on a vacuum chamber stub, high-vacuum science", "instruments"),
    ("quartz crystal microbalance", "one QCM instrument, sensor head, surface science", "qc_analytical"),
    ("ellipsometer spectroscopic", "one spectroscopic ellipsometer, goniometer arms, thin-film metrology", "qc_analytical"),
    ("profilometer optical 3D", "one optical profilometer, scan head over empty stage", "qc_analytical"),
    ("hardness tester micro-Vickers", "one microhardness tester, diamond indenter, materials lab", "qc_analytical"),
    ("tensile tester universal frame", "one small UTM frame, grips empty, materials testing", "instruments"),
    ("dynamic mechanical analyzer", "one DMA instrument, clamps empty, polymer science", "qc_analytical"),
    ("thermogravimetric analyzer", "one TGA, furnace head, thermal analysis", "qc_analytical"),
    ("simultaneous DSC-TGA analyzer", "one STA instrument, dual thermal analysis", "qc_analytical"),
    ("mercury porosimeter", "one porosimeter, pressure vessel, materials characterization", "qc_analytical"),
    ("BET surface area analyzer", "one physisorption analyzer, dewar station, catalyst research", "qc_analytical"),
    ("chemisorption analyzer", "one chemisorption instrument, quartz reactor tube, catalysis", "qc_analytical"),
    ("glove-safe sterile isolator window", "one isolator viewing window with sterile interior empty deck, no hands", "sterile_env"),
    ("VHP biodecontamination generator", "one VHP generator unit, sterile facility equipment", "sterile_env"),
    ("cleanroom particle monitoring sensor", "one fixed particle sensor on stainless wall, GMP monitoring", "sterile_env"),
    ("aseptic filling needle assembly idle no fluid", "one aseptic filling needle block idle over empty path, no product, sterile steel — no injection into skin", "sterile_env"),
    ("lyophilization stoppering shelf mechanism", "one lyophilizer shelf mechanism only, no vials nested, pharma hardware", "premium_equipment"),
    ("research-grade inverted microscope with camera", "one inverted microscope with research camera, stage empty", "premium_equipment"),
    ("phase contrast microscope", "one phase-contrast compound microscope, condenser detail", "premium_equipment"),
    ("polarized light microscope", "one petrographic / polarized microscope, rotating stage", "premium_equipment"),
    ("digital pathology slide scanner", "one whole-slide scanner, empty stage path, diagnostics research hardware", "premium_equipment"),
    ("laboratory microtome cryostat dual", "one cryostat-microtome combo, frost chamber, histology", "premium_equipment"),
    ("electronic single-channel pipette in charge stand", "one premium single-channel electronic pipette in charge stand, no tip rack", "liquid_handling"),
]

QUALITY = (
    "ultra detailed, extremely detailed, hyper-detailed, razor sharp focus, tack sharp, "
    "crystal clear, ultra sharp, 8k resolution, photorealistic, hyperrealistic, ultra realistic, HDR, "
    "cinematic product photography, premium science catalog, museum-quality still"
)

SURFACES = [
    "polished black reflective acrylic with crisp mirror reflection",
    "matte pure white cyclorama with soft contact shadow",
    "brushed stainless steel lab bench with linear grain highlights",
    "dark charcoal epoxy resin countertop with subtle sparkle",
    "obsidian glass plate with deep reflection",
    "mirrored chrome instrument deck catching rim light",
    "white melamine cleanroom table with clinical clarity",
    "textured graphite slate sample board",
    "anodized navy aluminum deck plate",
    "frosted optical glass riser on black field",
    "wet-look black porcelain tile",
    "pearl quartz lab surface",
]
LIGHTING = [
    "dramatic dual rim lights with cool cyan edge and warm key",
    "hard beauty dish key with deep controlled shadows",
    "cool clinical blue-white LED with specular glass caustics",
    "low-key cinematic spotlight on subject, velvet falloff",
    "high-gloss catalog cross-light showing material microtexture",
    "soft overhead softbox plus razor rim separation",
    "split complementary lab lighting, teal and amber accents",
    "fiber-optic accent kiss on metal edges",
    "backlit translucent glow through glass or polymer only when physically real",
    "macro ring-light even field for scientific detail",
]
# Distinct CAMERA MOTIONS for Grok video — one per creation, rotated.
# Avoid defaulting every row to orbit/rotate (that made every vidgen look the same).
CAMERA = [
    "slow push-in from medium hero to macro label detail, no orbit",
    "gentle vertical rise from base to top of subject, locked center, no orbit",
    "lateral parallax slide left-to-right past specular highlights, no orbit",
    "locked tripod editorial hold with subtle breathing push-in only, no orbit",
    "top-down descend into geometric catalog composition, no orbit",
    "low-angle tilt-up power reveal from underside to eye level, no orbit",
    "start extreme macro on material texture then pull back to full hero, no orbit",
    "diagonal dolly past the subject with focus locked on center, no orbit",
    "crane-down from high three-quarter to eye-level hero settle, no orbit",
    "static catalog hold with micro focus rack only, camera body does not orbit",
    "side-profile track then settle on three-quarter facing angle, no full circle",
    "soft pedestal up while light wrap shifts on metal edges, no orbit",
    "slow push-out from tight crop to full product in frame, no orbit",
    "arc of at most 30 degrees then hold — never a full rotation",
    "handheld-stable micro drift forward only, scientific documentary energy, no orbit",
    "rise-and-settle: short vertical lift then lock off on the label plane, no orbit",
]
COLOR_GRADE = [
    "cool steel and ice-blue science grade",
    "high-contrast black and silver premium grade",
    "crisp white clinical high-key grade",
    "teal-and-amber cinematic lab grade",
    "warm tungsten accents on cold metal grade",
    "neutral color-true pharmaceutical catalog grade",
]
HERO_STYLE = [
    "Apple-keynote product intensity, still fully laboratory-real",
    "Vogue-still life precision for a scientific object",
    "NASA hardware documentary sharpness",
    "luxury watch-ad lighting adapted to lab equipment",
    "museum exhibit spotlight on a single artifact",
    "editorial science magazine cover energy",
]


def interleave_by_category(rows: list[dict]) -> list[dict]:
    """Order rows so every rank differs in category from the row above and below.

    Rotates through all categories (round-robin), never repeating a category
    on adjacent ranks.
    """
    from collections import deque

    buckets: dict[str, deque] = defaultdict(deque)
    for r in rows:
        buckets[r["category"]].append(r)

    # Fixed daily rotation — never the same category on adjacent ranks.
    # packaging removed; premium_equipment + sterile_env preferred.
    cat_order = [
        "premium_equipment",
        "vials_containers",
        "instruments",
        "sterile_env",
        "glassware",
        "qc_analytical",
        "research_pens",
        "liquid_handling",
        "cold_chain",
        "surfaces_org",
        "ppe_sterile",
    ]
    # Include any unexpected categories at the end
    for c in sorted(buckets.keys()):
        if c not in cat_order:
            cat_order.append(c)

    out: list[dict] = []
    prev = None

    while any(buckets.values()):
        progress = False
        for cat in cat_order:
            if not buckets[cat]:
                continue
            if cat == prev:
                continue
            out.append(buckets[cat].popleft())
            prev = cat
            progress = True
        if progress:
            continue

        # Only `prev` still has items — tuck into a safe gap (prefer near the end,
        # never dump leftovers at rank 1).
        cat = next(c for c, q in buckets.items() if q)
        item = buckets[cat].popleft()
        inserted = False
        for i in range(len(out), -1, -1):
            left = out[i - 1]["category"] if i > 0 else None
            right = out[i]["category"] if i < len(out) else None
            if left == item["category"] or right == item["category"]:
                continue
            # Keep the opening cycle clean — don't insert into the first 10 ranks
            if i < min(10, len(out)):
                continue
            out.insert(i, item)
            inserted = True
            break
        if not inserted:
            for i in range(len(out), -1, -1):
                left = out[i - 1]["category"] if i > 0 else None
                right = out[i]["category"] if i < len(out) else None
                if left == item["category"] or right == item["category"]:
                    continue
                out.insert(i, item)
                inserted = True
                break
        if not inserted:
            raise SystemExit(
                f"Cannot place leftover category without adjacency: {item['category']}"
            )
        prev = out[-1]["category"]

    for i in range(1, len(out)):
        if out[i]["category"] == out[i - 1]["category"]:
            raise SystemExit(f"Adjacent category at ranks {i}/{i+1}: {out[i]['category']}")
    return out


# Subjects that typically carry a readable product label → must use a real compound name.
LABEL_SUBJECT_RE = re.compile(
    r"\b("
    r"vial|ampule|ampoule|pen|cartridge|bottle|powder|lyophiliz|"
    r"peptide|septum|crimp|stopper|dropper|reagent bottle"
    r")\b",
    re.I,
)

LABEL_CATEGORIES = {
    "vials_containers",
    "research_pens",
}


def load_compound_labels() -> list[str]:
    """Active Palm Beach Vitality compounds for on-product labels (BPC-157, NAD+, …)."""
    path = SHEETS / "1-compounds-all-daily.csv"
    rows = list(csv.DictReader(path.open()))
    labels: list[str] = []
    seen: set[str] = set()
    rows_sorted = sorted(rows, key=lambda r: int(r.get("rotation_order") or 9999))
    for r in rows_sorted:
        if str(r.get("status") or "").strip().lower() != "active":
            continue
        raw = str(r.get("compound_name") or "").strip()
        if not raw:
            continue
        label = raw
        label = label.replace("5 AMINO MQ", "5-Amino-1MQ")
        label = re.sub(r"\s+Pen Program\s*$", "", label, flags=re.I).strip()
        if "Wolverine" in label:
            label = "BPC-157/TB-500"
        # Normalize common casing
        if label.upper() == "SEMAX":
            label = "SEMAX"
        if label.upper() == "NAD+":
            label = "NAD+"
        key = label.lower()
        if key in seen:
            continue
        seen.add(key)
        labels.append(label)
    if len(labels) < 10:
        raise SystemExit(f"Expected compound labels from {path}, got {len(labels)}")
    return labels


def subject_needs_compound_label(name: str, category: str) -> bool:
    cat = (category or "").strip().lower()
    if cat in LABEL_CATEGORIES:
        return True
    return bool(LABEL_SUBJECT_RE.search(name or ""))


def rebuild_prompt(
    idx: int,
    lab_item_id: str,
    name: str,
    detail: str,
    surface: str,
    lighting: str,
    camera: str,
    color_grade: str,
    hero_style: str,
    compound_name: str = "",
) -> str:
    # Intentionally omit creation_id / motif / 000/500 — Grok prints those on products.
    if compound_name:
        label_rule = (
            f"LABEL REQUIREMENT: if any label, sticker, carton panel, or printed text appears on the subject, "
            f"it MUST read exactly '{compound_name}' as the product name (Palm Beach Vitality research compound), "
            f"optionally with a small 'For Laboratory Research Use Only' line. "
            f"Do NOT invent other compound names. Do NOT print LAB codes, creation motifs, or 000/500 counters."
        )
    else:
        label_rule = (
            "LABEL REQUIREMENT: this equipment/scene should have NO product compound label. "
            "Keep manufacturer panels minimal/illegible/blank. "
            "Do NOT print compound names, LAB codes, creation motifs, or 000/500 counters on the subject."
        )
    return (
        f"Photoreal vertical 9:16 Palm Beach Vitality laboratory research catalog still/film, "
        f"exciting premium science equipment photography, chemical research material only. "
        f"PRIMARY SUBJECT (must be clearly recognizable, real laboratory equipment or research material, "
        f"sharp and centered, visually striking, expensive): {name}. "
        f"Physical detail: {detail}. "
        f"Hero style: {hero_style}. "
        f"Setting surface: {surface}. Lighting: {lighting}. "
        f"Intended camera motion for the follow-on film: {camera}. "
        f"Color grade: {color_grade}. "
        f"{label_rule} "
        f"Make the frame feel expensive, cinematic, and scientifically compelling — not a flat boring snapshot. "
        f"{SINGLE_SUBJECT} "
        f"{AVOID}. "
        f"Quality: {QUALITY}. "
        f"For laboratory research use only. Not for human use or consumption."
    )


def rebuild_motion_prompt(
    name: str,
    camera: str,
    lighting: str,
    surface: str,
    idx: int,
    lab_item_id: str,
    compound_name: str = "",
) -> str:
    """Unique prompt for grok_video_start — must differ every creation (like product rotation)."""
    if compound_name:
        label_rule = (
            f"Keep any on-subject label unchanged and readable as '{compound_name}' only "
            f"(Palm Beach Vitality research compound). No motif/LAB/counter text."
        )
    else:
        label_rule = (
            "Do not add product compound labels, creation motifs, LAB codes, or counters onto the subject."
        )
    return (
        f"Photoreal vertical 9:16 Palm Beach Vitality laboratory research catalog film of {name}. "
        f"CAMERA MOTION (follow exactly; do not invent a different move): {camera}. "
        f"Lighting continuity: {lighting}. Surface continuity: {surface}. "
        f"Keep the subject sharp, recognizable, centered, and unchanged from the still. "
        f"Do not default to spinning, orbiting, or rotating around the product unless the "
        f"camera motion above explicitly requests a short arc. "
        f"{label_rule} "
        f"No cardboard boxes, no trays as hero, no people, no hands, no faces, no needles, no injection, no lifestyle. "
        f"For laboratory research use only. Not for human use or consumption."
    )


def is_boring_subject(name: str, category: str) -> bool:
    if (category or "").strip().lower() in {"packaging"}:
        return True
    return bool(BORING_SUBJECT_RE.search(name or ""))


def purge_boxes_trays_packaging(items: list[dict]) -> int:
    """Replace boring box/tray/carton subjects with premium equipment / vials / sterile scenes."""
    pool = [p for p in PREMIUM_POOL if not is_boring_subject(p[0], p[2])]
    if len(pool) < 50:
        raise SystemExit(f"PREMIUM_POOL too small after self-filter: {len(pool)}")
    used_names: set[str] = set()
    pi = 0
    changed = 0

    def next_premium() -> tuple[str, str, str]:
        nonlocal pi
        for _ in range(len(pool) * 3):
            name, detail, cat = pool[pi % len(pool)]
            pi += 1
            key = name.strip().lower()
            if key not in used_names:
                used_names.add(key)
                return name, detail, cat
        name, detail, cat = pool[pi % len(pool)]
        pi += 1
        name = f"{name} research hero"
        used_names.add(name.strip().lower())
        return name, detail, cat

    # First reserve names already kept (non-boring)
    for r in items:
        if not is_boring_subject(r.get("lab_item", ""), r.get("category", "")):
            used_names.add(r["lab_item"].strip().lower())

    for r in items:
        if not is_boring_subject(r.get("lab_item", ""), r.get("category", "")):
            continue
        name, detail, cat = next_premium()
        r["lab_item"] = name
        r["material_detail"] = detail
        r["category"] = cat
        changed += 1
    return changed


CREATION_FIELD_ORDER = [
    "creation_id",
    "rank",
    "lab_item_id",
    "category",
    "lab_item",
    "material_detail",
    "compound_name",
    "scene_brief",
    "quality_var_count",
    "quality_suffix",
    "aspect_ratio",
    "duration_seconds",
    "resolution",
    "model_still",
    "model_video",
    "still_resolution",
    "video_prompt",
    "video_motion_prompt",
    "status",
    "times_used",
    "last_used_at",
    "mod_intro",
    "mod_fact_1",
    "mod_fact_2",
    "mod_fact_3",
    "mod_fact_4",
    "mod_fact_5",
    "mod_disclaimer",
    "surface",
    "lighting",
    "camera_move",
    "color_grade",
    "hero_style",
]


def fix_lab_libraries() -> None:
    items_path = SHEETS / "8-lab-items-500.csv"
    cre_path = SHEETS / "9-lab-item-creations-500.csv"
    items = list(csv.DictReader(items_path.open()))
    creations = list(csv.DictReader(cre_path.open()))
    assert len(items) == 500 and len(creations) == 500

    # Apply replacements on items
    replaced = 0
    for r in items:
        name = r["lab_item"].strip()
        if name in REPLACEMENTS:
            new_name, new_detail = REPLACEMENTS[name]
            r["lab_item"] = new_name
            r["material_detail"] = new_detail
            replaced += 1
        else:
            for old, (new_name, new_detail) in REPLACEMENTS.items():
                if name.lower() == old.lower():
                    r["lab_item"] = new_name
                    r["material_detail"] = new_detail
                    replaced += 1
                    break

    purged = purge_boxes_trays_packaging(items)

    # Ensure unique lab_item names (Grok uniqueness + Sheets clarity)
    seen_names: dict[str, int] = {}
    for r in items:
        key = r["lab_item"].strip().lower()
        if key not in seen_names:
            seen_names[key] = 1
            continue
        seen_names[key] += 1
        r["lab_item"] = f"{r['lab_item']} variant {seen_names[key]}"
        r["material_detail"] = (r.get("material_detail") or "") + " · unique catalog variant"

    # Sync creations from items by lab_item_id before reorder
    item_by_id = {r["lab_item_id"]: r for r in items}
    for c in creations:
        src = item_by_id[c["lab_item_id"]]
        c["lab_item"] = src["lab_item"]
        c["material_detail"] = src["material_detail"]
        c["category"] = src["category"]

    # Interleave categories (both lists stay aligned via lab_item_id)
    items = interleave_by_category(items)
    id_order = [r["lab_item_id"] for r in items]
    cre_by_id = {c["lab_item_id"]: c for c in creations}
    creations = [cre_by_id[i] for i in id_order]

    # Reassign rank + ids sequentially after interleave
    for idx, (it, cr) in enumerate(zip(items, creations), 1):
        lab_item_id = f"LAB-{idx:03d}"
        # keep stable? User sheets already have times_used on old ids.
        # Prefer STABLE lab_item_id from content — remapping IDs breaks their Sheet writebacks.
        # So: keep existing lab_item_id / creation_id, only change rank for pick order.
        pass

    compound_labels = load_compound_labels()
    # Write a small reference file for n8n / designers
    (ROOT / "compound-labels.json").write_text(
        json.dumps(
            {
                "count": len(compound_labels),
                "labels": compound_labels,
                "rule": "Any subject with a readable product label must use one of these compound names.",
            },
            indent=2,
        )
    )

    # Safer: keep IDs stable; only rewrite rank for interleaved order
    labeled_count = 0
    for idx, (it, cr) in enumerate(zip(items, creations), 1):
        it["rank"] = idx
        cr["rank"] = idx
        cr["lab_item"] = it["lab_item"]
        cr["material_detail"] = it["material_detail"]
        cr["category"] = it["category"]
        # Always refresh visual variables so stills stay exciting
        surface = SURFACES[(idx - 1) % len(SURFACES)]
        lighting = LIGHTING[(idx * 3) % len(LIGHTING)]
        camera = CAMERA[(idx * 5) % len(CAMERA)]
        color_grade = COLOR_GRADE[(idx * 7) % len(COLOR_GRADE)]
        hero_style = HERO_STYLE[(idx * 11) % len(HERO_STYLE)]
        needs_label = subject_needs_compound_label(it["lab_item"], it["category"])
        compound_name = compound_labels[(idx - 1) % len(compound_labels)] if needs_label else ""
        if needs_label:
            labeled_count += 1
        it["compound_name"] = compound_name
        cr["compound_name"] = compound_name
        it["surface"] = surface
        it["lighting"] = lighting
        it["camera_move"] = camera
        it["color_grade"] = color_grade
        it["hero_style"] = hero_style
        cr["surface"] = surface
        cr["lighting"] = lighting
        cr["camera_move"] = camera
        cr["color_grade"] = color_grade
        cr["hero_style"] = hero_style
        brief_bits = [
            it["lab_item"],
            hero_style,
            surface,
            lighting,
            camera,
            color_grade,
        ]
        if compound_name:
            brief_bits.insert(1, f"label:{compound_name}")
        cr["scene_brief"] = " · ".join(brief_bits)
        cr["video_prompt"] = rebuild_prompt(
            idx,
            it["lab_item_id"],
            it["lab_item"],
            it["material_detail"],
            surface,
            lighting,
            camera,
            color_grade,
            hero_style,
            compound_name=compound_name,
        )
        cr["video_motion_prompt"] = rebuild_motion_prompt(
            it["lab_item"],
            camera,
            lighting,
            surface,
            idx,
            it["lab_item_id"],
            compound_name=compound_name,
        )
        # Ensure status Active + rotation counters present (like compounds sheet)
        it["status"] = it.get("status") or "Active"
        cr["status"] = cr.get("status") or "Active"
        if not str(cr.get("times_used") or "").strip():
            cr["times_used"] = "0"
        if cr.get("last_used_at") is None:
            cr["last_used_at"] = ""
        if not str(it.get("times_used") or "").strip():
            it["times_used"] = "0"
        if it.get("last_used_at") is None:
            it["last_used_at"] = ""

    # Write
    for path, rows in [
        (SHEETS / "8-lab-items-500.csv", items),
        (SHEETS / "8-lab-items-250.csv", items),
    ]:
        with path.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys()), extrasaction="ignore")
            w.writeheader()
            w.writerows(rows)

    for path, rows in [
        (SHEETS / "9-lab-item-creations-500.csv", creations),
        (SHEETS / "9-lab-item-creations-250.csv", creations),
    ]:
        with path.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=CREATION_FIELD_ORDER, extrasaction="ignore")
            w.writeheader()
            w.writerows(rows)

    (ROOT / "pbvita-500-lab-items.json").write_text(
        json.dumps({"count": 500, "items": items}, indent=2)
    )
    (ROOT / "pbvita-500-lab-item-creations.json").write_text(
        json.dumps({"count": 500, "creations": creations}, indent=2)
    )

    # Verify no dual/twin/pair left in names (allow "multi-dose")
    bad = []
    boring_left = []
    motif_leaks = 0
    for r in items:
        n = r["lab_item"].lower()
        if any(
            x in n
            for x in [
                "dual-chamber",
                "twin-pack",
                "pair of",
                "two research",
                "cluster in",
                "twins",
                "dual pens",
                "dual research",
            ]
        ):
            bad.append(r["lab_item"])
        if is_boring_subject(r["lab_item"], r["category"]):
            boring_left.append(r["lab_item"])
    for c in creations:
        vp = c.get("video_prompt") or ""
        # Old bad pattern baked IDs into the prompt (caused on-product text).
        if re.search(r"creation motif\s+\d+\s*/\s*\d+", vp, re.I):
            motif_leaks += 1
        elif re.search(r"\bLAB-\d{3}\b", vp):
            motif_leaks += 1
    cats = [r["category"] for r in items]
    vial_streak = 1
    max_vial = 1
    for i in range(1, len(cats)):
        if cats[i] == cats[i - 1] == "vials_containers":
            vial_streak += 1
            max_vial = max(max_vial, vial_streak)
        else:
            vial_streak = 1

    labeled_ok = sum(
        1
        for c in creations
        if subject_needs_compound_label(c["lab_item"], c["category"])
        and (c.get("compound_name") or "").strip()
    )
    labeled_missing = [
        c["lab_item"]
        for c in creations
        if subject_needs_compound_label(c["lab_item"], c["category"])
        and not (c.get("compound_name") or "").strip()
    ]
    print(f"Replaced {replaced} multi-subject items")
    print(f"Purged boxes/trays/packaging → premium: {purged}")
    print(f"Labeled subjects with compound_name: {labeled_ok} (missing {len(labeled_missing)})")
    print(f"Compound label set size: {len(compound_labels)} → {compound_labels[:8]}…")
    print(f"Max consecutive vials_containers by new rank order: {max_vial}")
    print(f"First 15 categories: {cats[:15]}")
    print(f"Category counts: { {k: cats.count(k) for k in sorted(set(cats))} }")
    print(f"Remaining bad names: {bad or 'none'}")
    print(f"Remaining boring box/tray names: {boring_left[:10] or 'none'}")
    print(f"Prompts still leaking motif/LAB codes: {motif_leaks}")
    print(
        f"Sample rank1: {items[0]['lab_item_id']} {items[0]['category']} "
        f"{items[0]['lab_item'][:40]} label={items[0].get('compound_name')!r}"
    )
    # show a labeled vial sample
    for c in creations:
        if c.get("compound_name") and "vial" in c["lab_item"].lower():
            print(f"Sample labeled vial: {c['lab_item'][:40]} → {c['compound_name']}")
            break


def clean_fact(text: str) -> str:
    t = str(text or "")
    t = re.sub(r"\s*[·•⋅∙.\u00b7]\s*(ref|motif|card|line|cta)\s*\d+\s*$", "", t, flags=re.I)
    t = re.sub(r"\s*[-–—|]\s*(ref|motif|card|line|cta)\s*\d+\s*$", "", t, flags=re.I)
    t = re.sub(r"\s+(ref|motif|card|line|cta)\s*\d+\s*$", "", t, flags=re.I)
    return t.strip()


def clean_intro(text: str) -> str:
    return re.sub(r"\s*\(\s*\d+\s*/\s*\d+\s*\)\s*$", "", str(text or "")).strip()


def fix_text_library() -> None:
    path = SHEETS / "10-creatomate-text-1000.csv"
    rows = list(csv.DictReader(path.open()))
    assert len(rows) == 1000
    for i, r in enumerate(rows, 1):
        tid = (r.get("text_id") or "").strip()
        if not tid:
            r["text_id"] = f"PBVita-Text-{i:04d}"
        r["rank"] = str(i)
        r["mod_intro"] = clean_intro(r.get("mod_intro", ""))
        for k in ("mod_fact_1", "mod_fact_2", "mod_fact_3", "mod_fact_4", "mod_fact_5"):
            r[k] = clean_fact(r.get(k, ""))
        if not (r.get("status") or "").strip():
            r["status"] = "Active"
        if not (r.get("times_used") or "").strip():
            r["times_used"] = "0"
        if r.get("last_used_at") is None:
            r["last_used_at"] = ""

    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    # legacy 500
    path500 = SHEETS / "10-creatomate-text-500.csv"
    with path500.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows[:500])

    print(f"Text library: filled text_ids, cleaned facts/intros, rows={len(rows)}")
    print(f"Sample Text-0001 fact_1={rows[0]['mod_fact_1'][:70]}")


def main() -> None:
    fix_lab_libraries()
    fix_text_library()


if __name__ == "__main__":
    main()
