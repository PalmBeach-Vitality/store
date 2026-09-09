<?php
/**
 * Theme footer.
 *
 * @package PalmBeachPeptides
 */
?>
  <footer class="site-footer">
    <div class="pb-container">
      <div class="site-footer__grid">
        <div class="site-footer__brand">
          <a class="site-brand" href="<?php echo esc_url(home_url('/')); ?>">
            <span class="site-brand__mark" aria-hidden="true">PB</span>
            <span>
              <div class="site-brand__name" style="color:#fff">Palm Beach</div>
              <div class="site-brand__tag">Peptides</div>
            </span>
          </a>
          <p style="margin-top:1rem">Precision. Purity. Palm Beach Made. Premium American-made peptides for researchers, clinics, and B2B brands.</p>
        </div>

        <div>
          <h4>Products</h4>
          <ul>
            <li><a href="<?php echo esc_url(home_url('/shop/')); ?>">Full Catalog</a></li>
            <li><a href="<?php echo esc_url(home_url('/product-category/growth-factors/')); ?>">Growth Factors</a></li>
            <li><a href="<?php echo esc_url(home_url('/product-category/metabolic/')); ?>">Metabolic</a></li>
            <li><a href="<?php echo esc_url(home_url('/product-category/cognitive/')); ?>">Cognitive</a></li>
            <li><a href="<?php echo esc_url(home_url('/product-category/stacks/')); ?>">Stacks</a></li>
          </ul>
        </div>

        <div>
          <h4>Company</h4>
          <ul>
            <li><a href="<?php echo esc_url(home_url('/about/')); ?>">About</a></li>
            <li><a href="<?php echo esc_url(home_url('/research/')); ?>">Research</a></li>
            <li><a href="<?php echo esc_url(home_url('/wholesale/')); ?>">Wholesale</a></li>
            <li><a href="<?php echo esc_url(home_url('/faq/')); ?>">FAQ</a></li>
            <li><a href="<?php echo esc_url(home_url('/contact/')); ?>">Contact</a></li>
          </ul>
        </div>

        <div>
          <h4>Account</h4>
          <ul>
            <?php if (function_exists('wc_get_page_permalink')) : ?>
              <li><a href="<?php echo esc_url(wc_get_page_permalink('myaccount')); ?>">My Account</a></li>
              <li><a href="<?php echo esc_url(wc_get_cart_url()); ?>">Cart</a></li>
              <li><a href="<?php echo esc_url(wc_get_checkout_url()); ?>">Checkout</a></li>
            <?php endif; ?>
          </ul>
        </div>
      </div>

      <div class="site-footer__legal">
        <p>&copy; <?php echo esc_html(gmdate('Y')); ?> Palm Beach Peptides. All rights reserved.</p>
        <p>All products are intended for research purposes only. Not for human consumption. Not evaluated by the FDA.</p>
      </div>
    </div>
  </footer>
</div>
<?php wp_footer(); ?>
</body>
</html>
