<?php
/**
 * Page template.
 *
 * @package PalmBeachVitality
 */
get_header();
while (have_posts()) :
    the_post();
    ?>
  <header class="pbv-page-header">
    <div class="pbv-container">
      <h1><?php the_title(); ?></h1>
    </div>
  </header>
  <main id="primary" class="site-main">
    <div class="entry-content">
      <?php the_content(); ?>
    </div>
  </main>
    <?php
endwhile;
get_footer();
