# Email authentication (stop Gmail “sender can’t be verified”)

Gmail shows **This message isn't authenticated and the sender can't be verified** when From is `sales@palmbeach-vitality.com` but the mail was **not** signed by Google (or Mailgun).

`palmbeach-vitality.com` DNS today:

- SPF: Google + Mailgun (`include:_spf.google.com include:mailgun.org`)
- DKIM: `google._domainkey` (must also be **started** in Admin)
- DMARC: `p=quarantine`

WordPress.com is **not** on that SPF list. Theme v2.10.39+ sends WordPress mail From `wordpress@palmbeach-vitality.store` instead.

n8n **Email intro** now uses Gmail credential **Gmail account 2**. That login must be the **sales@** Workspace mailbox.

Normalize lead → **Email intro** → Respond 200

## What to fix in the sales@ Gmail / Workspace account

Do these in order. Skip anything already done.

### 1. Confirm n8n is actually sales@
In n8n, open the **Gmail account 2** credential. The Google account on the consent screen must be **sales@palmbeach-vitality.com**, not `salvatorejohnson1984@gmail.com`.

Send a test from n8n. In the received message, **Show original**. `From:` must be `sales@palmbeach-vitality.com`.

### 2. Default “Send mail as”
Signed in as **sales@** → Gmail → ⚙️ → **See all settings** → **Accounts and Import** → **Send mail as**:

- Address: `sales@palmbeach-vitality.com`
- Name: **Palm Beach Vitality**
- Treat as the **default**
- Do **not** set a different Reply-to address

### 3. Turn DKIM on (this is the usual miss)
DNS already has `google._domainkey.palmbeach-vitality.com`. Google still has to **start signing**.

1. [admin.google.com](https://admin.google.com) as a Workspace admin
2. **Apps → Google Workspace → Gmail → Authenticate email**
3. Domain: **palmbeach-vitality.com**
4. Status must say Gmail is authenticating email (DKIM **on**)
5. If it still says generate / start authentication: click **Start authentication** (record is already in DNS)

### 4. Allow n8n to send
Still in Admin (if a send from n8n is blocked or asks for access):

- **Security → Access and data control → API controls** — n8n/Google OAuth is not blocked
- **Apps → Google Workspace → Gmail → User settings** — Gmail is **On** for the sales user
- On the **sales@** account: 2-Step Verification on (required for some OAuth)

You do **not** need “less secure apps” or an App Password. The Gmail node uses OAuth.

### 5. Check a test (headers)
Send one intro to a Gmail inbox you control. Open the message → **⋮ → Show original**. You want:

- `From: Palm Beach Vitality <sales@palmbeach-vitality.com>`
- `SPF: PASS` with `include:_spf.google.com`
- `DKIM: PASS` with `d=palmbeach-vitality.com` (not `d=gmail.com`)
- `DMARC: PASS`

If DKIM is `d=gmail.com`, n8n is still the personal Gmail login. Reconnect **Gmail account 2** as sales@.

## MailPoet confirmation emails

MailPoet → Settings → Send with… → authenticate **palmbeach-vitality.com** (add MailPoet’s DKIM CNAMEs). Do not replace the Google/Mailgun SPF.
