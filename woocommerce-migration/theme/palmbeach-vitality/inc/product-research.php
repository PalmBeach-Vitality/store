<?php
/**
 * Per-compound research study links + amino diagram assets.
 * Displayed below Add to cart on matching product pages (same format for every product).
 *
 * @package PalmBeach_Vitality
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Research library keyed by compound slug (exactly 5 studies + amino diagram each).
 *
 * @return array<string,array{label:string,amino:string,studies:array<int,array{title:string,url:string,source:string}>}>
 */
function pbv_product_research_library() {
    return array(
        '5-amino-1mq' => array(
            'label'  => '5-Amino-1MQ',
            'amino'  => 'assets/images/amino/5-amino-1mq.svg',
            'studies' => array(
                array(
                    'title'  => 'Small molecule nicotinamide N-methyltransferase inhibitor activates senescent muscle stem cells and improves regenerative capacity of aged skeletal muscle',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/30753815/',
                    'source' => 'PubMed 30753815',
                ),
                array(
                    'title'  => 'Small molecule inhibitor of nicotinamide N-methyltransferase shows anti-proliferative activity in HeLa cells',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/33645410/',
                    'source' => 'PubMed 33645410',
                ),
                array(
                    'title'  => 'Reduced calorie diet combined with NNMT inhibition establishes a distinct microbiome in DIO mice',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/35013352/',
                    'source' => 'PubMed 35013352',
                ),
                array(
                    'title'  => 'NAD(+) metabolism enzyme NNMT in cancer-associated fibroblasts drives tumor progression and resistance to immunotherapy by modulating macrophage polarization',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/39067875/',
                    'source' => 'PubMed 39067875',
                ),
                array(
                    'title'  => 'Nicotinamide N-methyltransferase knockdown protects against diet-induced obesity',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/24717514/',
                    'source' => 'PubMed 24717514',
                ),
            ),
        ),
        'aod-9604' => array(
            'label'  => 'AOD-9604',
            'amino'  => 'assets/images/amino/aod-9604.svg',
            'studies' => array(
                array(
                    'title'  => 'The effects of human GH and its lipolytic fragment (AOD9604) on lipid metabolism following chronic treatment in obese mice',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/11713213/',
                    'source' => 'PubMed 11713213',
                ),
                array(
                    'title'  => 'Metabolic studies of a synthetic lipolytic domain (AOD9604) of human growth hormone',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/11146367/',
                    'source' => 'PubMed 11146367',
                ),
                array(
                    'title'  => 'Detection and in vitro metabolism of AOD9604',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/25208511/',
                    'source' => 'PubMed 25208511',
                ),
                array(
                    'title'  => 'Effect of Intra-articular Injection of AOD9604 with or without Hyaluronic Acid in Rabbit Osteoarthritis',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/26275694/',
                    'source' => 'PubMed 26275694',
                ),
                array(
                    'title'  => 'Obesity drugs in clinical development',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/16625817/',
                    'source' => 'PubMed 16625817',
                ),
            ),
        ),
        'bpc-157' => array(
            'label'  => 'BPC-157',
            'amino'  => 'assets/images/amino/bpc-157.svg',
            'studies' => array(
                array(
                    'title'  => 'Gastric pentadecapeptide body protection compound BPC 157 and its role in accelerating muscle healing',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/30915550/',
                    'source' => 'PubMed 30915550',
                ),
                array(
                    'title'  => 'Stable Gastric Pentadecapeptide BPC 157 and Wound Healing',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/34267654/',
                    'source' => 'PubMed 34267654',
                ),
                array(
                    'title'  => 'Emerging Use of BPC-157 in Orthopaedic Sports Medicine: A Systematic Review',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/40756949/',
                    'source' => 'PubMed 40756949',
                ),
                array(
                    'title'  => 'BPC 157 and Standard Angiogenic Growth Factors. Gastrointestinal Tract Healing, Lessons from Tendon, Ligament, Muscle and Bone Healing',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/29998800/',
                    'source' => 'PubMed 29998800',
                ),
                array(
                    'title'  => 'Multifunctionality and Possible Medical Application of the BPC 157 Peptide—Literature and Patent Review',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/40005999/',
                    'source' => 'PubMed 40005999',
                ),
            ),
        ),
        'cagrilintide' => array(
            'label'  => 'Cagrilintide',
            'amino'  => 'assets/images/amino/cagrilintide.svg',
            'studies' => array(
                array(
                    'title'  => 'Once-weekly cagrilintide for weight management in people with overweight and obesity: a multicentre, randomised, double-blind, placebo-controlled and active-controlled, dose-finding phase 2 trial',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/34798060/',
                    'source' => 'PubMed 34798060',
                ),
                array(
                    'title'  => 'Safety, tolerability, pharmacokinetics, and pharmacodynamics of concomitant administration of multiple doses of cagrilintide with semaglutide 2.4 mg for weight management',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/33894838/',
                    'source' => 'PubMed 33894838',
                ),
                array(
                    'title'  => 'Cagrilintide-Semaglutide in Adults with Overweight or Obesity and Type 2 Diabetes',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/40544432/',
                    'source' => 'PubMed 40544432',
                ),
                array(
                    'title'  => 'Cagrilintide-semaglutide (CagriSema) versus semaglutide or cagrilintide in people with type 2 diabetes (REIMAGINE 2)',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/42251859/',
                    'source' => 'PubMed 42251859',
                ),
                array(
                    'title'  => 'Efficacy and safety of once-weekly cagrilintide-semaglutide (CagriSema) in adults with type 2 diabetes inadequately controlled on metformin',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/42251860/',
                    'source' => 'PubMed 42251860',
                ),
            ),
        ),
        'cjc-1295' => array(
            'label'  => 'CJC-1295',
            'amino'  => 'assets/images/amino/cjc-1295.svg',
            'studies' => array(
                array(
                    'title'  => 'Prolonged stimulation of growth hormone (GH) and insulin-like growth factor I secretion by CJC-1295, a long-acting GH releasing hormone analog',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/16352683/',
                    'source' => 'PubMed 16352683',
                ),
                array(
                    'title'  => 'Once-daily administration of CJC-1295, a long-acting growth hormone-releasing hormone (GHRH) analog, enhances GH and IGF-I secretion',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/16822960/',
                    'source' => 'PubMed 16822960',
                ),
                array(
                    'title'  => 'Activation of the GH/IGF-1 axis by CJC-1295, a long-acting GHRH analog, results in serum protein profile changes',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/19386527/',
                    'source' => 'PubMed 19386527',
                ),
                array(
                    'title'  => 'Advances in the detection of growth hormone releasing hormone synthetic analogs',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/34665524/',
                    'source' => 'PubMed 34665524',
                ),
                array(
                    'title'  => 'Probing for peptidic drugs (2–10 kDa) in doping control blood samples',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/38716080/',
                    'source' => 'PubMed 38716080',
                ),
            ),
        ),
        'cjc-ipamorelin' => array(
            'label'  => 'CJC-1295 / Ipamorelin',
            'amino'  => 'assets/images/amino/cjc-ipamorelin.svg',
            'studies' => array(
                array(
                    'title'  => 'Prolonged stimulation of growth hormone (GH) and insulin-like growth factor I secretion by CJC-1295, a long-acting GH releasing hormone analog',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/16352683/',
                    'source' => 'PubMed 16352683',
                ),
                array(
                    'title'  => 'Once-daily administration of CJC-1295, a long-acting growth hormone-releasing hormone (GHRH) analog, enhances GH and IGF-I secretion',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/16822960/',
                    'source' => 'PubMed 16822960',
                ),
                array(
                    'title'  => 'Activation of the GH/IGF-1 axis by CJC-1295, a long-acting GHRH analog, results in serum protein profile changes',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/19386527/',
                    'source' => 'PubMed 19386527',
                ),
                array(
                    'title'  => 'Ipamorelin, the first selective growth hormone secretagogue',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/9849822/',
                    'source' => 'PubMed 9849822',
                ),
                array(
                    'title'  => 'Efficacy of ipamorelin, a novel ghrelin mimetic, in a rodent model of postoperative ileus',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/19289567/',
                    'source' => 'PubMed 19289567',
                ),
            ),
        ),
        'dsip' => array(
            'label'  => 'DSIP',
            'amino'  => 'assets/images/amino/dsip.svg',
            'studies' => array(
                array(
                    'title'  => 'Delta-sleep-inducing peptide (DSIP): a review',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/6145137/',
                    'source' => 'PubMed 6145137',
                ),
                array(
                    'title'  => 'Characterization, properties and multivariate functions of delta-sleep-inducing peptide (DSIP)',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/6548966/',
                    'source' => 'PubMed 6548966',
                ),
                array(
                    'title'  => 'A clinical trial with DSIP',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/6391926/',
                    'source' => 'PubMed 6391926',
                ),
                array(
                    'title'  => 'DSIP in insomnia',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/6391925/',
                    'source' => 'PubMed 6391925',
                ),
                array(
                    'title'  => 'Phosphorylated delta sleep inducing peptide restores spatial memory and p-CREB expression by improving sleep architecture at high altitude',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/30107169/',
                    'source' => 'PubMed 30107169',
                ),
            ),
        ),
        'ghk-cu' => array(
            'label'  => 'GHK-Cu',
            'amino'  => 'assets/images/amino/ghk-cu.svg',
            'studies' => array(
                array(
                    'title'  => 'The human tri-peptide GHK and tissue remodeling',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/18644225/',
                    'source' => 'PubMed 18644225',
                ),
                array(
                    'title'  => 'GHK and DNA: resetting the human genome to health',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/25302294/',
                    'source' => 'PubMed 25302294',
                ),
                array(
                    'title'  => 'The potential of GHK as an anti-aging peptide',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/35083444/',
                    'source' => 'PubMed 35083444',
                ),
                array(
                    'title'  => 'GHK Peptide as a Natural Modulator of Multiple Cellular Pathways in Skin Regeneration',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/26236730/',
                    'source' => 'PubMed 26236730',
                ),
                array(
                    'title'  => 'The glycyl-l-histidyl-l-lysine-Cu2+ tripeptide complex attenuates lung inflammation and fibrosis',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/38879894/',
                    'source' => 'PubMed 38879894',
                ),
            ),
        ),
        'glow' => array(
            'label'  => 'GLOW',
            'amino'  => 'assets/images/amino/glow.svg',
            'studies' => array(
                array(
                    'title'  => 'The human tri-peptide GHK and tissue remodeling',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/18644225/',
                    'source' => 'PubMed 18644225',
                ),
                array(
                    'title'  => 'GHK Peptide as a Natural Modulator of Multiple Cellular Pathways in Skin Regeneration',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/26236730/',
                    'source' => 'PubMed 26236730',
                ),
                array(
                    'title'  => 'Stable Gastric Pentadecapeptide BPC 157 and Wound Healing',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/34267654/',
                    'source' => 'PubMed 34267654',
                ),
                array(
                    'title'  => 'Thymosin β4: a multi-functional regenerative peptide. Basic properties and clinical applications',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/22074294/',
                    'source' => 'PubMed 22074294',
                ),
                array(
                    'title'  => 'The potential of GHK as an anti-aging peptide',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/35083444/',
                    'source' => 'PubMed 35083444',
                ),
            ),
        ),
        'ipamorelin' => array(
            'label'  => 'Ipamorelin',
            'amino'  => 'assets/images/amino/ipamorelin.svg',
            'studies' => array(
                array(
                    'title'  => 'Ipamorelin, the first selective growth hormone secretagogue',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/9849822/',
                    'source' => 'PubMed 9849822',
                ),
                array(
                    'title'  => 'Efficacy of ipamorelin, a novel ghrelin mimetic, in a rodent model of postoperative ileus',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/19289567/',
                    'source' => 'PubMed 19289567',
                ),
                array(
                    'title'  => 'The GH secretagogues ipamorelin and GH-releasing peptide-6 increase bone mineral content in adult rats',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/10828840/',
                    'source' => 'PubMed 10828840',
                ),
                array(
                    'title'  => 'Ipamorelin, a new growth-hormone-releasing peptide, induces longitudinal bone growth in rats',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/10373343/',
                    'source' => 'PubMed 10373343',
                ),
                array(
                    'title'  => 'Growth hormone and growth hormone secretagogue effects on nitrogen balance and urea synthesis',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/19231263/',
                    'source' => 'PubMed 19231263',
                ),
            ),
        ),
        'klow' => array(
            'label'  => 'KLOW',
            'amino'  => 'assets/images/amino/klow.svg',
            'studies' => array(
                array(
                    'title'  => 'PepT1-mediated tripeptide KPV uptake reduces intestinal inflammation',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/18061177/',
                    'source' => 'PubMed 18061177',
                ),
                array(
                    'title'  => 'Dissection of the anti-inflammatory effect of the core and C-terminal (KPV) alpha-melanocyte-stimulating hormone peptides',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/12750433/',
                    'source' => 'PubMed 12750433',
                ),
                array(
                    'title'  => 'Stable Gastric Pentadecapeptide BPC 157 and Wound Healing',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/34267654/',
                    'source' => 'PubMed 34267654',
                ),
                array(
                    'title'  => 'The human tri-peptide GHK and tissue remodeling',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/18644225/',
                    'source' => 'PubMed 18644225',
                ),
                array(
                    'title'  => 'Thymosin β4: a multi-functional regenerative peptide. Basic properties and clinical applications',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/22074294/',
                    'source' => 'PubMed 22074294',
                ),
            ),
        ),
        'kpv' => array(
            'label'  => 'KPV',
            'amino'  => 'assets/images/amino/kpv.svg',
            'studies' => array(
                array(
                    'title'  => 'Dissection of the anti-inflammatory effect of the core and C-terminal (KPV) alpha-melanocyte-stimulating hormone peptides',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/12750433/',
                    'source' => 'PubMed 12750433',
                ),
                array(
                    'title'  => 'PepT1-mediated tripeptide KPV uptake reduces intestinal inflammation',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/18061177/',
                    'source' => 'PubMed 18061177',
                ),
                array(
                    'title'  => 'alpha-Melanocyte-stimulating hormone, MSH 11-13 KPV and adrenocorticotropic hormone signalling',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/15102092/',
                    'source' => 'PubMed 15102092',
                ),
                array(
                    'title'  => 'alpha-MSH related peptides: a new class of anti-inflammatory and immunomodulating drugs',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/17934097/',
                    'source' => 'PubMed 17934097',
                ),
                array(
                    'title'  => 'Are melanocortin peptides future therapeutics for cutaneous wound healing?',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/30661264/',
                    'source' => 'PubMed 30661264',
                ),
            ),
        ),
        'melanotan' => array(
            'label'  => 'Melanotan II',
            'amino'  => 'assets/images/amino/melanotan.svg',
            'studies' => array(
                array(
                    'title'  => 'Synthetic melanotropic peptide initiates erections in men with psychogenic erectile dysfunction: double-blind, placebo controlled crossover study',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/9679884/',
                    'source' => 'PubMed 9679884',
                ),
                array(
                    'title'  => 'Melanocortin receptor agonists, penile erection, and sexual motivation: human studies with Melanotan II',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/11035391/',
                    'source' => 'PubMed 11035391',
                ),
                array(
                    'title'  => 'Effect of an alpha-melanocyte stimulating hormone analog on penile erection and sexual desire in men with organic erectile dysfunction',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/11018622/',
                    'source' => 'PubMed 11018622',
                ),
                array(
                    'title'  => 'Melanotan-II: Investigation of the inducer and facilitator effects on penile erection in anaesthetized rat',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/16360286/',
                    'source' => 'PubMed 16360286',
                ),
                array(
                    'title'  => 'Melanotan-II reverses memory impairment induced by a short-term HF diet',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/37478579/',
                    'source' => 'PubMed 37478579',
                ),
            ),
        ),
        'mots-c' => array(
            'label'  => 'MOTS-c',
            'amino'  => 'assets/images/amino/mots-c.svg',
            'studies' => array(
                array(
                    'title'  => 'The mitochondrial-derived peptide MOTS-c promotes metabolic homeostasis and reduces obesity and insulin resistance',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/25738459/',
                    'source' => 'PubMed 25738459',
                ),
                array(
                    'title'  => 'The Mitochondrial-Encoded Peptide MOTS-c Translocates to the Nucleus to Regulate Nuclear Gene Expression in Response to Metabolic Stress',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/29983246/',
                    'source' => 'PubMed 29983246',
                ),
                array(
                    'title'  => 'Mitochondrial-derived microprotein MOTS-c attenuates immobilization-induced skeletal muscle atrophy by suppressing lipid infiltration',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/38170165/',
                    'source' => 'PubMed 38170165',
                ),
                array(
                    'title'  => 'Mitochondrial-Derived Peptide MOTS-c Increases Adipose Thermogenic Activation to Promote Cold Adaptation',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/31109005/',
                    'source' => 'PubMed 31109005',
                ),
                array(
                    'title'  => 'MOTS-c: A promising mitochondrial-derived peptide for therapeutic exploitation',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/36761202/',
                    'source' => 'PubMed 36761202',
                ),
            ),
        ),
        'nad' => array(
            'label'  => 'NAD+',
            'amino'  => 'assets/images/amino/nad.svg',
            'studies' => array(
                array(
                    'title'  => 'Chronic nicotinamide riboside supplementation is well-tolerated and elevates NAD+ in healthy middle-aged and older adults',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/29599478/',
                    'source' => 'PubMed 29599478',
                ),
                array(
                    'title'  => 'Safety and Metabolism of Long-term Administration of NIAGEN (Nicotinamide Riboside Chloride)',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/31278280/',
                    'source' => 'PubMed 31278280',
                ),
                array(
                    'title'  => 'Nicotinamide Riboside Augments the Aged Human Skeletal Muscle NAD+ Metabolome',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/31412242/',
                    'source' => 'PubMed 31412242',
                ),
                array(
                    'title'  => 'Nicotinamide riboside is uniquely and orally bioavailable in mice and humans',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/27721479/',
                    'source' => 'PubMed 27721479',
                ),
                array(
                    'title'  => 'Dietary Supplementation With NAD+-Boosting Compounds in Humans: Current Knowledge and Future Directions',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/37068054/',
                    'source' => 'PubMed 37068054',
                ),
            ),
        ),
        'pt-141' => array(
            'label'  => 'PT-141',
            'amino'  => 'assets/images/amino/pt-141.svg',
            'studies' => array(
                array(
                    'title'  => 'Bremelanotide for female sexual dysfunctions in premenopausal women: a randomized, placebo-controlled dose-finding trial',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/27181790/',
                    'source' => 'PubMed 27181790',
                ),
                array(
                    'title'  => 'Prespecified and Integrated Subgroup Analyses from the RECONNECT Phase 3 Studies of Bremelanotide',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/35230162/',
                    'source' => 'PubMed 35230162',
                ),
                array(
                    'title'  => 'The neurobiology of bremelanotide for the treatment of hypoactive sexual desire disorder in premenopausal women',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/33455598/',
                    'source' => 'PubMed 33455598',
                ),
                array(
                    'title'  => 'An evaluation of bremelanotide injection for the treatment of hypoactive sexual desire disorder',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/36242769/',
                    'source' => 'PubMed 36242769',
                ),
                array(
                    'title'  => 'A role for the melanocortin 4 receptor in sexual function',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/12172010/',
                    'source' => 'PubMed 12172010',
                ),
            ),
        ),
        'retatrutide' => array(
            'label'  => 'Retatrutide',
            'amino'  => 'assets/images/amino/retatrutide.svg',
            'studies' => array(
                array(
                    'title'  => 'Triple-Hormone-Receptor Agonist Retatrutide for Obesity — A Phase 2 Trial',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/37366315/',
                    'source' => 'PubMed 37366315',
                ),
                array(
                    'title'  => 'Triple hormone receptor agonist retatrutide for metabolic dysfunction-associated steatotic liver disease',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/38858523/',
                    'source' => 'PubMed 38858523',
                ),
                array(
                    'title'  => 'Retatrutide—A Game Changer in Obesity Pharmacotherapy',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/40563436/',
                    'source' => 'PubMed 40563436',
                ),
                array(
                    'title'  => 'Retatrutide for the treatment of obesity, obstructive sleep apnea and knee osteoarthritis',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/41090431/',
                    'source' => 'PubMed 41090431',
                ),
                array(
                    'title'  => 'The promise of glucagon-like peptide 1 receptor agonists (GLP-1RA) for the treatment of obesity',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/40022548/',
                    'source' => 'PubMed 40022548',
                ),
            ),
        ),
        'selank' => array(
            'label'  => 'Selank',
            'amino'  => 'assets/images/amino/selank.svg',
            'studies' => array(
                array(
                    'title'  => 'Selank, a Peptide Analog of Tuftsin, Attenuates Aversive Signs of Morphine Withdrawal in Rats',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/36322304/',
                    'source' => 'PubMed 36322304',
                ),
                array(
                    'title'  => 'Selank, Peptide Analogue of Tuftsin, Protects Against Ethanol-Induced Memory Impairment',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/31625062/',
                    'source' => 'PubMed 31625062',
                ),
                array(
                    'title'  => 'Selank and short peptides of the tuftsin family in the regulation of adaptive behavior',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/14969422/',
                    'source' => 'PubMed 14969422',
                ),
                array(
                    'title'  => 'Functional Connectomic Approach to Studying Selank and Semax Effects',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/32342318/',
                    'source' => 'PubMed 32342318',
                ),
                array(
                    'title'  => 'A new property of the synthetic anxiolytic Selank and its derivatives',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/15508574/',
                    'source' => 'PubMed 15508574',
                ),
            ),
        ),
        'semaglutide' => array(
            'label'  => 'Semaglutide',
            'amino'  => 'assets/images/amino/semaglutide.svg',
            'studies' => array(
                array(
                    'title'  => 'Once-Weekly Semaglutide in Adults with Overweight or Obesity',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/33567185/',
                    'source' => 'PubMed 33567185',
                ),
                array(
                    'title'  => 'Effect of Continued Weekly Subcutaneous Semaglutide vs Placebo on Weight Loss Maintenance',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/33755728/',
                    'source' => 'PubMed 33755728',
                ),
                array(
                    'title'  => 'Two-year effects of semaglutide in adults with overweight or obesity: the STEP 5 trial',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/36216945/',
                    'source' => 'PubMed 36216945',
                ),
                array(
                    'title'  => 'Semaglutide and Cardiovascular Outcomes in Patients with Type 2 Diabetes',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/27633186/',
                    'source' => 'PubMed 27633186',
                ),
                array(
                    'title'  => 'Semaglutide and Cardiovascular Outcomes in Obesity without Diabetes',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/37952131/',
                    'source' => 'PubMed 37952131',
                ),
            ),
        ),
        'semax' => array(
            'label'  => 'Semax',
            'amino'  => 'assets/images/amino/semax.svg',
            'studies' => array(
                array(
                    'title'  => 'Semax, an analog of ACTH(4-10) with cognitive effects, regulates BDNF and trkB expression in the rat hippocampus',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/16996037/',
                    'source' => 'PubMed 16996037',
                ),
                array(
                    'title'  => 'Semax, synthetic ACTH(4-10) analogue, attenuates behavioural and neurochemical alterations',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/33418449/',
                    'source' => 'PubMed 33418449',
                ),
                array(
                    'title'  => 'Semax, a Synthetic Regulatory Peptide, Affects Copper-Induced Abeta Aggregation and Amyloid Formation',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/35080861/',
                    'source' => 'PubMed 35080861',
                ),
                array(
                    'title'  => 'Influence of the N-terminus acetylation of Semax, a synthetic analog of ACTH(4-10), on copper(II) binding',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/27586814/',
                    'source' => 'PubMed 27586814',
                ),
                array(
                    'title'  => 'Semax and Pro-Gly-Pro activate the transcription of neurotrophins and their receptor genes after cerebral ischaemia',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/19633950/',
                    'source' => 'PubMed 19633950',
                ),
            ),
        ),
        'sermorelin' => array(
            'label'  => 'Sermorelin',
            'amino'  => 'assets/images/amino/sermorelin.svg',
            'studies' => array(
                array(
                    'title'  => 'Sermorelin: a better approach to management of adult-onset growth hormone insufficiency?',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/18046908/',
                    'source' => 'PubMed 18046908',
                ),
                array(
                    'title'  => 'Sermorelin: a review of its use in the diagnosis and treatment of children with idiopathic growth hormone deficiency',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/18031173/',
                    'source' => 'PubMed 18031173',
                ),
                array(
                    'title'  => 'A potentially effective drug for patients with recurrent glioma: sermorelin',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/33842627/',
                    'source' => 'PubMed 33842627',
                ),
                array(
                    'title'  => 'Growth during and after a trial of growth hormone releasing hormone 1-29 in children with idiopathic short stature or growth hormone neurosecretory dysfunction',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/10905389/',
                    'source' => 'PubMed 10905389',
                ),
                array(
                    'title'  => 'Once daily subcutaneous growth hormone-releasing hormone therapy accelerates growth in growth hormone-deficient children during the first year of therapy',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/8772599/',
                    'source' => 'PubMed 8772599',
                ),
            ),
        ),
        'ss-31' => array(
            'label'  => 'SS-31',
            'amino'  => 'assets/images/amino/ss-31.svg',
            'studies' => array(
                array(
                    'title'  => 'First-in-class cardiolipin-protective compound as a therapeutic agent to restore mitochondrial bioenergetics',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/24117165/',
                    'source' => 'PubMed 24117165',
                ),
                array(
                    'title'  => 'The mitochondrial-targeted compound SS-31 re-energizes ischemic mitochondria by interacting with cardiolipin',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/23813215/',
                    'source' => 'PubMed 23813215',
                ),
                array(
                    'title'  => 'Mitochondrial-targeted peptide rapidly improves mitochondrial energetics and skeletal muscle performance in aged mice',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/23692570/',
                    'source' => 'PubMed 23692570',
                ),
                array(
                    'title'  => 'The mitochondrial-targeted peptide, SS-31, improves glomerular architecture in mice of advanced age',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/28063595/',
                    'source' => 'PubMed 28063595',
                ),
                array(
                    'title'  => 'Elamipretide Improves Mitochondrial Function in Mitochondrial Trifunctional Protein-Deficient Mice and Human Fibroblasts',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/41500837/',
                    'source' => 'PubMed 41500837',
                ),
            ),
        ),
        'ta-1' => array(
            'label'  => 'TA-1',
            'amino'  => 'assets/images/amino/ta-1.svg',
            'studies' => array(
                array(
                    'title'  => 'Thymosin alpha 1: from bench to bedside',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/17600290/',
                    'source' => 'PubMed 17600290',
                ),
                array(
                    'title'  => 'Thymosin α1 and cancer: action on immune effector and tumor target cells',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/23045967/',
                    'source' => 'PubMed 23045967',
                ),
                array(
                    'title'  => 'Thymosin α1 Interacts with Hyaluronic Acid Electrostatically by Its Terminal Sequence LKEKK',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/29077041/',
                    'source' => 'PubMed 29077041',
                ),
                array(
                    'title'  => 'Therapeutic applications of thymosin peptides: a patent landscape 2018-present',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/38131310/',
                    'source' => 'PubMed 38131310',
                ),
                array(
                    'title'  => 'Thymosin α1 represents a potential potent single-molecule-based therapy for cystic fibrosis',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/28394330/',
                    'source' => 'PubMed 28394330',
                ),
            ),
        ),
        'tb-500' => array(
            'label'  => 'TB-500',
            'amino'  => 'assets/images/amino/tb-500.svg',
            'studies' => array(
                array(
                    'title'  => 'Thymosin β4: a multi-functional regenerative peptide. Basic properties and clinical applications',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/22074294/',
                    'source' => 'PubMed 22074294',
                ),
                array(
                    'title'  => 'Thymosin β4 as a restorative/regenerative therapy for neurological injury and neurodegenerative diseases',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/25613458/',
                    'source' => 'PubMed 25613458',
                ),
                array(
                    'title'  => 'beta-Thymosins',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/17468232/',
                    'source' => 'PubMed 17468232',
                ),
                array(
                    'title'  => 'The role of thymosin-β4 in kidney disease',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/26096077/',
                    'source' => 'PubMed 26096077',
                ),
                array(
                    'title'  => 'Thymosin beta 10 and thymosin beta 4 are both actin monomer sequestering proteins',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/8416954/',
                    'source' => 'PubMed 8416954',
                ),
            ),
        ),
        'tesamorelin' => array(
            'label'  => 'Tesamorelin',
            'amino'  => 'assets/images/amino/tesamorelin.svg',
            'studies' => array(
                array(
                    'title'  => 'Effect of tesamorelin on visceral fat and liver fat in HIV-infected patients with abdominal fat accumulation',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/25038357/',
                    'source' => 'PubMed 25038357',
                ),
                array(
                    'title'  => 'Tesamorelin: a growth hormone-releasing factor analogue for HIV-associated lipodystrophy',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/22298602/',
                    'source' => 'PubMed 22298602',
                ),
                array(
                    'title'  => 'Tesamorelin, a human growth hormone releasing factor analogue',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/19243281/',
                    'source' => 'PubMed 19243281',
                ),
                array(
                    'title'  => 'Efficacy and safety of tesamorelin in people with HIV on integrase inhibitors',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/38905488/',
                    'source' => 'PubMed 38905488',
                ),
                array(
                    'title'  => 'Effects of Tesamorelin on Neurocognitive Impairment in Persons With HIV and Abdominal Obesity',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/39813152/',
                    'source' => 'PubMed 39813152',
                ),
            ),
        ),
        'tesamorelin-ipamorelin' => array(
            'label'  => 'Tesamorelin / Ipamorelin',
            'amino'  => 'assets/images/amino/tesamorelin-ipamorelin.svg',
            'studies' => array(
                array(
                    'title'  => 'Effect of tesamorelin on visceral fat and liver fat in HIV-infected patients with abdominal fat accumulation',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/25038357/',
                    'source' => 'PubMed 25038357',
                ),
                array(
                    'title'  => 'Tesamorelin: a growth hormone-releasing factor analogue for HIV-associated lipodystrophy',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/22298602/',
                    'source' => 'PubMed 22298602',
                ),
                array(
                    'title'  => 'Tesamorelin, a human growth hormone releasing factor analogue',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/19243281/',
                    'source' => 'PubMed 19243281',
                ),
                array(
                    'title'  => 'Ipamorelin, the first selective growth hormone secretagogue',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/9849822/',
                    'source' => 'PubMed 9849822',
                ),
                array(
                    'title'  => 'Efficacy of ipamorelin, a novel ghrelin mimetic, in a rodent model of postoperative ileus',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/19289567/',
                    'source' => 'PubMed 19289567',
                ),
            ),
        ),
        'tirzepatide' => array(
            'label'  => 'Tirzepatide',
            'amino'  => 'assets/images/amino/tirzepatide.svg',
            'studies' => array(
                array(
                    'title'  => 'Tirzepatide versus Semaglutide Once Weekly in Patients with Type 2 Diabetes',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/34170647/',
                    'source' => 'PubMed 34170647',
                ),
                array(
                    'title'  => 'Tirzepatide Once Weekly for the Treatment of Obesity',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/35658024/',
                    'source' => 'PubMed 35658024',
                ),
                array(
                    'title'  => 'Tirzepatide for Obesity Treatment and Diabetes Prevention',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/39536238/',
                    'source' => 'PubMed 39536238',
                ),
                array(
                    'title'  => 'Efficacy and Safety of Tirzepatide in Type 2 Diabetes and Obesity Management',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/36750526/',
                    'source' => 'PubMed 36750526',
                ),
                array(
                    'title'  => 'Tirzepatide for the treatment of obesity: Rationale and design of the SURMOUNT clinical development program',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/36478180/',
                    'source' => 'PubMed 36478180',
                ),
            ),
        ),
        'wolverine' => array(
            'label'  => 'Wolverine',
            'amino'  => 'assets/images/amino/wolverine.svg',
            'studies' => array(
                array(
                    'title'  => 'Gastric pentadecapeptide body protection compound BPC 157 and its role in accelerating muscle healing',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/30915550/',
                    'source' => 'PubMed 30915550',
                ),
                array(
                    'title'  => 'Stable Gastric Pentadecapeptide BPC 157 and Wound Healing',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/34267654/',
                    'source' => 'PubMed 34267654',
                ),
                array(
                    'title'  => 'Thymosin β4: a multi-functional regenerative peptide. Basic properties and clinical applications',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/22074294/',
                    'source' => 'PubMed 22074294',
                ),
                array(
                    'title'  => 'Thymosin β4 as a restorative/regenerative therapy for neurological injury and neurodegenerative diseases',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/25613458/',
                    'source' => 'PubMed 25613458',
                ),
                array(
                    'title'  => 'BPC 157 and Standard Angiogenic Growth Factors. Gastrointestinal Tract Healing',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/29998800/',
                    'source' => 'PubMed 29998800',
                ),
            ),
        ),
    );
}

