<?php
/**
 * Fallback index.
 *
 * @package PalmBeachVitality
 */
get_header();
?>
<header class="pbv-page-header">
  <div class="pbv-container">
    <h1><?php esc_html_e('Updates', 'palmbeach-vitality'); ?></h1>
  </div>
</header>
<main id="primary" class="site-main">
  <div class="entry-content">
    <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
      <article <?php post_class(); ?> style="margin-bottom:2rem">
        <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
        <?php the_excerpt(); ?>
      </article>
    <?php endwhile; the_posts_pagination(); else : ?>
      <p><?php esc_html_e('No posts yet.', 'palmbeach-vitality'); ?></p>
    <?php endif; ?>
  </div>
</main>
<?php get_footer(); ?>
