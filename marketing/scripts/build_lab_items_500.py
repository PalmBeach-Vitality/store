#!/usr/bin/env python3
"""Build 500 unique real lab-item variables + creation prompts."""

from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"

# --- Batch 1 (original 250) loaded from current CSV if present, else rebuild seed ---
# We rebuild both batches deterministically in this script for a clean 500.


def unique_add(bag: list[tuple[str, str, str]], seen: set[str], cat: str, name: str, detail: str) -> None:
    key = name.strip().lower()
    if key in seen:
        return
    seen.add(key)
    bag.append((cat, name.strip(), detail.strip()))


def batch1(seen: set[str]) -> list[tuple[str, str, str]]:
    bag: list[tuple[str, str, str]] = []
    groups = {
        "vials_containers": [
            ("amber glass research vial with rubber stopper", "amber glass, aluminum crimp seal, white rubber stopper, clear fill line"),
            ("clear borosilicate peptide vial upright", "type I borosilicate, 10ml scale markings, sterile cap"),
            ("frosted white research vial with matte label panel", "opaque white glass, flat label face, sealed top"),
            ("dual-chamber lyophilized research vial", "glass vial with lyophilized cake visible, sealed septum"),
            ("screw-cap scintillation vial", "glass body, white screw cap, lab inventory barcode"),
            ("cryovial with silicone gasket cap", "polypropylene cryovial, external threads, color-coded cap insert"),
            ("amber dropper-style research bottle sealed", "amber glass, child-resistant research cap"),
            ("HPLC sample vial with insert", "2ml autosampler vial, PTFE/silicone septum, glass insert"),
            ("headspace vial with crimp cap", "clear glass, aluminum crimp, blue septum"),
            ("amber serum vial lying on side", "20ml amber vial, rubber stopper, reflective glass"),
            ("clear vial cluster in cardboard vial tray", "five vials seated in die-cut tray, labels facing camera"),
            ("vacuum-sealed research vial in foil pouch open flap", "glass vial partially revealed from foil barrier pouch"),
            ("graduated media bottle 100ml", "borosilicate media bottle, blue GL45 cap, volume graduations"),
            ("amber reagent bottle with pour ring", "amber glass reagent bottle, white polypropylene cap"),
            ("sterile water for research bottle", "clear plastic research bottle, tamper band intact"),
            ("glass ampule scored neck sealed", "clear ampule, scored neck ring, liquid fill visible"),
            ("amber ampule on reflective tray", "brown ampule, precise fill, clinical reflection"),
            ("multi-dose research vial with intact seal", "crimp seal unbroken, lot stub area blank"),
            ("clear vial with lyophilized white cake", "freeze-dried plug visible through glass"),
            ("tall chromatography collection vial", "narrow clear vial, labeled rack slot"),
            ("short stubby sample vial with red cap", "wide-mouth sample vial, red screw cap"),
            ("UV-protective amber vial in foam well", "amber vial nested in black foam insert"),
            ("glass vial with PTFE-lined cap", "clear vial, white PTFE liner visible under cap"),
            ("research vial beside matching empty carton", "vial and small white product carton, catalog style"),
            ("pair of matched peptide vials side by side", "identical clear vials, slight fill height difference"),
            ("vial with shrink-band tamper evidence", "clear shrink band over cap and neck"),
            ("cold-labeled vial with frost on glass", "light frost on exterior, cold-chain implication"),
            ("vial standing in stainless steel vial block", "precision machined block holding one vial"),
            ("amber vial backlit to show liquid meniscus", "meniscus sharp, liquid clarity visible"),
            ("clear vial with colored cap insert blue", "blue cap insert, inventory coding"),
            ("research vial on anti-vibration pad", "small black lab pad under vial base"),
            ("septum vial with needle-free research adapter nearby", "adapter as object only, no injection into skin"),
            ("glass vial with desiccant canister beside it", "small desiccant tin next to sealed vial"),
            ("amber vial wrapped in light-protective sleeve", "black sleeve partially covering amber glass"),
            ("clear vial with batch tag string tie", "small paper tag tied to neck, catalog prop"),
            ("vial in clear acrylic display stand", "angled acrylic stand, product-hero pose"),
            ("wide-mouth powder research jar sealed", "clear jar of lyophilized powder, sealed lid"),
            ("amber powder jar with scoop nested on lid", "lab scoop resting on sealed jar, no hands"),
            ("micro-vial 0.5ml with tiny label", "very small vial, macroscopic detail"),
            ("research vial next to calibrated weight set", "vial and stainless calibration weights"),
        ],
        "research_pens": [
            ("pre-filled research pen on matte black acrylic", "clear barrel window, dial collar, capped tip cover on"),
            ("research pen with visible liquid barrel macro", "meniscus and glass barrel detail, cap beside pen"),
            ("precision research pen standing upright", "vertical hero, soft reflection, cap on"),
            ("two research pens parallel on slate", "matched pens, slight angle, clinical spacing"),
            ("research pen cap removed resting beside barrel", "cap and pen as still life, no skin contact"),
            ("research pen on mirrored chrome plate", "hard specular highlights, product catalog"),
            ("research pen with dose window close-up", "numeric window readable, shallow depth"),
            ("cartridge for research pen alone", "glass cartridge with plunger, no pen body"),
            ("research pen in open hard case insert", "foam-cut case, pen seated, lid open"),
            ("research pen beside sealed cartridge blister", "blister pack and pen as kit components"),
            ("frosted research pen body with metal clip", "matte body texture, metal pocket clip"),
            ("transparent research pen showing internal mechanism", "gears/dial visible through clear housing"),
            ("research pen on folded sterile wrap paper", "medical-grade wrap texture, product only"),
            ("research pen low-angle hero on concrete lab bench", "premium American lab aesthetic"),
            ("research pen next to empty packaging tray", "thermoformed tray and pen"),
            ("dual research pens crossed at 15 degrees", "minimal overlap, symmetric composition"),
            ("research pen with color-coded ring marker", "ring marker as inventory ID only"),
            ("research pen barrel filled with clear solution", "optical clarity of liquid emphasized"),
            ("research pen on white infinity cyclorama", "pure catalog seamless background"),
            ("research pen silhouette edge-lit", "rim light outlining form, dark field"),
            ("compact travel research pen shorter body", "shorter form factor, capped"),
            ("research pen components laid out as kit", "barrel, cartridge, cap arranged linearly"),
            ("research pen clipped to lab coat pocket fabric still", "fabric swatch only, no person"),
            ("research pen on brushed aluminum tray", "anodized tray, clinical metal"),
            ("research pen with protective tip shield locked", "safety shield engaged, product-safe"),
        ],
    }
    # For brevity in this file: load prior 250 from the known-good CSV committed earlier via git show if needed.
    # Prefer reading git version of 8-lab-items-250.csv from before expansion.
    return bag


