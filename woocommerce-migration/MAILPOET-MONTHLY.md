# MailPoet — subscribers + monthly email blog

WordPress.com Commerce already includes **MailPoet** and **MailPoet Premium**. The theme (v2.10.39+) saves every homepage-popup signup and adds them to MailPoet when the plugin is active.

Authenticate **palmbeach-vitality.com** in MailPoet → Settings → Send with… so confirmation mail is signed (SPF/DKIM). Otherwise Gmail shows “sender can’t be verified” and files it in spam. See [`EMAIL-AUTHENTICATION.md`](./EMAIL-AUTHENTICATION.md).

## Sign-up confirmation (double opt-in)

**On.** Required when sending with the MailPoet Sending Service.

1. The storefront still sends the branded intro immediately (with **WELCOME20**).
2. MailPoet also sends a **confirmation email**.
3. After they click Confirm, MailPoet marks them **Confirmed** and they receive newsletters.

The theme turns on **MailPoet → Settings → Sign-up Confirmation** and does **not** add people as already Subscribed (that would skip confirmation).

You can edit the confirmation email copy on that same settings tab. Leave the feature enabled.

## Where to see subscribers

1. **WP Admin → Email list** — everyone who subscribed after this theme upload (CSV download on that page).
2. **WP Admin → MailPoet → Subscribers** — the list used to send newsletters. Look for the **Palm Beach Vitality** list.
3. Signups from *before* this version only exist in staff “New subscriber” emails, n8n executions, or Gmail Sent.

## Activate MailPoet

1. WP Admin → **Plugins**.
2. Activate **MailPoet** (and **MailPoet Premium** if listed).
3. Finish the MailPoet wizard (sender: `sales@palmbeach-vitality.com`).
4. WP Admin → **Email list** → **Sync to MailPoet** (pushes anyone already stored in WordPress).

Turn **off** MailPoet’s own Welcome Email. New subscribers already get the branded intro from the storefront popup (with **WELCOME20**). Two welcome emails would look like a duplicate.

## Monthly email blog

This is a MailPoet **newsletter**, not a public `/blog/` page (the storefront still sends `/blog/` to the homepage).

1. Draft the issue in **WP Admin → Lab Notes** (private; not on the website).
2. **MailPoet → Emails → New email → Newsletter**.
3. Send to the **Palm Beach Vitality** list.
4. Optional: **MailPoet → Emails → Automations** (or a scheduled newsletter) on the 1st of each month.

## Intro email + WELCOME20

The subscribe popup still sends the cyan intro email via n8n (with WordPress as fallback). One of the bullets is:

> 20% off your first order with code **WELCOME20**

`WELCOME20` stays a WooCommerce coupon (new clients, 1 use, stacks with `AS-1010`).
