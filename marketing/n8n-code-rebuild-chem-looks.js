// n8n Code node: rebuild_chem_looks
// Workflow: chem_looks_stagger_overlay (one-shot)
// Mode: Run Once for Each Item. Execute Once OFF.
// After: get_chem_creations  Before: sheets_update_chem_looks
// Overlays 6-way staggered looks. Does NOT emit times_used / last_used_at.

var LOOKS = {"SHOTS": [{"shot_family": "push_in", "camera_angle": "eye-level", "camera_direction": "forward", "framing": "9:16, reaction plane mid-frame, finishes closer, shallow DOF", "camera_move": "slow push-in as amino acids dock and peptide bonds flash, then hold"}, {"shot_family": "pull_back", "camera_angle": "slight-high", "camera_direction": "backward", "framing": "9:16, starts tight on a forming bond, reveals the full cell", "camera_move": "slow pull-back from a flashing peptide bond to the whole living cell, then hold"}, {"shot_family": "vertical_rise", "camera_angle": "slight-low", "camera_direction": "up", "framing": "9:16, starts at the lower membrane, rises along the reaction", "camera_move": "slow vertical rise along the bilayer as amino acids lock into the chain, then hold"}, {"shot_family": "lateral_drift", "camera_angle": "three-quarter-left", "camera_direction": "left to right", "framing": "9:16, slides along the membrane edge, reaction stays sharp", "camera_move": "slow lateral drift along the membrane as monomers collide and bonds flash, then hold"}, {"shot_family": "macro_detail", "camera_angle": "macro-plane", "camera_direction": "micro-push", "framing": "9:16, extreme close on two amino acids forming a peptide bond", "camera_move": "creeping macro push onto the bond-forming atoms with a single energy flash, then hold"}, {"shot_family": "static_lock", "camera_angle": "low-angle", "camera_direction": "no travel / locked", "framing": "9:16, locked volume, peptide chain growing in place, shallow DOF", "camera_move": "locked tripod, amino acids stream in and lock onto the growing chain with bond flashes"}], "SURFACES": [{"surface": "living cell lipid bilayer, wet receptors, extracellular fluid", "category": "chem_membrane", "lab_item": "Chemical breakdown \u2014 amino-acid reaction at the cell membrane", "hero_style": "membrane docking \u2014 amino acids assembling a peptide at a living cell", "env": "DARK cinematic 3D medical animation at the OUTER membrane of a living cell. Lipid-bilayer, wet receptors, extracellular fluid. Amino-acid monomers swarm, dock, and form peptide bonds with energy flashes. A forming chain grows at a receptor. NOT a photography studio. NOT a white cyclorama. NOT a glass pedestal."}, {"surface": "cytoplasm among organelles, ribosome-like machinery, wet protein mesh", "category": "chem_cytosol", "lab_item": "Chemical breakdown \u2014 intracellular amino-acid condensation", "hero_style": "cytosol condensation \u2014 amino acids locking into a peptide chain", "env": "DARK cinematic 3D medical animation INSIDE a living cell. Cytoplasm, organelle silhouettes, wet protein mesh. Amino-acid monomers stream toward a growing peptide and condense \u2014 each new bond a sharp chemical flash. Nucleus or mitochondrion in bokeh. NOT a sunlit showroom. NOT a product catalog set. NOT a glass pedestal."}, {"surface": "mitochondrial inner membrane, cristae folds, dense matrix", "category": "chem_mito", "lab_item": "Chemical breakdown \u2014 mitochondrial-membrane peptide assembly", "hero_style": "cristae reaction \u2014 amino acids assembling along inner membrane folds", "env": "DARK cinematic 3D medical animation at a mitochondrion. Cristae folds, dense matrix, inner membrane. Amino acids collide along the membrane and form peptide bonds with brief energy flashes. Living-cell chemistry, not a catalog still. NOT a photography studio. NOT a glass pedestal."}, {"surface": "nuclear envelope pore, chromatin bokeh, nucleoplasm edge", "category": "chem_nucleus", "lab_item": "Chemical breakdown \u2014 nuclear-envelope peptide reaction", "hero_style": "nuclear-pore reaction \u2014 amino acids assembling at the envelope edge", "env": "DARK cinematic 3D medical animation at the nuclear envelope. A nuclear pore, chromatin bokeh, nucleoplasm edge. Amino-acid monomers gather at the pore and form peptide bonds with wispy electron-cloud filaments. NOT a spa. NOT a white cyclorama. NOT a glass pedestal."}, {"surface": "endoplasmic reticulum cisternae, ribosome-studded membrane", "category": "chem_er", "lab_item": "Chemical breakdown \u2014 ER-membrane peptide condensation", "hero_style": "ER cisternae reaction \u2014 amino acids condensing on a ribosome-studded membrane", "env": "DARK cinematic 3D medical animation on endoplasmic reticulum. Stacked cisternae, ribosome-studded membrane. Amino acids condense into a growing peptide along the ER surface with bond flashes. Active reaction, not a floating molecule. NOT a sunlit studio. NOT a glass pedestal."}, {"surface": "vesicle docking field, cytosolic haze, membrane fusion sites", "category": "chem_vesicle", "lab_item": "Chemical breakdown \u2014 vesicle-docking peptide reaction", "hero_style": "vesicle-field reaction \u2014 amino acids assembling at docking sites", "env": "DARK cinematic 3D medical animation in a vesicle docking field. Cytosolic haze, membrane fusion sites. Amino-acid monomers cluster at a docking patch and form peptide bonds with energy flashes. Living-cell chemistry. NOT a product stand. NOT a white cyclorama. NOT a glass pedestal."}], "LIGHTINGS": ["dramatic subsurface glow from cytoplasm; reaction sparks at forming bonds", "backlit cytoplasmic bloom plus hard spec on reacting amino-acid atoms", "low-key rim light along the membrane; bond flashes as the only key", "volumetric caustic shafts through translucent cytoplasm", "cool bioluminescent fill with a warm flash at each peptide bond", "dark-field microscope look: near-black surround, luminous atoms"], "COLOR_GRADES": ["cool microscopic medical grade, luminous amino acids vs navy cell", "high-contrast intracellular biotech: luminous bonds vs deep navy cytoplasm", "teal-and-gold mitochondrial grade, warm bond sparks", "violet-cyan night-lab grade, ice-blue amino acids", "emerald cytosol grade, rose-gold peptide bonds", "copper-amber organelle grade, cool cyan highlights"], "STILL_EDIT": "CRITICAL VIBE FIX: This must be an IN-PROGRESS cellular chemical reaction, not a catalog product still. Replace any sunlit studio, white cyclorama, glass pedestal, spa, or floating lone molecule on a stand with a DARK microscopic living-cell scene: lipid-bilayer cell membrane, cytoplasm, amino-acid ball-and-stick monomers colliding and forming peptide bonds with energy flashes. DELETE every logo, palm tree, watermark, URL, caption, letter, number, and label. BLANK frame \u2014 no typography anywhere. No vials, no pens, no people. Do not restyle into a cartoon. Keep the row's SURFACE, LIGHTING, COLOR GRADE, and CAMERA MOVE."};

