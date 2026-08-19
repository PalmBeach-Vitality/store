# Email authentication (stop Gmail “sender can’t be verified”)

Gmail shows **This message isn't authenticated and the sender can't be verified** when From is `sales@palmbeach-vitality.com` but the mail was **not** sent through Google or Mailgun.

`palmbeach-vitality.com` DNS today:

- SPF: Google + Mailgun only (`include:_spf.google.com include:mailgun.org`)
- DKIM: `google._domainkey` and `smtp._domainkey` (Mailgun)
- DMARC: `p=quarantine` (Gmail treats failures as spam)

WordPress.com is **not** on that SPF list. Sending From `sales@…com` via WordPress.com fails DMARC.

## What we changed in the theme (v2.10.39)

- Intro / WooCommerce mail from WordPress now uses `wordpress@palmbeach-vitality.store` (SPF includes `_spf.wpcloud.com`) and **Reply-To** `sales@palmbeach-vitality.com`.
- The subscribe popup always posts to the n8n intro webhook (Gmail), instead of silently falling back to unsigned WordPress mail.

## What you still need in n8n (so From is sales@)

The intro is currently sent by the **Gmail** node as `salvatorejohnson1984@gmail.com`. That is a personal Gmail address, so Gmail will not treat it as Palm Beach Vitality.

Normalize lead → **Email intro** → Respond 200

1. In Google Workspace (MX already points at Google for `.com`), use mailbox **sales@palmbeach-vitality.com**.
2. In n8n, reopen the **Gmail account** credential and sign in as **sales@palmbeach-vitality.com** (not the @gmail.com login).
3. Keep sender name **Palm Beach Vitality**. Do not set Reply-To to a different domain than From.

Until that credential is the Workspace mailbox, intros will be authenticated as Gmail, not as the store.

## MailPoet confirmation emails

MailPoet → Settings → Send with… → authenticate **palmbeach-vitality.com** (add the DKIM CNAMEs MailPoet shows). Do not replace the Google/Mailgun SPF — add MailPoet’s `include:` if they give one.

Turn on sign-up confirmation (already required for the MailPoet Sending Service).
