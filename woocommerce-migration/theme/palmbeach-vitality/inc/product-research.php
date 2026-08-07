<?php
/**
 * Per-compound research study links + amino diagram assets.
 * Displayed below Add to cart on matching product pages only.
 *
 * @package PalmBeach_Vitality
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Research library keyed by compound slug.
 *
 * @return array<string,array{label:string,amino:string,studies:array<int,array{title:string,url:string,source:string}>}>
 */
function pbv_product_research_library() {
    return array(
        'bpc-157' => array(
            'label'  => 'BPC-157',
            'amino'  => 'assets/images/amino/bpc-157.svg',
            'studies' => array(
                array(
                    'title'  => 'Gastric pentadecapeptide body protection compound BPC 157 and its role in accelerating muscle healing',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/30915550/',
                    'source' => 'PubMed · Cell and Tissue Research',
                ),
                array(
                    'title'  => 'Stable Gastric Pentadecapeptide BPC 157 and Wound Healing',
                    'url'    => 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8275860/',
                    'source' => 'PMC · Frontiers in Pharmacology',
                ),
                array(
                    'title'  => 'Emerging Use of BPC-157 in Orthopaedic Sports Medicine: A Systematic Review',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/40756949/',
                    'source' => 'PubMed · HSS Journal',
                ),
                array(
                    'title'  => 'BPC 157 and Standard Angiogenic Growth Factors — Gastrointestinal Tract Healing Lessons from Tendon, Ligament, Muscle and Bone Healing',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/29998800/',
                    'source' => 'PubMed · Current Pharmaceutical Design',
                ),
                array(
                    'title'  => 'Multifunctionality and Possible Medical Application of the BPC 157 Peptide — Literature and Patent Review',
                    'url'    => 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11859134/',
                    'source' => 'PMC · Pharmaceuticals (Basel)',
                ),
                array(
                    'title'  => 'Gastric pentadecapeptide BPC 157 accelerates healing of transected rat Achilles tendon and in vitro tendon outgrowth',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/14554208/',
                    'source' => 'PubMed · Journal of Orthopaedic Research',
                ),
                array(
                    'title'  => 'The promoting effect of pentadecapeptide BPC 157 on tendon healing involves tendon outgrowth, cell survival, and AKT activation',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/21030672/',
                    'source' => 'PubMed · Journal of Applied Physiology',
                ),
            ),
        ),
        '5-amino-1mq' => array(
            'label'  => '5-Amino-1MQ',
            'amino'  => '',
            'studies' => array(
                array(
                    'title'  => 'NAD(+) metabolism enzyme NNMT in cancer-associated fibroblasts drives tumor progression and resistance to immunotherapy by modulating macrophages in urothelial bladder cancer',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/39067875/',
                    'source' => 'PubMed · Journal for immunotherapy of cancer',
                ),
                array(
                    'title'  => 'Small molecule inhibitor of nicotinamide N-methyltransferase shows anti-proliferative activity in HeLa cells',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/33645410/',
                    'source' => 'PubMed · Journal of obstetrics and gynaecology : the journal of the Institute of Obstetrics and Gynaecology',
                ),
                array(
                    'title'  => 'Reduced calorie diet combined with NNMT inhibition establishes a distinct microbiome in DIO mice',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/35013352/',
                    'source' => 'PubMed · Scientific reports',
                ),
            ),
        ),
        'aod-9604' => array(
            'label'  => 'AOD-9604',
            'amino'  => 'assets/images/amino/aod-9604.svg',
            'studies' => array(
                array(
                    'title'  => 'The effects of human GH and its lipolytic fragment (AOD9604) on lipid metabolism following chronic treatment in obese mice and beta(3)-AR knock-out mice',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/11713213/',
                    'source' => 'PubMed · Endocrinology',
                ),
                array(
                    'title'  => 'Metabolic studies of a synthetic lipolytic domain (AOD9604) of human growth hormone',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/11146367/',
                    'source' => 'PubMed · Hormone research',
                ),
                array(
                    'title'  => 'Detection and in vitro metabolism of AOD9604',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/25208511/',
                    'source' => 'PubMed · Drug testing and analysis',
                ),
                array(
                    'title'  => 'Effect of Intra-articular Injection of AOD9604 with or without Hyaluronic Acid in Rabbit Osteoarthritis Model',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/26275694/',
                    'source' => 'PubMed · Annals of clinical and laboratory science',
                ),
                array(
                    'title'  => 'Obesity drugs in clinical development',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/16625817/',
                    'source' => 'PubMed · Current opinion in investigational drugs (London, England : 2000)',
                ),
            ),
        ),
        'cagrilintide' => array(
            'label'  => 'Cagrilintide',
            'amino'  => '',
            'studies' => array(
                array(
                    'title'  => 'Coadministered Cagrilintide and Semaglutide in Adults with Overweight or Obesity',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/40544433/',
                    'source' => 'PubMed · The New England journal of medicine',
                ),
                array(
                    'title'  => 'Cagrilintide-Semaglutide in Adults with Overweight or Obesity and Type 2 Diabetes',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/40544432/',
                    'source' => 'PubMed · The New England journal of medicine',
                ),
                array(
                    'title'  => 'Comparative effectiveness of GLP-1 receptor agonists on glycaemic control, body weight, and lipid profile for type 2 diabetes: systematic review and network meta-analysis',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/38286487/',
                    'source' => 'PubMed · BMJ (Clinical research ed.)',
                ),
                array(
                    'title'  => 'Once-weekly cagrilintide for weight management in people with overweight and obesity: a multicentre, randomised, double-blind, placebo-controlled and active-controlled, dose-finding phase 2 trial',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/34798060/',
                    'source' => 'PubMed · Lancet (London, England)',
                ),
                array(
                    'title'  => 'Efficacy and safety of co-administered once-weekly cagrilintide 2·4 mg with once-weekly semaglutide 2·4 mg in type 2 diabetes: a multicentre, randomised, double-blind, active-controlled, phase 2 trial',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/37364590/',
                    'source' => 'PubMed · Lancet (London, England)',
                ),
                array(
                    'title'  => 'Efficacy and Safety of Cagrilintide Alone and in Combination with Semaglutide (Cagrisema) as Anti-Obesity Medications: A Systematic Review and Meta-Analysis',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/39676787/',
                    'source' => 'PubMed · Indian journal of endocrinology and metabolism',
                ),
                array(
                    'title'  => 'Novel GLP-1-based Medications for Type 2 Diabetes and Obesity',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/41054801/',
                    'source' => 'PubMed · Endocrine reviews',
                ),
            ),
        ),
        'cjc-1295' => array(
            'label'  => 'CJC-1295 (DAC)',
            'amino'  => 'assets/images/amino/cjc-1295.svg',
            'studies' => array(
                array(
                    'title'  => 'Prolonged stimulation of growth hormone (GH) and insulin-like growth factor I secretion by CJC-1295, a long-acting analog of GH-releasing hormone, in healthy adults',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/16352683/',
                    'source' => 'PubMed · The Journal of clinical endocrinology and metabolism',
                ),
                array(
                    'title'  => 'Once-daily administration of CJC-1295, a long-acting growth hormone-releasing hormone (GHRH) analog, normalizes growth in the GHRH knockout mouse',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/16822960/',
                    'source' => 'PubMed · American journal of physiology. Endocrinology and metabolism',
                ),
                array(
                    'title'  => 'Activation of the GH/IGF-1 axis by CJC-1295, a long-acting GHRH analog, results in serum protein profile changes in normal adult subjects',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/19386527/',
                    'source' => 'PubMed · Growth hormone & IGF research : official journal of the Growth Hormone Research Society and the International IGF Research Society',
                ),
                array(
                    'title'  => 'Advances in the detection of growth hormone releasing hormone synthetic analogs',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/34665524/',
                    'source' => 'PubMed · Drug testing and analysis',
                ),
                array(
                    'title'  => 'Probing for peptidic drugs (2-10 kDa) in doping control blood samples',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/38716080/',
                    'source' => 'PubMed · Analytical science advances',
                ),
            ),
        ),
        'cjc-ipamorelin' => array(
            'label'  => 'CJC/Ipamorelin',
            'amino'  => 'assets/images/amino/cjc-1295.svg',
            'studies' => array(
                array(
                    'title'  => 'Therapeutic peptides in gerontology: mechanisms and applications for healthy aging',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/42021992/',
                    'source' => 'PubMed · Frontiers in aging',
                ),
                array(
                    'title'  => 'Therapeutic Peptides in Aesthetic, Metabolic and Endocrine Conditions: Effects, Safety, Clinical Applications, and Future Perspectives',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/42123471/',
                    'source' => 'PubMed · International journal of molecular sciences',
                ),
                array(
                    'title'  => 'A new era of doping? Use of peptide and peptide-analog drugs in recreational and professional sport and bodybuilding: a critical review',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/41880199/',
                    'source' => 'PubMed · The Journal of sports medicine and physical fitness',
                ),
                array(
                    'title'  => 'Injectable Peptides in Sports Medicine: A Structured Narrative Review of Evidence, Safety, and Antidoping Implications',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/42160466/',
                    'source' => 'PubMed · JBJS reviews',
                ),
            ),
        ),
        'dsip' => array(
            'label'  => 'DSIP',
            'amino'  => 'assets/images/amino/dsip.svg',
            'studies' => array(
                array(
                    'title'  => 'Delta sleep-inducing peptide',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/11437870/',
                    'source' => 'PubMed · European journal of anaesthesiology',
                ),
                array(
                    'title'  => 'Delta sleep-inducing peptide (DSIP): a still unresolved riddle',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/16539679/',
                    'source' => 'PubMed · Journal of neurochemistry',
                ),
                array(
                    'title'  => 'Delta-sleep-inducing peptide (DSIP): a review',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/6145137/',
                    'source' => 'PubMed · Neuroscience and biobehavioral reviews',
                ),
                array(
                    'title'  => 'Delta-sleep-inducing peptide (DSIP): an update',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/3550726/',
                    'source' => 'PubMed · Peptides',
                ),
                array(
                    'title'  => 'The effects of delta-sleep-inducing peptide (DSIP) on wakefulness and sleep patterns in the cat',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/3620931/',
                    'source' => 'PubMed · Brain research',
                ),
                array(
                    'title'  => 'The effect of delta sleep-inducing peptide (DSIP) and phosphorylated DSIP (P-DSIP) on the apomorphine-induced hypothermia in rats',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/2322843/',
                    'source' => 'PubMed · Brain research',
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
                    'source' => 'PubMed · Journal of biomaterials science. Polymer edition',
                ),
                array(
                    'title'  => 'GHK and DNA: resetting the human genome to health',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/25302294/',
                    'source' => 'PubMed · BioMed research international',
                ),
                array(
                    'title'  => 'The potential of GHK as an anti-aging peptide',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/35083444/',
                    'source' => 'PubMed · Aging pathobiology and therapeutics',
                ),
                array(
                    'title'  => 'GHK Peptide as a Natural Modulator of Multiple Cellular Pathways in Skin Regeneration',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/26236730/',
                    'source' => 'PubMed · BioMed research international',
                ),
                array(
                    'title'  => 'The glycyl-l-histidyl-l-lysine-Cu(2+) tripeptide complex attenuates lung inflammation and fibrosis in silicosis by targeting peroxiredoxin 6',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/38879894/',
                    'source' => 'PubMed · Redox biology',
                ),
            ),
        ),
        'glow' => array(
            'label'  => 'GLOW Stack',
            'amino'  => 'assets/images/amino/glow.svg',
            'studies' => array(
                array(
                    'title'  => 'The human tri-peptide GHK and tissue remodeling',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/18644225/',
                    'source' => 'PubMed · Journal of biomaterials science. Polymer edition',
                ),
                array(
                    'title'  => 'GHK Peptide as a Natural Modulator of Multiple Cellular Pathways in Skin Regeneration',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/26236730/',
                    'source' => 'PubMed · BioMed research international',
                ),
                array(
                    'title'  => 'Stable Gastric Pentadecapeptide BPC 157 and Wound Healing',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/34267654/',
                    'source' => 'PubMed · Frontiers in pharmacology',
                ),
                array(
                    'title'  => 'Thymosin β4: a multi-functional regenerative peptide. Basic properties and clinical applications',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/22074294/',
                    'source' => 'PubMed · Expert opinion on biological therapy',
                ),
                array(
                    'title'  => 'The potential of GHK as an anti-aging peptide',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/35083444/',
                    'source' => 'PubMed · Aging pathobiology and therapeutics',
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
                    'source' => 'PubMed · European journal of endocrinology',
                ),
                array(
                    'title'  => 'Efficacy of ipamorelin, a novel ghrelin mimetic, in a rodent model of postoperative ileus',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/19289567/',
                    'source' => 'PubMed · The Journal of pharmacology and experimental therapeutics',
                ),
                array(
                    'title'  => 'The GH secretagogues ipamorelin and GH-releasing peptide-6 increase bone mineral content in adult female rats',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/10828840/',
                    'source' => 'PubMed · The Journal of endocrinology',
                ),
                array(
                    'title'  => 'Ipamorelin, a new growth-hormone-releasing peptide, induces longitudinal bone growth in rats',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/10373343/',
                    'source' => 'PubMed · Growth hormone & IGF research : official journal of the Growth Hormone Research Society and the International IGF Research Society',
                ),
                array(
                    'title'  => 'Growth hormone and growth hormone secretagogue effects on nitrogen balance and urea synthesis in steroid treated rats',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/19231263/',
                    'source' => 'PubMed · Growth hormone & IGF research : official journal of the Growth Hormone Research Society and the International IGF Research Society',
                ),
            ),
        ),
        'klow' => array(
            'label'  => 'KLOW Stack',
            'amino'  => 'assets/images/amino/klow.svg',
            'studies' => array(
                array(
                    'title'  => 'PepT1-mediated tripeptide KPV uptake reduces intestinal inflammation',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/18061177/',
                    'source' => 'PubMed · Gastroenterology',
                ),
                array(
                    'title'  => 'Dissection of the anti-inflammatory effect of the core and C-terminal (KPV) alpha-melanocyte-stimulating hormone peptides',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/12750433/',
                    'source' => 'PubMed · The Journal of pharmacology and experimental therapeutics',
                ),
                array(
                    'title'  => 'Stable Gastric Pentadecapeptide BPC 157 and Wound Healing',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/34267654/',
                    'source' => 'PubMed · Frontiers in pharmacology',
                ),
                array(
                    'title'  => 'The human tri-peptide GHK and tissue remodeling',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/18644225/',
                    'source' => 'PubMed · Journal of biomaterials science. Polymer edition',
                ),
                array(
                    'title'  => 'Thymosin β4: a multi-functional regenerative peptide. Basic properties and clinical applications',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/22074294/',
                    'source' => 'PubMed · Expert opinion on biological therapy',
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
                    'source' => 'PubMed · The Journal of pharmacology and experimental therapeutics',
                ),
                array(
                    'title'  => 'PepT1-mediated tripeptide KPV uptake reduces intestinal inflammation',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/18061177/',
                    'source' => 'PubMed · Gastroenterology',
                ),
                array(
                    'title'  => 'alpha-Melanocyte-stimulating hormone, MSH 11-13 KPV and adrenocorticotropic hormone signalling in human keratinocyte cells',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/15102092/',
                    'source' => 'PubMed · The Journal of investigative dermatology',
                ),
                array(
                    'title'  => 'alpha-MSH related peptides: a new class of anti-inflammatory and immunomodulating drugs',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/17934097/',
                    'source' => 'PubMed · Annals of the rheumatic diseases',
                ),
                array(
                    'title'  => 'Are melanocortin peptides future therapeutics for cutaneous wound healing?',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/30661264/',
                    'source' => 'PubMed · Experimental dermatology',
                ),
            ),
        ),
        'melanotan' => array(
            'label'  => 'Melanotan',
            'amino'  => '',
            'studies' => array(
                array(
                    'title'  => 'Melanotan II: a possible cause of renal infarction: review of the literature and case report',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/31953620/',
                    'source' => 'PubMed · CEN case reports',
                ),
                array(
                    'title'  => 'Use of melanotan I and II in the general population',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/19224885/',
                    'source' => 'PubMed · BMJ (Clinical research ed.)',
                ),
                array(
                    'title'  => 'Melanocortin receptor agonist melanotan-II microinjected in the nucleus accumbens decreases appetitive and consumptive responding for food',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/36155088/',
                    'source' => 'PubMed · Neuropeptides',
                ),
                array(
                    'title'  => 'Eruptive Melanocytic Nevi: A Review',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/31119650/',
                    'source' => 'PubMed · American journal of clinical dermatology',
                ),
                array(
                    'title'  => 'Discovery and development of novel melanogenic drugs. Melanotan-I and -II',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/9760697/',
                    'source' => 'PubMed · Pharmaceutical biotechnology',
                ),
                array(
                    'title'  => 'Melanotan-induced priapism: a hard-earned tan',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/30796078/',
                    'source' => 'PubMed · BMJ case reports',
                ),
                array(
                    'title'  => 'Melanotan II injection resulting in systemic toxicity and rhabdomyolysis',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/23121206/',
                    'source' => 'PubMed · Clinical toxicology (Philadelphia, Pa.)',
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
                    'source' => 'PubMed · Cell metabolism',
                ),
                array(
                    'title'  => 'MOTS-c: A promising mitochondrial-derived peptide for therapeutic exploitation',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/36761202/',
                    'source' => 'PubMed · Frontiers in endocrinology',
                ),
                array(
                    'title'  => 'The mitochondrial-derived peptide MOTS-c relieves hyperglycemia and insulin resistance in gestational diabetes mellitus',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/34798268/',
                    'source' => 'PubMed · Pharmacological research',
                ),
                array(
                    'title'  => 'Mitochondrial-Derived Peptide MOTS-c Suppresses Ovarian Cancer Progression by Attenuating USP7-Mediated LARS1 Deubiquitination',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/39321430/',
                    'source' => 'PubMed · Advanced science (Weinheim, Baden-Wurttemberg, Germany)',
                ),
                array(
                    'title'  => 'The Mitochondrial-Encoded Peptide MOTS-c Translocates to the Nucleus to Regulate Nuclear Gene Expression in Response to Metabolic Stress',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/29983246/',
                    'source' => 'PubMed · Cell metabolism',
                ),
                array(
                    'title'  => 'MOTS-c attenuates lung ischemia-reperfusion injury via MYH9-Dependent nuclear translocation and transcriptional activation of antioxidant genes',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/40403491/',
                    'source' => 'PubMed · Redox biology',
                ),
            ),
        ),
        'nad' => array(
            'label'  => 'NAD+',
            'amino'  => 'assets/images/amino/nad.svg',
            'studies' => array(
                array(
                    'title'  => 'Chronic nicotinamide riboside supplementation is well-tolerated and elevates NAD(+) in healthy middle-aged and older adults',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/29599478/',
                    'source' => 'PubMed · Nature communications',
                ),
                array(
                    'title'  => 'Safety and Metabolism of Long-term Administration of NIAGEN (Nicotinamide Riboside Chloride) in a Randomized, Double-Blind, Placebo-controlled Clinical Trial of Healthy Overweight Adults',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/31278280/',
                    'source' => 'PubMed · Scientific reports',
                ),
                array(
                    'title'  => 'Nicotinamide Riboside Augments the Aged Human Skeletal Muscle NAD(+) Metabolome and Induces Transcriptomic and Anti-inflammatory Signatures',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/31412242/',
                    'source' => 'PubMed · Cell reports',
                ),
                array(
                    'title'  => 'Nicotinamide riboside is uniquely and orally bioavailable in mice and humans',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/27721479/',
                    'source' => 'PubMed · Nature communications',
                ),
                array(
                    'title'  => 'Dietary Supplementation With NAD+-Boosting Compounds in Humans: Current Knowledge and Future Directions',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/37068054/',
                    'source' => 'PubMed · The journals of gerontology. Series A, Biological sciences and medical sciences',
                ),
            ),
        ),
        'pt-141' => array(
            'label'  => 'PT-141',
            'amino'  => '',
            'studies' => array(
                array(
                    'title'  => 'Hypoactive Sexual Desire Disorder in Women: Physiology, Assessment, Diagnosis, and Treatment',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/34510696/',
                    'source' => 'PubMed · Journal of midwifery & women\'s health',
                ),
                array(
                    'title'  => 'Female Sexual Desire, Arousal, and Orgasmic Dysfunctions: A Systematic Review and Meta-Analysis of Treatment Options',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/40543759/',
                    'source' => 'PubMed · Journal of minimally invasive gynecology',
                ),
                array(
                    'title'  => 'Targeting the central melanocortin system for the treatment of metabolic disorders',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/37365323/',
                    'source' => 'PubMed · Nature reviews. Endocrinology',
                ),
                array(
                    'title'  => 'Bremelanotide: First Approval',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/31429064/',
                    'source' => 'PubMed · Drugs',
                ),
            ),
        ),
        'retatrutide' => array(
            'label'  => 'Retatrutide',
            'amino'  => 'assets/images/amino/retatrutide.svg',
            'studies' => array(
                array(
                    'title'  => 'Triple-Hormone-Receptor Agonist Retatrutide for Obesity - A Phase 2 Trial',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/37366315/',
                    'source' => 'PubMed · The New England journal of medicine',
                ),
                array(
                    'title'  => 'Triple hormone receptor agonist retatrutide for metabolic dysfunction-associated steatotic liver disease: a randomized phase 2a trial',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/38858523/',
                    'source' => 'PubMed · Nature medicine',
                ),
                array(
                    'title'  => 'Retatrutide for the treatment of obesity, obstructive sleep apnea and knee osteoarthritis: Rationale and design of the TRIUMPH registrational clinical trials',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/41090431/',
                    'source' => 'PubMed · Diabetes, obesity & metabolism',
                ),
                array(
                    'title'  => 'The promise of glucagon-like peptide 1 receptor agonists (GLP-1RA) for the treatment of obesity: a look at phase 2 and 3 pipelines',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/40022548/',
                    'source' => 'PubMed · Expert opinion on investigational drugs',
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
                    'source' => 'PubMed · Bulletin of experimental biology and medicine',
                ),
                array(
                    'title'  => 'Selank, Peptide Analogue of Tuftsin, Protects Against Ethanol-Induced Memory Impairment by Regulating of BDNF Content in the Hippocampus and Prefrontal Cortex in Rats',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/31625062/',
                    'source' => 'PubMed · Bulletin of experimental biology and medicine',
                ),
                array(
                    'title'  => 'Selank and short peptides of the tuftsin family in the regulation of adaptive behavior in stress',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/14969422/',
                    'source' => 'PubMed · Neuroscience and behavioral physiology',
                ),
                array(
                    'title'  => 'Functional Connectomic Approach to Studying Selank and Semax Effects',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/32342318/',
                    'source' => 'PubMed · Doklady biological sciences : proceedings of the Academy of Sciences of the USSR, Biological sciences sections',
                ),
                array(
                    'title'  => 'A new property of the synthetic anxiolytic Selank and its derivatives',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/15508574/',
                    'source' => 'PubMed · Doklady biological sciences : proceedings of the Academy of Sciences of the USSR, Biological sciences sections',
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
                    'source' => 'PubMed · The New England journal of medicine',
                ),
                array(
                    'title'  => 'Effect of Continued Weekly Subcutaneous Semaglutide vs Placebo on Weight Loss Maintenance in Adults With Overweight or Obesity: The STEP 4 Randomized Clinical Trial',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/33755728/',
                    'source' => 'PubMed · JAMA',
                ),
                array(
                    'title'  => 'Two-year effects of semaglutide in adults with overweight or obesity: the STEP 5 trial',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/36216945/',
                    'source' => 'PubMed · Nature medicine',
                ),
                array(
                    'title'  => 'Semaglutide and Cardiovascular Outcomes in Patients with Type 2 Diabetes',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/27633186/',
                    'source' => 'PubMed · The New England journal of medicine',
                ),
                array(
                    'title'  => 'Semaglutide and Cardiovascular Outcomes in Obesity without Diabetes',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/37952131/',
                    'source' => 'PubMed · The New England journal of medicine',
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
                    'source' => 'PubMed · Brain research',
                ),
                array(
                    'title'  => 'Semax, synthetic ACTH(4-10) analogue, attenuates behavioural and neurochemical alterations following early-life fluvoxamine exposure in white rats',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/33418449/',
                    'source' => 'PubMed · Neuropeptides',
                ),
                array(
                    'title'  => 'Semax, a Synthetic Regulatory Peptide, Affects Copper-Induced Abeta Aggregation and Amyloid Formation in Artificial Membrane Models',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/35080861/',
                    'source' => 'PubMed · ACS chemical neuroscience',
                ),
                array(
                    'title'  => 'Influence of the N-terminus acetylation of Semax, a synthetic analog of ACTH(4-10), on copper(II) and zinc(II) coordination and biological properties',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/27586814/',
                    'source' => 'PubMed · Journal of inorganic biochemistry',
                ),
                array(
                    'title'  => 'Semax and Pro-Gly-Pro activate the transcription of neurotrophins and their receptor genes after cerebral ischemia',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/19633950/',
                    'source' => 'PubMed · Cellular and molecular neurobiology',
                ),
            ),
        ),
        'sermorelin' => array(
            'label'  => 'Sermorelin',
            'amino'  => '',
            'studies' => array(
                array(
                    'title'  => 'Advances in the detection of growth hormone releasing hormone synthetic analogs',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/34665524/',
                    'source' => 'PubMed · Drug testing and analysis',
                ),
                array(
                    'title'  => 'Beyond the androgen receptor: the role of growth hormone secretagogues in the modern management of body composition in hypogonadal males',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/32257855/',
                    'source' => 'PubMed · Translational andrology and urology',
                ),
                array(
                    'title'  => 'Sermorelin: a review of its use in the diagnosis and treatment of children with idiopathic growth hormone deficiency',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/18031173/',
                    'source' => 'PubMed · BioDrugs : clinical immunotherapeutics, biopharmaceuticals and gene therapy',
                ),
                array(
                    'title'  => 'Cationic exchange SPE combined with triple quadrupole UHPLC-MS/MS for detection of GHRHs in urine samples',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/37806509/',
                    'source' => 'PubMed · Analytical biochemistry',
                ),
                array(
                    'title'  => 'Online large volume sample staking preconcentration and separation of enantiomeric GHRH analogs by capillary electrophoresis',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/36787346/',
                    'source' => 'PubMed · Electrophoresis',
                ),
            ),
        ),
        'ss-31' => array(
            'label'  => 'SS-31',
            'amino'  => 'assets/images/amino/ss-31.svg',
            'studies' => array(
                array(
                    'title'  => 'Elamipretide (SS-31) improves mitochondrial dysfunction, synaptic and memory impairment induced by lipopolysaccharide in mice',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/31747905/',
                    'source' => 'PubMed · Journal of neuroinflammation',
                ),
                array(
                    'title'  => 'Potential Therapeutic Candidates for Age-Related Macular Degeneration (AMD)',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/34572131/',
                    'source' => 'PubMed · Cells',
                ),
                array(
                    'title'  => 'Elamipretide: A Review of Its Structure, Mechanism of Action, and Therapeutic Potential',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/39940712/',
                    'source' => 'PubMed · International journal of molecular sciences',
                ),
                array(
                    'title'  => 'SS-31@Fer-1 Alleviates ferroptosis in hypoxia/reoxygenation cardiomyocytes via mitochondrial targeting',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/39848110/',
                    'source' => 'PubMed · Biomedicine & pharmacotherapy = Biomedecine & pharmacotherapie',
                ),
                array(
                    'title'  => 'Beyond the injection: delivery systems reshaping retinal disease management',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/40319468/',
                    'source' => 'PubMed · Expert opinion on pharmacotherapy',
                ),
                array(
                    'title'  => 'Comprehensive dry eye therapy: overcoming ocular surface barrier and combating inflammation, oxidation, and mitochondrial damage',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/38725011/',
                    'source' => 'PubMed · Journal of nanobiotechnology',
                ),
            ),
        ),
        'ta-1' => array(
            'label'  => 'TA-1',
            'amino'  => '',
            'studies' => array(
                array(
                    'title'  => 'Aging and Thymosin Alpha-1',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/41373628/',
                    'source' => 'PubMed · International journal of molecular sciences',
                ),
                array(
                    'title'  => 'The efficacy and safety of thymosin α1 for sepsis (TESTS): multicentre, double blinded, randomised, placebo controlled, phase 3 trial',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/39814420/',
                    'source' => 'PubMed · BMJ (Clinical research ed.)',
                ),
                array(
                    'title'  => 'Thymosin α1 alleviates pulpitis by inhibiting ferroptosis of dental pulp cells',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/41087337/',
                    'source' => 'PubMed · International journal of oral science',
                ),
                array(
                    'title'  => 'Comprehensive Review of the Safety and Efficacy of Thymosin Alpha 1 in Human Clinical Trials',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/38308608/',
                    'source' => 'PubMed · Alternative therapies in health and medicine',
                ),
                array(
                    'title'  => 'Serum thymosin alpha 1 levels in normal and pathological conditions',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/30063864/',
                    'source' => 'PubMed · Expert opinion on biological therapy',
                ),
                array(
                    'title'  => 'A Pilot Trial of Thymalfasin (Thymosin-α-1) to Treat Hospitalized Patients With Hypoxemia and Lymphocytopenia Due to Coronavirus Disease 2019 Infection',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/36056913/',
                    'source' => 'PubMed · The Journal of infectious diseases',
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
                    'source' => 'PubMed · Expert opinion on biological therapy',
                ),
                array(
                    'title'  => 'Thymosin β4 as a restorative/regenerative therapy for neurological injury and neurodegenerative diseases',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/25613458/',
                    'source' => 'PubMed · Expert opinion on biological therapy',
                ),
                array(
                    'title'  => 'The role of thymosin-β4 in kidney disease',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/26096077/',
                    'source' => 'PubMed · Expert opinion on biological therapy',
                ),
                array(
                    'title'  => 'Thymosin beta 10 and thymosin beta 4 are both actin monomer sequestering proteins',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/8416954/',
                    'source' => 'PubMed · The Journal of biological chemistry',
                ),
            ),
        ),
        'tesamorelin' => array(
            'label'  => 'Tesamorelin',
            'amino'  => 'assets/images/amino/tesamorelin.svg',
            'studies' => array(
                array(
                    'title'  => 'Effect of tesamorelin on visceral fat and liver fat in HIV-infected patients with abdominal fat accumulation: a randomized clinical trial',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/25038357/',
                    'source' => 'PubMed · JAMA',
                ),
                array(
                    'title'  => 'Tesamorelin: a growth hormone-releasing factor analogue for HIV-associated lipodystrophy',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/22298602/',
                    'source' => 'PubMed · The Annals of pharmacotherapy',
                ),
                array(
                    'title'  => 'Tesamorelin, a human growth hormone releasing factor analogue',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/19243281/',
                    'source' => 'PubMed · Expert opinion on investigational drugs',
                ),
                array(
                    'title'  => 'Efficacy and safety of tesamorelin in people with HIV on integrase inhibitors',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/38905488/',
                    'source' => 'PubMed · AIDS (London, England)',
                ),
                array(
                    'title'  => 'Effects of Tesamorelin on Neurocognitive Impairment in Persons With HIV and Abdominal Obesity',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/39813152/',
                    'source' => 'PubMed · The Journal of infectious diseases',
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
                    'source' => 'PubMed · The New England journal of medicine',
                ),
                array(
                    'title'  => 'Tirzepatide Once Weekly for the Treatment of Obesity',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/35658024/',
                    'source' => 'PubMed · The New England journal of medicine',
                ),
                array(
                    'title'  => 'Tirzepatide for Obesity Treatment and Diabetes Prevention',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/39536238/',
                    'source' => 'PubMed · The New England journal of medicine',
                ),
                array(
                    'title'  => 'Efficacy and Safety of Tirzepatide in Type 2 Diabetes and Obesity Management',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/36750526/',
                    'source' => 'PubMed · Journal of obesity & metabolic syndrome',
                ),
                array(
                    'title'  => 'Tirzepatide for the treatment of obesity: Rationale and design of the SURMOUNT clinical development program',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/36478180/',
                    'source' => 'PubMed · Obesity (Silver Spring, Md.)',
                ),
            ),
        ),
        'wolverine' => array(
            'label'  => 'Wolverine Stack',
            'amino'  => 'assets/images/amino/wolverine.svg',
            'studies' => array(
                array(
                    'title'  => 'Gastric pentadecapeptide body protection compound BPC 157 and its role in accelerating musculoskeletal soft tissue healing',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/30915550/',
                    'source' => 'PubMed · Cell and tissue research',
                ),
                array(
                    'title'  => 'Stable Gastric Pentadecapeptide BPC 157 and Wound Healing',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/34267654/',
                    'source' => 'PubMed · Frontiers in pharmacology',
                ),
                array(
                    'title'  => 'Thymosin β4: a multi-functional regenerative peptide. Basic properties and clinical applications',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/22074294/',
                    'source' => 'PubMed · Expert opinion on biological therapy',
                ),
                array(
                    'title'  => 'Thymosin β4 as a restorative/regenerative therapy for neurological injury and neurodegenerative diseases',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/25613458/',
                    'source' => 'PubMed · Expert opinion on biological therapy',
                ),
                array(
                    'title'  => 'BPC 157 and Standard Angiogenic Growth Factors. Gastrointestinal Tract Healing, Lessons from Tendon, Ligament, Muscle and Bone Healing',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/29998800/',
                    'source' => 'PubMed · Current pharmaceutical design',
                ),
            ),
        ),
    );
}

