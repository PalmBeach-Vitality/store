<?php
/**
 * Homepage — hero copy overlay + FAQ (no product grid).
 *
 * @package PalmBeachVitality
 */

get_header();

$hero        = pbv_hero_image_url();
$hero_mobile = pbv_hero_mobile_image_url();
?>
<style id="pbv-hero-critical">
/* Critical hero — mobile: 9:16 min frame, content never clipped; desktop wide banner */
.pbv-hero{display:block;width:100%;padding:.75rem .85rem .5rem;margin:0;box-sizing:border-box;}
.pbv-hero-photo{
  position:relative;display:block;width:100%;
  /* Grow with copy; never shorter than true 9:16 of the photo width */
  aspect-ratio:auto;height:auto;
  min-height:calc((100vw - 1.7rem) * 16 / 9);
  margin:0;border-radius:1.25rem;overflow:hidden;isolation:isolate;
  box-shadow:0 12px 28px rgba(0,0,0,.16);color:#fff;
  background:linear-gradient(120deg,#0b1220 0%,#12304a 45%,#1a6b7a 100%);
}
.pbv-hero-photo__img{
  position:absolute;inset:0;z-index:0;width:100%;height:100%;
  max-width:none;object-fit:cover;object-position:center top;
  display:block;border:0;
}
.pbv-hero-photo__overlay{
  position:absolute;inset:0;z-index:1;pointer-events:none;border-radius:inherit;
  background:linear-gradient(180deg,rgba(3,8,18,.5) 0%,rgba(3,8,18,.7) 42%,rgba(3,8,18,.9) 100%);
}
/* Content in normal flow — drives height so nothing is cut off */
.pbv-hero-photo__content{
  position:relative;z-index:2;box-sizing:border-box;width:100%;height:auto;
  min-height:inherit;margin:0;
  display:flex;flex-direction:column;justify-content:center;align-items:center;
  padding:clamp(1.1rem,4.5vw,1.5rem) clamp(.9rem,3.5vw,1.2rem) clamp(1.25rem,4.5vw,1.65rem);
  text-align:center;overflow:visible;color:#fff;
}
.pbv-hero-photo__title,
.pbv-hero-photo__subtitle,
.pbv-hero-photo__body,
.pbv-hero-photo__welcome,
.pbv-hero-photo__wholesale{
  display:block!important;visibility:visible!important;opacity:1!important;
  width:100%;max-width:22rem;flex-shrink:0;
}
.pbv-hero-photo__title{margin:0 0 .35rem;font-size:clamp(1.38rem,5.75vw,1.9rem);font-weight:700;line-height:1.15;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.45);}
.pbv-hero-photo__subtitle{margin:0 0 .65rem;font-size:clamp(.98rem,3.8vw,1.21rem);font-weight:700;line-height:1.25;color:#7ec8ff;text-shadow:0 1px 2px rgba(0,0,0,.35);}
.pbv-hero-photo__body{margin:0 0 .5rem;font-size:clamp(.76rem,2.9vw,.9rem);font-weight:400;line-height:1.42;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.4);}
.pbv-hero-photo__welcome{margin:.4rem 0 .55rem;font-size:clamp(1.06rem,3.9vw,1.27rem);font-weight:700;line-height:1.3;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.45);}
.pbv-hero-photo__wholesale{margin:0;font-size:clamp(.74rem,2.65vw,.85rem);line-height:1.4;color:#fff;}
.pbv-hero-photo__wholesale a{color:#7ec8ff;text-decoration:underline;text-underline-offset:.12em;}
@media (min-width:750px){
  .pbv-hero{display:flex!important;justify-content:center!important;align-items:center!important;padding:1.25rem 1rem .75rem!important;}
  /* Desktop: same width as logo card; height = 2 × logo height */
  .pbv-hero-photo{
    width:min(64rem, 100vw - 2rem)!important;
    max-width:min(64rem, 100vw - 2rem)!important;
    height:calc(min(64rem, 100vw - 2rem) / 2.35 * 2)!important;
    min-height:0!important;
    aspect-ratio:auto!important;
    margin:0 auto!important;
    border-radius:1.5rem!important;
    box-shadow:0 18px 40px rgba(0,0,0,.18)!important;
  }
  .pbv-hero-photo__img{object-position:center center;}
  .pbv-hero-photo__content{
    position:absolute!important;inset:0!important;height:100%!important;min-height:0!important;
    padding:1.75rem 1.35rem 1.85rem!important;overflow:auto!important;justify-content:center!important;
  }
  /* Desktop hero type +10% over previous live sizes */
  .pbv-hero-photo__title{font-size:2.34rem;}
  .pbv-hero-photo__subtitle{font-size:1.39rem;margin-bottom:1rem;}
  .pbv-hero-photo__body{font-size:1.01rem;line-height:1.45;}
  .pbv-hero-photo__welcome{font-size:1.52rem;}
  .pbv-hero-photo__wholesale{font-size:.936rem;}
}
</style>

<section class="pbv-hero" aria-label="<?php esc_attr_e('Homepage banner', 'palmbeach-vitality'); ?>">
  <div class="pbv-hero-photo<?php echo ($hero || $hero_mobile) ? '' : ' pbv-hero-photo--placeholder'; ?>">
    <?php if ($hero_mobile || $hero) : ?>
      <picture>
        <?php if ($hero) : ?>
          <source media="(min-width: 750px)" srcset="<?php echo esc_url($hero); ?>" />
        <?php endif; ?>
        <img
          class="pbv-hero-photo__img"
          src="<?php echo esc_url($hero_mobile ? $hero_mobile : $hero); ?>"
          alt=""
          width="1080"
          height="1920"
          decoding="async"
          fetchpriority="high"
        />
      </picture>
    <?php endif; ?>
    <div class="pbv-hero-photo__overlay" aria-hidden="true"></div>
    <div class="pbv-hero-photo__content">
      <h1 class="pbv-hero-photo__title">Palm Beach Vitality</h1>
      <p class="pbv-hero-photo__subtitle">Premium Peptides. Precision Crafted.</p>
      <p class="pbv-hero-photo__body">Every product is manufactured in state-of-the-art U.S. facilities using advanced automated peptide synthesis technology. Our process combines precision solid-phase synthesis with rigorous multi-stage purification and comprehensive quality control, including HPLC and mass spectrometry testing. Produced under strict cGMP standards with full traceability and third-party verification, each vial delivers exceptional purity, potency, and consistency you can trust.</p>
      <p class="pbv-hero-photo__body">No shortcuts. No compromises. Just the finest peptides available — made right here in America with cutting-edge science and uncompromising quality standards.</p>
      <p class="pbv-hero-photo__welcome">Welcome to Palm Beach Vitality.<br>Where premium meets performance.</p>
      <p class="pbv-hero-photo__wholesale">For wholesale information please visit <a href="https://www.palmbeach-vitality.com">www.palmbeach-vitality.com</a></p>
    </div>
  </div>
</section>

<section class="pbv-faq" id="faq">
  <div class="pbv-container pbv-faq__inner">
    <h2 class="pbv-faq__title">Frequently asked questions</h2>

    <div class="pbv-faq__list">
      <details class="pbv-faq__item">
        <summary>Are your peptides intended for human consumption or medical use?<span class="pbv-faq__chevron" aria-hidden="true"></span></summary>
        <div class="pbv-faq__answer">No. All products are intended strictly for research purposes only. They are not for human or veterinary use, not evaluated by the FDA, and not sold as drugs, supplements, or cosmetics for consumption.</div>
      </details>

      <details class="pbv-faq__item">
        <summary>Do you provide Certificates of Analysis (COAs) and purity testing?<span class="pbv-faq__chevron" aria-hidden="true"></span></summary>
        <div class="pbv-faq__answer">Yes. Every order includes a Certificate of Analysis. Most batches test at 99%+ purity via independent third-party HPLC, with full batch traceability.</div>
      </details>

      <details class="pbv-faq__item">
        <summary>How should research peptides be stored?<span class="pbv-faq__chevron" aria-hidden="true"></span></summary>
        <div class="pbv-faq__answer">Lyophilized peptides are typically stable at room temperature for short periods but should be refrigerated (2–8°C) or frozen for long-term storage. Once reconstituted, follow the protocol for that compound. Protect from light and moisture.</div>
      </details>

      <details class="pbv-faq__item">
        <summary>Do you ship to all 50 states? How fast is shipping?<span class="pbv-faq__chevron" aria-hidden="true"></span></summary>
        <div class="pbv-faq__answer">Yes. We ship to all 50 states with cold-chain packaging as needed. Overnight options are available Monday through Friday where carriers allow.</div>
      </details>

      <details class="pbv-faq__item">
        <summary>Do you offer volume or bulk pricing?<span class="pbv-faq__chevron" aria-hidden="true"></span></summary>
        <div class="pbv-faq__answer">Yes. Volume pricing is available for verified wholesale buyers. Visit our <a href="<?php echo esc_url(home_url('/wholesale/')); ?>">Wholesale</a> page to apply, or <a href="<?php echo esc_url(home_url('/contact/')); ?>">contact us</a> for a custom quote.</div>
      </details>
    </div>
  </div>
</section>

<?php
get_footer();
