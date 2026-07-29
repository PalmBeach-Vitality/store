<?php
/**
 * Theme footer.
 *
 * @package PalmBeachVitality
 */
?>
  <footer class="site-footer">
    <div class="pbv-container">
      <div class="site-footer__grid">
        <div>
          <a class="site-brand" href="<?php echo esc_url(home_url('/')); ?>">
            <span class="site-brand__mark" aria-hidden="true">PB</span>
            <span class="site-brand__text">
              <span class="site-brand__name" style="color:#fff">Palm Beach</span>
              <span class="site-brand__tag">Vitality</span>
            </span>
          </a>
          <p style="margin-top:1rem;max-width:18rem">Research-grade peptides. Clean storefront. Built for serious buyers.</p>
        </div>
        <div>
          <h4>Shop</h4>
          <ul>
            <li><a href="<?php echo esc_url(home_url('/shop/')); ?>">All products</a></li>
            <?php if (function_exists('wc_get_cart_url')) : ?>
              <li><a href="<?php echo esc_url(wc_get_cart_url()); ?>">Cart</a></li>
              <li><a href="<?php echo esc_url(wc_get_checkout_url()); ?>">Checkout</a></li>
            <?php endif; ?>
          </ul>
        </div>
        <div>
          <h4>Company</h4>
          <ul>
            <li><a href="<?php echo esc_url(home_url('/about/')); ?>">About</a></li>
            <li><a href="<?php echo esc_url(home_url('/research/')); ?>">Research</a></li>
            <li><a href="<?php echo esc_url(home_url('/faq/')); ?>">FAQ</a></li>
            <li><a href="<?php echo esc_url(home_url('/contact/')); ?>">Contact</a></li>
          </ul>
        </div>
      </div>
      <div class="site-footer__legal">
        <p>&copy; <?php echo esc_html(gmdate('Y')); ?> Palm Beach Vitality</p>
        <p>Research use only. Not for human consumption. Not evaluated by the FDA.</p>
      </div>
    </div>
  </footer>
</div>
<?php wp_footer(); ?>
</body>
</html>