def load_or_fail_batch1() -> list[tuple[str, str, str]]:
    # Read from git HEAD's 250 file - may already be overwritten; use embedded path backup
    p = SHEETS / "8-lab-items-250.csv"
    rows = list(csv.DictReader(p.open()))
    if len(rows) == 250 and rows[-1]["lab_item_id"] == "LAB-250":
        return [(r["category"], r["lab_item"], r["material_detail"]) for r in rows]
    # try 500 file partial
    raise SystemExit(f"Expected 250-row batch1 source, found {len(rows)} in {p}")


def build_batch2(seen: set[str]) -> list[tuple[str, str, str]]:
    bag: list[tuple[str, str, str]] = []

    def add(cat: str, name: str, detail: str) -> None:
        unique_add(bag, seen, cat, name, detail)

    data = {
        "vials_containers": [
            ("cobalt blue glass research vial sealed", "blue glass UV protection, crimp seal"),
            ("clear vial with flip-off seal green", "plastic flip-off button over stopper"),
            ("amber vial with measured fill to shoulder", "fill line at shoulder, clinical clarity"),
            ("twin-pack vials in clear clamshell", "two vials nested, hinged pack"),
            ("vial with RFID collar ring installed", "inventory collar on neck"),
            ("research vial in individual carton window", "window shows glass"),
            ("silicone-coated vial for sticky compounds", "special interior coating sheen"),
            ("vial with colored break-ring neck", "score ring visible"),
            ("heavy-wall pressure vial", "thick glass research vial"),
            ("vial standing in CNC-machined aluminum puck", "precision puck holder"),
            ("clear vial with laser-etched lot panel blank", "etched frosted rectangle"),
            ("amber vial beside silica canister mini", "desiccant neighbor"),
            ("vial rack aluminum 5x10 empty slots with one vial", "mostly empty rack hero"),
            ("crimped vial under magnifying dome lamp light", "inspection lighting"),
            ("research vial with heat-shrink neck band gold", "gold band aesthetic catalog"),
            ("glass vial with plastic overcap tethered", "tethered overcap"),
            ("microbarcoded vial close-up label area", "tiny barcode zone"),
            ("vial in vacuum skin-pack card", "carded vacuum pack"),
            ("clear vial suspended in acrylic block embed mock", "acrylic block display prop"),
            ("amber vial next to calibrated pipette tip", "scale reference still"),
            ("lyo vial with cake cracked texture visible", "lyophilized cake detail"),
            ("vial with nitrogen headspace indication label", "headspace note on label panel"),
            ("research vial on anti-roll hexagonal base adapter", "base adapter"),
            ("glass vial with ceramic print opaque white", "ceramic baked label area"),
            ("vial shipper insert pulp tray single well", "molded pulp tray"),
        ],
        "research_pens": [
            ("research pen with metal nose cone", "metal tip housing, cap on"),
            ("slim research pen graphite gray body", "matte gray finish"),
            ("research pen with translucent smoke barrel", "smoke tint showing liquid"),
            ("research pen docked in display stand prop", "stand is display only"),
            ("research pen beside torque-test fixture", "QA fixture and pen"),
            ("research pen clip detail macro", "metal clip extreme macro"),
            ("research pen rubber grip section macro", "grip texture"),
            ("research pen dial click collar engraved", "collar engraving"),
            ("research pen in vertical acrylic tower", "tower display"),
            ("research pen kit tin open", "metal tin packaging"),
            ("research pen with spare cartridge pair", "two cartridges aligned"),
            ("research pen under polarizing light tent", "soft tent lighting product"),
            ("research pen on carbon-fiber sample plate", "tech plate surface"),
            ("research pen tip-cap forest green", "color-coded tip cap"),
            ("research pen body disassembled halves", "two housing halves, no sharps"),
            ("research pen with serialized sticker blank", "blank serial panel"),
            ("research pen in velvet-lined evaluation box", "evaluation kit box"),
            ("research pen silhouette against soft gradient gray", "catalog silhouette"),
            ("research pen next to thickness gauge", "metrology still"),
            ("research pen capped and uncapped twins", "pair showing both states"),
            ("compact research pen titanium-look shell", "metallic shell"),
            ("research pen with soft-touch overmold", "overmold texture"),
            ("research pen window showing piston position", "piston visible"),
            ("research pen on linen lab wipe folded", "wipe as surface"),
            ("research pen aligned to ruler for scale", "scale reference"),
        ],
        "glassware": [
            ("Schlenk flask with side arm stopcock", "airfree glassware"),
            ("pear-shaped flask", "recovery flask shape"),
            ("filter flask with ceramic Buchner funnel seated", "filtration assembly dry"),
            ("addition funnel graduated", "dropping funnel"),
            ("Claisen adapter glass", "distillation adapter"),
            ("Y-adapter vacuum", "glass adapter"),
            ("cold finger condenser", "cold finger form"),
            ("jacketed beaker", "reaction beaker jacket"),
            ("crystallizer dish jacketed", "temp-controlled dish"),
            ("glass reaction tube sealed", "pressure tube"),
            ("NMR spinner turbine with tube", "spinner and tube"),
            ("cuvette rack acrylic holding four", "cuvette organizer"),
            ("flow cell glass optical", "optical flow cell"),
            ("Soxhlet extractor assembled dry", "extractor glassware"),
            ("Dean-Stark trap", "trap apparatus"),
            ("gas burette", "gas measurement glass"),
            ("pycnometer bottle", "density bottle"),
            ("specific gravity bottle", "glass density ware"),
            ("wide dilution bottle research", "wide dilution bottle"),
            ("media Roux bottle flat", "flat culture bottle"),
            ("roller bottle cell culture empty", "roller bottle"),
            ("spinner flask with impeller", "impeller flask"),
            ("glass desiccator plate alone", "perforated plate"),
            ("weighing bottle tall form", "glass weighing bottle"),
            ("sample bomb cylinder small research closed", "small sample cylinder closed"),
        ],
        "liquid_handling": [
            ("positive displacement capillary tip pack", "capillary tips box"),
            ("gel-loading pipette tips rack", "thin tips"),
            ("wide-bore pipette tips for viscous samples", "wide orifice tips"),
            ("filtered pipette tips sterile rack purple", "purple filter tips"),
            ("pipette calibration balance kit case", "calibration kit"),
            ("bottle-top aspirator", "aspirator unit"),
            ("vacuum aspiration pipette controller", "aspiration tool"),
            ("serological pipette individually wrapped bundle", "wrapped pipettes"),
            ("bulb pipette filler classic", "rubber bulb filler"),
            ("motorized pipette filler", "electronic filler"),
            ("reagent reservoir 12-column", "divided reservoir"),
            ("trough for 16-channel pipette", "wide trough"),
            ("disposable transfer pipette pack", "plastic transfer pipettes"),
            ("Pasteur pipette rubber bulbs bag", "bulbs only"),
            ("syringe pump bare with research syringe glass", "pump and glass syringe no needle"),
            ("microfluidic chip in petri carrier", "chip on dish"),
            ("tubing kit silicone assorted diameters", "coiled tubing"),
            ("quick-connect luer fittings tray", "fittings assortment"),
            ("check valve luer set", "valves"),
            ("in-line filter capsule", "capsule filter"),
            ("sterile media bag empty folded", "bioprocess bag folded"),
            ("bag spike port cover set", "port covers"),
            ("graduated conical tube 50ml rack", "conical tubes in rack"),
            ("conical tube 15ml amber", "amber conical"),
            ("screw-cap microtube amber 2ml", "amber microtube"),
        ],
        "cold_chain": [
            ("validated cold chain tote rigid", "rigid tote"),
            ("probe thermometer in vial sleeve", "probe + sleeve"),
            ("USB temperature logger blister", "logger packaging"),
            ("freeze indicator labels roll", "freeze labels"),
            ("warm indicator labels pack", "heat exposure labels"),
            ("gel pack honeycomb style", "textured gel pack"),
            ("PCM panel flat pack", "phase change panel"),
            ("dry ice chest exterior closed labeled research", "chest exterior"),
            ("cryo label kit freezer-grade", "cryo labels"),
            ("freezer tape roll white", "freezer tape"),
            ("cryobox cardboard 10x10 with partial vials", "partially filled"),
            ("polycarbonate cryobox latch closed", "latched box"),
            ("cold brick stack of two", "stacked bricks"),
            ("insulated bottle carrier for reagents", "carrier"),
            ("refrigerated centrifuge rotor lid", "rotor lid object"),
            ("pre-chilled aluminum tube block", "cold block"),
            ("cooling core for shipper", "replaceable core"),
            ("thermal pallet cover folded", "cover fabric"),
            ("cold chain SOP binder spine only", "binder spine"),
            ("ice sleeve for single conical tube", "tube sleeve"),
            ("frost-free freezer shelf bin labeled research", "bin label research"),
            ("LN2 glove pair boxed", "cryo gloves box"),
            ("face shield for cryo boxed", "shield packaging"),
            ("cryo cane numbered tags", "tags"),
            ("vapor plug for dry shipper", "plug component"),
        ],
        "instruments": [
            ("microplate reader closed", "plate reader instrument"),
            ("qPCR machine lid closed", "thermocycler exterior"),
            ("thermocycler block alone empty", "metal block"),
            ("gel imager darkroom unit closed", "imager"),
            ("western blot transfer tank", "transfer tank"),
            ("rocking platform mixer", "rocker"),
            ("3D nutating mixer", "nutator"),
            ("overhead stirrer motor on stand", "stirrer motor"),
            ("homogenizer probe parked in stand", "probe stand"),
            ("sonic probe tip set", "probe tips"),
            ("lab homogenizer tube adapter", "adapter"),
            ("vacuum concentrator closed", "concentrator exterior"),
            ("lyophilizer chamber exterior", "freeze dryer exterior"),
            ("manifold freeze dryer ports capped", "ports capped"),
            ("rotary evaporator glassware dry assembled", "rotovap glass"),
            ("chiller recirculator compact", "chiller unit"),
            ("lab water bath lid on", "water bath"),
            ("oil bath pot empty clean", "oil bath vessel"),
            ("heating mantle nested sizes", "mantles"),
            ("PID temperature controller box", "controller"),
            ("thermocouple wire spool", "wire spool"),
            ("data acquisition module USB", "DAQ module"),
            ("lab computer terminal blank screen cropped", "terminal only blank"),
            ("balance anti-vibration table section", "table surface"),
            ("ionizer bar over weigh station", "ionizer"),
            ("static gun industrial lab", "ionizing gun"),
            ("particle-free pen for cleanroom labeling", "cleanroom pen"),
            ("cleanroom binder plastic", "binder"),
            ("glove integrity tester unit", "tester"),
            ("seal strength tester grips empty", "tester grips"),
            ("torque tester for caps", "cap torque tool"),
            ("vision inspection camera enclosure", "camera housing"),
            ("label verification scanner tunnel", "scan tunnel"),
            ("metal detector aperture lab pack line", "aperture only"),
            ("checkweigher conveyor section static", "conveyor static product"),
        ],
        "surfaces_org": [
            ("pass-through chamber closed doors", "pass box"),
            ("cleanroom cart with sealed bins", "cart"),
            ("stainless utility cart two shelf", "cart shelves"),
            ("lab stool base only cropped", "base, no person"),
            ("anti-fatigue mat section with tray", "mat + tray"),
            ("chemical storage cabinet closed flammable", "yellow cabinet closed"),
            ("acid cabinet blue closed", "blue cabinet"),
            ("gas cylinder restraint chain detail", "restraint hardware, no hazard scene"),
            ("cylinder cap and valve cover", "cap hardware"),
            ("bench linear organizer with vials pens", "organizer loaded"),
            ("drawer organizer custom vial wells", "custom wells"),
            ("wall-mounted glove dispenser empty slots", "dispenser"),
            ("paper towel dispenser stainless lab", "dispenser"),
            ("hands-free sensor trash can closed lab", "bin closed"),
            ("recycling bin for tip boxes labeled", "recycling"),
            ("floor marked tape grid sample", "tape grid"),
            ("cleanroom light panel glow on products", "products under panel"),
            ("HEPA filter grill exterior", "grill"),
            ("magnehelic gauge on wall", "pressure gauge"),
            ("room differential pressure display", "display"),
            ("interlocking pass cart", "cart"),
            ("gowning bench empty", "bench no person"),
            ("bootie dispenser box", "dispenser box"),
            ("gowning mirror frame empty soft reflection", "empty mirror area soft"),
            ("step-over bench cleanroom", "bench"),
        ],
        "packaging": [
            ("unit dose blister of research cartridges five", "five-count blister"),
            ("child-resistant research vial cap assortment", "CR caps"),
            ("induction-sealed bottle mouth macro", "seal wad macro"),
            ("carton with perforation tear strip", "tear strip"),
            ("mailer with foam corners kit", "protective corners"),
            ("rigid plastic vial wallet", "wallet case"),
            ("aluminum bottle for light-sensitive reagent", "alu bottle"),
            ("pump spray research solvent bottle empty", "spray bottle"),
            ("dropper assembly components laid out", "bulb and pipette parts no drug use scene"),
            ("measuring scoop nested sizes", "scoops"),
            ("desiccant canister indicating unused", "indicator desiccant"),
            ("humidity control pack for cabinets", "cabinet pack"),
            ("tamper sleeve on carton", "sleeve"),
            ("security tape on shipper seam", "tape seam"),
            ("QR code label sheet blank destination", "QR labels"),
            ("lot sticker sheets color coded", "stickers"),
            ("pack insert accordion folded", "insert"),
            ("silica gel pillow packs", "pillows"),
            ("foam-in-place corner blocks", "corners"),
            ("molded pulp egg-crate for vials", "pulp tray"),
            ("PET clam for dual pens", "dual clam"),
            ("kraft tube mailer for pen", "tube mailer"),
            ("windowless matte black carton research", "black carton"),
            ("soft-touch laminate carton", "soft touch pack"),
            ("carton with embossed logo blank area", "emboss panel"),
        ],
        "ppe_sterile": [
            ("sterile gown packaged barrier fabric", "gown pack"),
            ("sleeve protector pair packaged", "sleeves"),
            ("cleanroom goggles sealed bag", "goggles"),
            ("ear plugs dispenser bottle", "dispenser"),
            ("cut-resistant glove pair folded", "gloves objects"),
            ("cryo apron folded", "apron"),
            ("chemical apron neoprene folded", "apron"),
            ("respirator cartridges in pack unused", "cartridges sealed"),
            ("half-mask respirator unused on tray", "mask object no wearing"),
            ("safety glasses anti-fog cloth kit", "cloth kit"),
            ("finger cots box", "finger cots"),
            ("sterile gloves individually wrapped pair", "pair wrap"),
            ("cleanroom paper ream", "paper"),
            ("cleanroom notebooks pack", "notebooks"),
            ("sticky roller for garments", "lint roller"),
            ("garment bag hanging empty", "bag"),
            ("laundry hamper closed cleanroom", "hamper"),
            ("PPE size placard stand", "placard"),
            ("eye wash sign placard only", "sign"),
            ("spill sock absorbent coiled", "sock"),
            ("neutralizer powder bottle", "bottle"),
            ("chemical absorbent pads stack", "pads"),
            ("waste bag stand with labeled bag empty", "stand"),
            ("sharps container wall bracket empty mount", "bracket"),
            ("biohazard label roll", "labels"),
        ],
        "qc_analytical": [
            ("mass spectrometer inlet detail idle", "instrument detail idle"),
            ("LC column oven door closed", "oven door"),
            ("autosampler tray with vials partial", "tray"),
            ("GC column box", "column box"),
            ("helium cylinder regulator detail", "regulator"),
            ("zero air generator compact", "generator"),
            ("TOC analyzer exterior", "analyzer"),
            ("dissolution apparatus basket idle", "basket apparatus"),
            ("hardness tester for solid research materials", "tester"),
            ("friability drum open empty", "drum"),
            ("tap density tester", "tester"),
            ("sieve stack for powders", "sieves"),
            ("laser diffraction sample cell", "cell"),
            ("zeta potential cuvette", "cuvette"),
            ("rheometer geometry plate", "plate"),
            ("DSC pan kit", "pans"),
            ("TGA crucible set", "crucibles"),
            ("FTIR window salt plate kit", "plates"),
            ("IR card holder", "holder"),
            ("UV calibration standards set", "standards"),
            ("fluorescence standards kit", "kit"),
            ("plate seal roller", "roller"),
            ("plate centrifuge adapter", "adapter"),
            ("multimode plate with empty standard wells", "plate"),
            ("reference electrode storage bottle", "bottle"),
        ],
        "product_hero": [
            ("research vial and pen duo on tiered riser", "duo SKU display"),
            ("sealed peptide carton family of three sizes", "size run"),
            ("inventory tote with sorted vials by color cap", "sorted tote"),
            ("QA quarantine shelf bin red tag", "quarantine bin"),
            ("released inventory green tag bin", "released bin"),
            ("sample retain cabinet drawer ajar vials", "retain drawer"),
            ("stability chamber window view shelves vials", "chamber window"),
            ("photostability chamber closed", "chamber"),
            ("light box for pack photography with vial", "light box"),
            ("turntable product photography with pen", "turntable"),
            ("boom arm softbox over stainless tray products", "softbox setup"),
            ("color checker card beside carton", "color checker"),
            ("gray card with research pen", "gray card"),
            ("macro rail focused on vial stopper", "macro rail"),
            ("focus stacking rail and vial", "rail"),
            ("polarized film sheets with glass vial", "polarizers"),
            ("optical breadboard with clamp holding pipette", "breadboard"),
            ("lab jack and vial for precision height", "height setup"),
            ("parallel bars prop holding two pens", "display bars"),
            ("museum putty dots under tiny vial", "invisible mount"),
            ("acrylic cube riser nest of three", "risers"),
            ("black velvet tray with vial clinical catalog", "velvet tray clinical not jewelry ad"),
            ("mirrored riser infinity with pen", "infinity riser"),
            ("soft foam product cradle custom cut", "cradle"),
            ("clamshell foam paired inserts", "foam pair"),
        ],
    }

    for cat, pairs in data.items():
        for name, detail in pairs:
            add(cat, name, detail)

    # pad to exactly 250 new with systematic catalog variants
    bases = [
        ("vials_containers", "catalog clear research vial"),
        ("vials_containers", "catalog amber research vial"),
        ("research_pens", "catalog research pen"),
        ("glassware", "catalog graduated cylinder"),
        ("liquid_handling", "catalog micropipette"),
        ("packaging", "catalog research carton"),
        ("qc_analytical", "catalog calibration bottle"),
        ("product_hero", "catalog vial and pen set"),
    ]
    modifiers = [
        "matte label panel blank",
        "gloss label panel blank",
        "lot stub area empty",
        "on hexagonal steel puck",
        "on white ceramic lab coaster",
        "on black glass plate",
        "on cork lab ring",
        "in clinical shadow-box frame",
        "under acrylic dust cover",
        "with serialized hang tag blank",
        "with silicone bumper base",
        "in foam coin slot",
        "beside unused matching cap",
        "with controlled reflection catch light",
        "edge-lit for glass caustics",
        "backlit catalog silhouette",
        "three-quarter hero angle",
        "top-down flat lay",
        "forty-five degree catalog angle",
        "macro of seal interface",
        "on anti-slip lab mesh",
        "in numbered inventory slot",
        "with scale ruler in frame",
        "with softbox catchlights only",
        "on chilled aluminum plate dry",
    ]
    i = 0
    while len(bag) < 250:
        cat, base = bases[i % len(bases)]
        mod = modifiers[(i // len(bases)) % len(modifiers)]
        add(cat, f"{base} {mod}", f"photoreal catalog still, {mod}, real lab object only")
        i += 1
        if i > 10000:
            break

    if len(bag) > 250:
        bag = bag[:250]
    if len(bag) != 250:
        raise SystemExit(f"batch2 size {len(bag)}")
    return bag


def write_all(all_raw: list[tuple[str, str, str]]) -> None:
    surfaces_pool = [
        "polished black reflective acrylic",
        "matte pure white infinity surface",
        "brushed stainless steel lab bench",
        "dark charcoal epoxy resin countertop",
        "cool gray ceramic tile",
        "mirrored chrome instrument tray",
        "white melamine cleanroom table",
        "textured slate sample board",
        "soft gray seamless paper backdrop",
        "anodized aluminum tray",
    ]
    lighting_pool = [
        "soft rim light from behind",
        "cool clinical blue-white LED",
        "single hard key light with controlled fill",
        "soft overhead softbox, even catalog lighting",
        "warm neutral side light, still clinical",
        "split soft key and gentle bounce",
        "high-key seamless catalog lighting",
        "low-key selective highlight on glass edges",
    ]
    camera_pool = [
        "slow 360 degree orbit at eye level",
        "extreme macro push-in",
        "gentle top-down descending move",
        "locked tripod hero frame with subtle push",
        "low angle tracking slide",
        "circular arc that never fully completes",
        "vertical rise from base to label",
        "fast resolve into locked hero frame",
    ]
    quality = (
        "ultra detailed, extremely detailed, hyper-detailed, razor sharp focus, tack sharp, "
        "crystal clear, ultra sharp, 8k resolution, photorealistic, hyperrealistic, ultra realistic, HDR"
    )
    avoid = (
        "No abstract shapes, no glass orbs, no crystal balls, no surreal spheres, no CGI blobs, "
        "no nebula, no galaxies, no fantasy energy, no particle portals, no impossible geometry, "
        "no melting objects, no dreamscape, no people, no faces, no hands, no bare skin, "
        "no needles penetrating skin, no injection act, no clinic patient scene, no gym, "
        "no lifestyle, no wellness claims, no nicknames, no supplements aesthetic"
    )

    items = []
    creations = []
    for idx, (cat, name, detail) in enumerate(all_raw, 1):
        lab_item_id = f"LAB-{idx:03d}"
        surface = surfaces_pool[(idx - 1) % len(surfaces_pool)]
        lighting = lighting_pool[(idx - 1) % len(lighting_pool)]
        camera = camera_pool[(idx - 1) % len(camera_pool)]
        items.append(
            {
                "lab_item_id": lab_item_id,
                "rank": idx,
                "category": cat,
                "lab_item": name,
                "material_detail": detail,
                "surface": surface,
                "lighting": lighting,
                "camera_move": camera,
                "status": "Active",
                "times_used": 0,
                "last_used_at": "",
            }
        )
        video_prompt = (
            f"Photoreal vertical 9:16 Palm Beach Vitality laboratory research catalog film, "
            f"chemical research material only, premium American research aesthetic. "
            f"PRIMARY SUBJECT (must be clearly recognizable, real laboratory object, sharp and centered): {name}. "
            f"Physical detail: {detail}. "
            f"Setting surface: {surface}. Lighting: {lighting}. Camera: {camera}. "
            f"{avoid}. "
            f"Quality: {quality}. "
            f"creation motif {idx:03d}/500 · {lab_item_id}. "
            f"Keep product identity and any on-screen research typography sharp and unchanged. "
            f"For laboratory research use only. Not for human use or consumption."
        )
        creations.append(
            {
                "creation_id": f"PBVita-Lab-{idx:03d}",
                "rank": idx,
                "lab_item_id": lab_item_id,
                "category": cat,
                "lab_item": name,
                "material_detail": detail,
                "scene_brief": f"{name} on {surface}, {lighting}, {camera}",
                "quality_var_count": 12,
                "quality_suffix": quality,
                "aspect_ratio": "9:16",
                "duration_seconds": 8,
                "resolution": "1080p",
                "model_still": "grok-imagine-image-quality",
                "model_video": "grok-imagine-video-1.5",
                "still_resolution": "2k",
                "video_prompt": video_prompt,
                "status": "Active",
                "times_used": 0,
                "last_used_at": "",
            }
        )

    SHEETS.mkdir(exist_ok=True)
    for name, rows in [
        ("8-lab-items-500.csv", items),
        ("9-lab-item-creations-500.csv", creations),
        ("8-lab-items-250.csv", items),  # superseded: now full 500 (compat path)
        ("9-lab-item-creations-250.csv", creations),
    ]:
        path = SHEETS / name
        with path.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            w.writeheader()
            w.writerows(rows)

    payload_items = {
        "count": 500,
        "rule": "ONLY these lab items may be used as image/video subject variables",
        "items": items,
    }
    payload_creations = {"count": 500, "creations": creations}
    for path in [
        ROOT / "pbvita-500-lab-items.json",
        ROOT / "pbvita-250-lab-items.json",
    ]:
        path.write_text(json.dumps(payload_items, indent=2))
    for path in [
        ROOT / "pbvita-500-lab-item-creations.json",
        ROOT / "pbvita-250-lab-item-creations.json",
    ]:
        path.write_text(json.dumps(payload_creations, indent=2))

    print(f"Wrote 500 items/creations. Sample 001={creations[0]['lab_item'][:50]}")
    print(f"Sample 251={creations[250]['lab_item'][:60]}")
    print(f"Sample 500={creations[499]['lab_item'][:60]}")


def main() -> None:
    # Restore batch1 from git if current file already expanded
    import subprocess

    raw = subprocess.check_output(
        ["git", "show", "d46ef44:marketing/sheets/8-lab-items-250.csv"],
        cwd=ROOT.parent,
    ).decode()
    import io

    rows = list(csv.DictReader(io.StringIO(raw)))
    assert len(rows) == 250, len(rows)
    batch1_rows = [(r["category"], r["lab_item"], r["material_detail"]) for r in rows]
    seen = {n.lower() for _, n, _ in batch1_rows}
    b2 = build_batch2(seen)
    all_raw = batch1_rows + b2
    assert len(all_raw) == 500
    assert len({n.lower() for _, n, _ in all_raw}) == 500
    write_all(all_raw)


if __name__ == "__main__":
    main()