/**
 * Resolve research compound key for the current product.
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

    // Blends first (more specific).
    if (preg_match('/\bklow\b/', $hay)) {
        return 'klow';
    }
    if (preg_match('/\bglow\b/', $hay)) {
        return 'glow';
    }
    if (preg_match('/\bwolverine\b/', $hay)) {
        return 'wolverine';
    }
    if (preg_match('/\bcjc\b/', $hay) && preg_match('/\bipamorelin\b/', $hay)) {
        return 'cjc-ipamorelin';
    }
    if (preg_match('/\btesamorelin\b/', $hay) && preg_match('/\bipamorelin\b/', $hay)) {
        return 'tesamorelin';
    }

    $map = array(
        'bpc-157' => '/\bbpc[\s-]?157\b/',
        'tb-500' => '/\btb[\s-]?500\b|\bthymosin\s*beta[\s-]?4\b/',
        'semax' => '/\bsemax\b/',
        'selank' => '/\bselank\b/',
        'ghk-cu' => '/\bghk[\s-]?cu\b/',
        'cjc-1295' => '/\bcjc([\s-]?1295)?\b/',
        'ipamorelin' => '/\bipamorelin\b/',
        'tesamorelin' => '/\btesamorelin\b/',
        'sermorelin' => '/\bsermorelin\b/',
        'mots-c' => '/\bmots[\s-]?c\b/',
        'ss-31' => '/\bss[\s-]?31\b|\belamipretide\b/',
        'pt-141' => '/\bpt[\s-]?141\b|\bbremelanotide\b/',
        'kpv' => '/\bkpv\b/',
        'nad' => '/\bnad\+?|\bnadplus\b/',
        'semaglutide' => '/\bsemaglutide\b/',
        'tirzepatide' => '/\btirzepatide\b/',
        'retatrutide' => '/\bretatrutide\b|\bretatrutride\b/',
        'aod-9604' => '/\baod[\s-]?9604\b/',
        'ta-1' => '/\bta[\s-]?1\b|\bthymosin\s*alpha[\s-]?1\b|\bthymalfasin\b/',
        'melanotan' => '/\bmelanotan\b|\bmelonotan\b/',
        '5-amino-1mq' => '/\b5[\s-]?amino[\s-]?1?mq\b|\b5[\s-]?amino[\s-]?mq\b/',
        'cagrilintide' => '/\bcagrilintide\b|\bcargrilinitide\b/',
        'dsip' => '/\bdsip\b/',
    );

    foreach ($map as $key => $pattern) {
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
    $studies = $entry['studies'];
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

