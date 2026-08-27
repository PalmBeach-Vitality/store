<?php
/**
 * Terms and Policies — accordion sections (no Shopify references).
 *
 * @package PalmBeachVitality
 */

get_header();
$sections = pbv_terms_policy_sections();
?>
<header class="pbv-page-header">
  <div class="pbv-container">
    <h1><?php esc_html_e('Terms and Policies', 'palmbeach-vitality'); ?></h1>
  </div>
</header>
<main id="primary" class="site-main pbv-section">
  <div class="pbv-container pbv-policies">
    <p class="pbv-policies__intro">Select a policy below to read the full text.</p>
    <div class="pbv-policies__list">
      <?php foreach ($sections as $id => $section) : ?>
        <details class="pbv-policy" id="<?php echo esc_attr($id); ?>">
          <summary class="pbv-policy__summary">
            <span><?php echo esc_html($section['title']); ?></span>
            <span class="pbv-policy__chevron" aria-hidden="true"></span>
          </summary>
          <div class="pbv-policy__body entry-content pbv-legal">
            <?php echo $section['html']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
          </div>
        </details>
      <?php endforeach; ?>
    </div>
  </div>
</main>
<script>
(function () {
  function openPolicyFromHash() {
    var hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    var el = document.getElementById(hash);
    if (!el || el.tagName.toLowerCase() !== "details") return;
    el.open = true;
    window.setTimeout(function () {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }
  openPolicyFromHash();
  window.addEventListener("hashchange", openPolicyFromHash);
})();
</script>
<?php
get_footer();
