<?php
/**
 * Single post / research article.
 *
 * @package PalmBeachPeptides
 */

get_header();
?>

<?php while (have_posts()) : the_post(); ?>
  <header class="pb-page-header">
    <div class="pb-container">
      <h1><?php the_title(); ?></h1>
    </div>
  </header>

  <main id="primary" class="site-main">
    <article class="entry-content">
      <?php the_content(); ?>
      <div class="pb-disclaimer">
        <strong>Research Use Only:</strong> All information on this page is provided for educational and laboratory research purposes. Products referenced are intended strictly for research use.
      </div>
    </article>
  </main>
<?php endwhile; ?>

<?php
get_footer();