function lookForRank(rank) {
  var i = Number(rank) - 1;
  if (!isFinite(i) || i < 0) throw new Error('rebuild_chem_looks: bad rank ' + rank);
  var shot = LOOKS.SHOTS[i % 6];
  var surface = LOOKS.SURFACES[(i + 1) % 6];
  var lighting = LOOKS.LIGHTINGS[(i + 2) % 6];
  var color_grade = LOOKS.COLOR_GRADES[(i + 3) % 6];
  var look = {};
  Object.keys(shot).forEach(function (k) { look[k] = shot[k]; });
  Object.keys(surface).forEach(function (k) { look[k] = surface[k]; });
  look.lighting = lighting;
  look.color_grade = color_grade;
  return look;
}

function moleculeLock(name) {
  return (
    "HARD OUTPUT LOCK: a cellular-level CHEMICAL REACTION featuring the peptide '" + name + "'. " +
    "Show living cells AND amino acids actually reacting (bonds forming, docking, condensation). " +
    "Cinematic photoreal 3D medical animation — not cartoon, not sketch, not product photography. " +
    "NO TEXT anywhere: no letters, numbers, captions, titles, compound-name overlay, labels. " +
    "NO LOGO, NO palm tree, NO watermark, NO URL, NO brand mark. " +
    "No vial, no pen, no syringe, no people, no packaging. " +
    "Use '" + name + "' only as the unseen scientific subject — never render it as readable type."
  );
}

