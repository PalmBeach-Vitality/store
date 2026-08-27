<?php
/**
 * Blog / posts index — not used on this storefront.
 * Redirect away so visitors never see an "Updates" listing.
 *
 * @package PalmBeachVitality
 */

wp_safe_redirect(home_url('/'), 301);
exit;
