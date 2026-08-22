<?php
/**
 * Single post.
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
    <article class="entry-content">
      <?php the_content(); ?>
      <div class="pbv-disclaimer"><strong>Research Use Only:</strong> Educational and laboratory research purposes only.</div>
    </article>
  </main>
    <?php
endwhile;
get_footer();