/**
 * Resolve research compound key for the current product.
 * More-specific blend / stack keys are checked before shared base compounds.
 *
 * @param WC_Product|null $product Product object.
 * @return string Compound key or empty.
 */
function pbv_product_research_key($product) {
    if (!$product instanceof WC_Product) {
        return '';
    }

    $slug = strtolower((string) $product->get_slug());
    $name = strtolower((string) $product->get_name());
    $hay  = $slug . ' ' . $name;

    $rules = array(
        // Blends / stacks first.
        'wolverine' => '/wolverine/',
        'glow' => '/\bglow\b/',
        'klow' => '/\bklow\b/',
        'cjc-ipamorelin' => '/cjc[^a-z0-9]{0,3}ipamorelin|ipamorelin[^a-z0-9]{0,3}cjc/',
        'tesamorelin-ipamorelin' => '/tesamorelin[^a-z0-9]{0,3}ipamorelin|ipamorelin[^a-z0-9]{0,3}tesamorelin/',
        // Weight-loss / named compounds.
        'retatrutide' => '/retatrut(?:ide|ride)/',
        'tirzepatide' => '/tirzepatide/',
        'semaglutide' => '/semaglutide/',
        'cagrilintide' => '/cagrilintide|cargrilinitide/',
        'bpc-157' => '/bpc[\s-]?157/',
        'tb-500' => '/tb[\s-]?500|thymosin\s*beta\s*4|thymosin\s*β4/',
        'ghk-cu' => '/ghk[\s-]?cu|\bghk\b/',
        'kpv' => '/\bkpv\b/',
        'selank' => '/selank/',
        'semax' => '/semax/',
        'tesamorelin' => '/tesamorelin/',
        'sermorelin' => '/sermorelin/',
        'aod-9604' => '/aod[\s-]?9604/',
        'nad' => '/\bnad\b/',
        'mots-c' => '/mots[\s-]?c/',
        'pt-141' => '/pt[\s-]?141|bremelanotide/',
        'ss-31' => '/ss[\s-]?31|elamipretide/',
        'melanotan' => '/melanotan|melonotan|\bmt[\s-]?2\b/',
        'ta-1' => '/\bta[\s-]?1\b|thymosin\s*alpha/',
        'dsip' => '/\bdsip\b/',
        '5-amino-1mq' => '/5[\s-]?amino|amino[\s-]?mq|1mq|1-mq/',
        'cjc-1295' => '/\bcjc\b/',
        'ipamorelin' => '/ipamorelin/',
    );

    foreach ($rules as $key => $pattern) {
        if (preg_match($pattern, $hay)) {
            return $key;
        }
    }

    return '';
}

