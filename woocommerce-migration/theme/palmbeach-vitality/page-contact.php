<?php
/**
 * Contact page — custom form emails sales@palmbeach-vitality.com.
 *
 * @package PalmBeachVitality
 */

get_header();
?>
<header class="pbv-page-header">
  <div class="pbv-container">
    <h1><?php esc_html_e('Contact Us', 'palmbeach-vitality'); ?></h1>
  </div>
</header>
<main id="primary" class="site-main pbv-section">
  <div class="pbv-container pbv-contact">
    <p class="pbv-contact__intro">
      <?php esc_html_e('Reach Palm Beach Vitality for order support, wholesale inquiries, or research documentation questions. Fill out the form below and our team will get back to you.', 'palmbeach-vitality'); ?>
    </p>

    <div class="pbv-contact__status" data-contact-status hidden role="status" aria-live="polite"></div>

    <form class="pbv-contact-form" data-contact-form novalidate>
      <?php wp_nonce_field('pbv_contact_form', 'pbv_contact_nonce'); ?>
      <input type="hidden" name="action" value="pbv_contact_form" />
      <!-- Honeypot -->
      <div class="pbv-contact-form__hp" aria-hidden="true">
        <label for="pbv-contact-company"><?php esc_html_e('Company', 'palmbeach-vitality'); ?></label>
        <input type="text" id="pbv-contact-company" name="company" tabindex="-1" autocomplete="off" />
      </div>

      <div class="pbv-contact-form__row">
        <div class="pbv-contact-form__field">
          <label for="pbv-contact-first-name"><?php esc_html_e('First name', 'palmbeach-vitality'); ?> <span aria-hidden="true">*</span></label>
          <input type="text" id="pbv-contact-first-name" name="first_name" required autocomplete="given-name" />
        </div>
        <div class="pbv-contact-form__field">
          <label for="pbv-contact-last-name"><?php esc_html_e('Last name', 'palmbeach-vitality'); ?> <span aria-hidden="true">*</span></label>
          <input type="text" id="pbv-contact-last-name" name="last_name" required autocomplete="family-name" />
        </div>
      </div>

      <div class="pbv-contact-form__row">
        <div class="pbv-contact-form__field">
          <label for="pbv-contact-email"><?php esc_html_e('Email', 'palmbeach-vitality'); ?> <span aria-hidden="true">*</span></label>
          <input type="email" id="pbv-contact-email" name="email" required autocomplete="email" />
        </div>
        <div class="pbv-contact-form__field">
          <label for="pbv-contact-phone"><?php esc_html_e('Phone number', 'palmbeach-vitality'); ?> <span aria-hidden="true">*</span></label>
          <input type="tel" id="pbv-contact-phone" name="phone" required autocomplete="tel" />
        </div>
      </div>

      <div class="pbv-contact-form__field">
        <label for="pbv-contact-subject"><?php esc_html_e('Subject', 'palmbeach-vitality'); ?> <span aria-hidden="true">*</span></label>
        <input type="text" id="pbv-contact-subject" name="subject" required maxlength="200" />
      </div>

      <button type="submit" class="pbv-contact-form__submit" data-contact-submit>
        <?php esc_html_e('Submit', 'palmbeach-vitality'); ?>
      </button>
    </form>
  </div>
</main>
<?php
get_footer();
