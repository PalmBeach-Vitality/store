<?php
/**
 * Page template.
 *
 * @package PalmBeachVitality
 */
get_header();
while (have_posts()) :
    the_post();
    $pbv_is_research = is_page('research');
    if (!$pbv_is_research) :
        ?>
  <header class="pbv-page-header">
    <div class="pbv-container">
      <h1><?php the_title(); ?></h1>
    </div>
  </header>
        <?php
    endif;
    ?>
  <main id="primary" class="site-main pbv-section<?php echo $pbv_is_research ? ' pbv-research-index' : ''; ?>">
    <div class="pbv-container entry-content">
      <?php
      if (is_page(array('about', 'faq'))) {
          echo pbv_official_sites_html();
      }
      the_content();
      ?>
    </div>
  </main>
    <?php
endwhile;
get_footer();
