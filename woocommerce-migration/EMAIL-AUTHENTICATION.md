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

### 3. Replace the DKIM TXT at GoDaddy, then Start authentication

Google generated a **new** key. DNS still has the **old** `google._domainkey` value, so **do not** click Start authentication yet.

GoDaddy (nameservers `ns43` / `ns44.domaincontrol.com`) → **palmbeach-vitality.com** → **DNS** → find the existing **TXT** named `google._domainkey` → **Edit** (do not add a second one).

| Field | Value |
|---|---|
| Type | TXT |
| Name / Host | `google._domainkey` (not `google._domainkey.palmbeach-vitality.com`) |
| Value | `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAh1lGf3Uapqo/7vKbu52Wp58twD2IIAYxnpyq9/6yhdorMFbmn8z5zjECc6txMSzpn3Y00G32im/XlheJkWdYTXJomSDotxurVQeaDfH9Nju/6qnRxUwkXMy2U+el9IZR5XuQk3PNgNqYZnBJ5lgDVi4OBOlincd32UwYKwHZ63v5g3VLIe8tYJuquP2CI4p1yQlZlCH8HOtm+F1jb0x0QpvGcKbgvGYVQCsVJA70mZi7ICSf8ir7xSz7ySm6AF8iJOHZ0Wfm7twW3C0m5JIlA8F1e6tkB8FJQDUldhvfMw0bgvDOpVw4Ooe3kon4DOfJl6fmRhgCaCSLnQCrDvr1qwIDAQAB` |
| TTL | 600 seconds (or 1 hour) |

Save. Wait until a lookup shows `p=MIIB…Ah1lGf3Uapqo` (not the old `AwsGvqdTeCyU` key). Then in Google Admin click **Start authentication**.

Leave the Mailgun `smtp._domainkey` TXT alone.

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
