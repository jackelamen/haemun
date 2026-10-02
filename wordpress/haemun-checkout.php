<?php
/**
 * Haemun storefront → WooCommerce checkout handoff.
 *
 * Paste this block at the end of your theme's functions.php.
 *
 * The storefront sends shoppers to:
 *   https://your-wordpress-site/?haemun_cart=11:2,28:1
 * (product ID : quantity, comma-separated). This fills the WooCommerce cart
 * with exactly those items and redirects to WooCommerce's own checkout, so
 * payment, tax, shipping and order emails all stay in WooCommerce.
 */
add_action( 'template_redirect', function () {
	if ( empty( $_GET['haemun_cart'] ) || ! function_exists( 'WC' ) || ! WC()->cart ) {
		return;
	}

	$raw   = sanitize_text_field( wp_unslash( $_GET['haemun_cart'] ) );
	$pairs = array_slice( explode( ',', $raw ), 0, 50 );

	// Replace, not append, so repeat clicks never double the order.
	WC()->cart->empty_cart();

	foreach ( $pairs as $pair ) {
		$parts   = explode( ':', $pair );
		$id      = absint( $parts[0] ?? 0 );
		$qty     = min( 99, max( 1, absint( $parts[1] ?? 1 ) ) );
		$product = $id ? wc_get_product( $id ) : null;

		if ( $product && $product->is_purchasable() && $product->is_in_stock() ) {
			WC()->cart->add_to_cart( $id, $qty );
		}
	}

	wp_safe_redirect( WC()->cart->is_empty() ? wc_get_cart_url() : wc_get_checkout_url() );
	exit;
} );
