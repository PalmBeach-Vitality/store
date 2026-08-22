<?php
/**
 * Main index fallback.
 *
 * @package PalmBeachPeptides
 */

get_header();
?>

<header class="pb-page-header">
  <div class="pb-container">
    <h1><?php echo esc_html(get_the_title(get_option('page_for_posts')) ?: __('Updates', 'palmbeach-peptides')); ?></h1>
  </div>
</header>

<main id="primary" class="site-main">
  <div class="entry-content">
    <?php if (have_posts()) : ?>
      <?php while (have_posts()) : the_post(); ?>
        <article <?php post_class(); ?> style="margin-bottom:2.5rem">
          <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
          <?php the_excerpt(); ?>
        </article>
      <?php endwhile; ?>
      <?php the_posts_pagination(); ?>
    <?php else : ?>
      <p><?php esc_html_e('No posts yet.', 'palmbeach-peptides'); ?></p>
    <?php endif; ?>
  </div>
</main>

<?php
get_footer();