function closingLock() {
  return " FINAL CHECK: this is a living-cell chemical reaction with amino acids, not a studio product shot. Zero typography. Zero logos. No vials. No pens.";
}

function videoPrompt(name, look, mol) {
  return (
    moleculeLock(name) + " Vertical 9:16 chemical-reaction still — DARK microscopic cellular animation. " +
    look.env + " " +
    "SURFACE: " + look.surface + ". " +
    "LIGHTING: " + look.lighting + ". " +
    "COLOR GRADE: " + look.color_grade + ". " +
    "SHOT FAMILY: " + look.shot_family + ". CAMERA MOVE: " + look.camera_move + ". " +
    "REACTION SUBJECT (visual only, never as text): " + mol + ". " +
    "Amino acids are glossy translucent colored glass spheres with metallic bonds; " +
    "the forming peptide matches that look as monomers lock together. " +
    "Shallow depth of field, cinematic macro lens, tack-sharp reaction plane, dark cellular bokeh. " +
    "FORBIDDEN scenery: white cyclorama, sunlit photography studio, frosted optical-glass pedestal, " +
    "spa, lifestyle interior, windows, palm-frond wall shadows, product stands. " +
    "FORBIDDEN overlays: any readable text, any logo, any URL, any palm watermark, any caption. " +
    "No product packaging. No research-use disclaimer. No medical claims in frame." +
    closingLock()
  );
}

function motion(name, look) {
  return (
    "Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio. " +
    "Camera: " + look.camera_move + ". " +
    "Keep the same living-cell environment and lighting. " +
    "Continue the chemical reaction: amino acids drift in, collide, peptide bonds form with " +
    "energy flashes, the cell membrane / cytoplasm undulates. " +
    "Do not cut to a studio or pedestal. No vials, people, needles. " +
    "NO text appears. NO logos appear. NO captions. Completely blank of typography."
  );
}

function brief(name, look, mol) {
  return (
    "chem reaction · " + name + " · " + mol + " · " + String(look.env).slice(0, 160) + "… " +
    "shot:" + look.shot_family + " · " + look.camera_angle + " · " + String(look.surface).slice(0, 48) + " · no text · no logo"
  );
}

var row = ($input.item && $input.item.json) || $json || {};
var id = String(row.creation_id || '').trim();
var rank = Number(row.rank);
var name = String(row.compound_name || '').trim();
var mol = String(row.material_detail || '').trim();
if (!id) throw new Error('rebuild_chem_looks: missing creation_id');
if (!name) throw new Error('rebuild_chem_looks: missing compound_name on ' + id);
if (!mol) throw new Error('rebuild_chem_looks: missing material_detail on ' + id);
var look = lookForRank(rank);
var out = {
  creation_id: id,
  category: look.category,
  lab_item: look.lab_item,
  shot_family: look.shot_family,
  camera_angle: look.camera_angle,
  camera_direction: look.camera_direction,
  framing: look.framing,
  scene_brief: brief(name, look, mol),
  quality_var_count: 6,
  video_prompt: videoPrompt(name, look, mol),
  video_motion_prompt: motion(name, look),
  still_edit_prompt: LOOKS.STILL_EDIT,
  surface: look.surface,
  lighting: look.lighting,
  camera_move: look.camera_move,
  color_grade: look.color_grade,
  hero_style: look.hero_style
};
return { json: out };
