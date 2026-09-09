<?php
/**
 * Default page template.
 *
 * @package PalmBeachPeptides
 */

get_header();
?>

<?php while (have_posts()) : the_post(); ?>
  <header class="pb-page-header">
    <div class="pb-container">
      <h1><?php the_title(); ?></h1>
      <?php if (has_excerpt()) : ?>
        <p><?php echo esc_html(get_the_excerpt()); ?></p>
      <?php endif; ?>
    </div>
  </header>

  <main id="primary" class="site-main">
    <div class="entry-content">
      <?php the_content(); ?>
    </div>
  </main>
<?php endwhile; ?>

<?php
get_footer();
