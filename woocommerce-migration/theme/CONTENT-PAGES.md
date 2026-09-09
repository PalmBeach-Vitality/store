# Content pages to create in WordPress

Create these as Pages (or Posts for research articles). Copy body text from the matching HTML files in this repo.

| WP slug | Source in this repo | Notes |
|---------|---------------------|-------|
| `about` | `about/index.html` | Company story, standards |
| `research` | `research/index.html` | Library landing |
| `faq` | `faq/index.html` | FAQ accordion → use headings + paragraphs or a FAQ block |
| `wholesale` | `wholesale/index.html` | Benefits + application CTA |
| `contact` | `contact/index.html` | Form (WPForms / Fluent / Contact Form 7) + `#pricing` anchor |
| `privacy-policy` | (new) | Required for checkout trust |
| `terms` | (new) | Terms of service |
| `refund-policy` | (new) | Refunds / returns |
| `research-use-policy` | (new) | Explicit research-use-only policy |

## Research articles → Posts or child pages

| Slug suggestion | Source |
|-----------------|--------|
| `what-are-peptides` | `research/what-are-peptides.html` |
| `peptide-storage` | `research/peptide-storage.html` |
| `peptide-reconstitution` | `research/peptide-reconstitution.html` |
| `hplc-purity` | `research/hplc-purity.html` |
| `evaluate-peptide-supplier` | `research/evaluate-peptide-supplier.html` |
| `bpc-157-research` | `research/bpc-157-research.html` |

Keep the research-use disclaimer on every article (theme `single.php` already appends one).

## WooCommerce system pages

Created by WooCommerce wizard — do not delete:

- Shop
- Cart
- Checkout
- My Account

## Homepage

Create page “Home”, assign under Settings → Reading as static front page. The theme `front-page.php` renders the branded hero regardless of page content.