/**
 * Render research studies + amino diagram below Add to cart.
 *
 * @param WC_Product|null $product Product object.
 */
function pbv_render_product_research_section($product = null) {
    if (!$product instanceof WC_Product) {
        global $product;
    }
    if (!$product instanceof WC_Product) {
        return;
    }

    $key = pbv_product_research_key($product);
    if ($key === '') {
        return;
    }

    $library = pbv_product_research_library();
    if (empty($library[$key]['studies']) || !is_array($library[$key]['studies'])) {
        return;
    }

    $entry   = $library[$key];
    $label   = isset($entry['label']) ? $entry['label'] : $key;
    $studies = array_slice($entry['studies'], 0, 5);
    $amino   = isset($entry['amino']) ? $entry['amino'] : '';
    $amino_uri = ($amino && file_exists(pbv_asset_path($amino))) ? pbv_asset_uri($amino) : '';

    echo '<section class="pbv-product-research" aria-label="' . esc_attr(sprintf(__('%s research studies', 'palmbeach-vitality'), $label)) . '">';
    echo '<h2 class="pbv-product-research__title">' . esc_html(sprintf(__('%s Research Studies', 'palmbeach-vitality'), $label)) . '</h2>';
    echo '<p class="pbv-product-research__intro">' . esc_html__('Selected English-language peer-reviewed references for laboratory research context. Links open publisher or PubMed/PMC records.', 'palmbeach-vitality') . '</p>';
    echo '<ol class="pbv-product-research__list">';

    foreach ($studies as $study) {
        $title  = isset($study['title']) ? $study['title'] : '';
        $url    = isset($study['url']) ? $study['url'] : '';
        $source = isset($study['source']) ? $study['source'] : '';
        if ($title === '' || $url === '') {
            continue;
        }
        echo '<li class="pbv-product-research__item">';
        echo '<a class="pbv-product-research__link" href="' . esc_url($url) . '" target="_blank" rel="noopener noreferrer">' . esc_html($title) . '</a>';
        if ($source !== '') {
            echo '<span class="pbv-product-research__source">' . esc_html($source) . '</span>';
        }
        echo '</li>';
    }

    echo '</ol>';

    if ($amino_uri) {
        echo '<figure class="pbv-product-research__amino">';
        echo '<img src="' . esc_url($amino_uri) . '" alt="' . esc_attr(sprintf(__('%s amino acid chain', 'palmbeach-vitality'), $label)) . '" width="720" height="232" loading="lazy" decoding="async" />';
        echo '<figcaption>' . esc_html(sprintf(__('%s — amino acid chain (N→C)', 'palmbeach-vitality'), $label)) . '</figcaption>';
        echo '</figure>';
    }

    echo '</section>';
}
