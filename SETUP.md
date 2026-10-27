# Staff digital business cards: setup guide

> **Status (Oct. 27, 2026):** the Supabase project `staff-cards` (Canada Central) is created, the database and photo storage are set up, the contact function is deployed, and `config.js` is filled in. Steps 1, 2, 3 and 5 are done, and brian.beehler@aiacanada.com is the first admin. GitHub Pages and DNS (step 6) are done. Still to do: email registration settings (step 4) and testing (step 7).

This guide sets up the AIA Canada and I-CAR Canada staff business card site at **card.aiacanada.com**. It takes about an hour. Step 6 (DNS) and the email sending setup in step 4 need IT.

## What’s in this folder

| File | What it does |
|---|---|
| `index.html` | The main page at card.aiacanada.com: search the team and open anyone’s card. A phone with a default card opens it automatically |
| `edit.html` | Where staff register or sign in with their work email and build their card |
| `404.html` | The public card page people see when they scan a QR code or tap an NFC tag (GitHub Pages uses it for every card address, such as `/brian-beehler`) |
| `admin.html` | The Marcom admin page: hide, remove or edit cards, write NFC tags, export links |
| `config.js` | The settings you fill in during step 3 |
| `shared.js`, `styles.css` | Shared code and brand styles |
| `assets/` | The official AIA Canada and I-CAR Canada logos |
| `supabase/schema.sql` | The database, security rules and photo storage |
| `supabase/functions/vcard/` | Optional: makes “Save contact” open directly on iPhones |
| `sw.js`, `manifest-*.webmanifest`, `assets/icon-*.png` | The “My card” phone app: full-screen QR from the home screen, works offline |
| `CNAME`, `.nojekyll` | GitHub Pages settings |

---

## Step 1. Create the Supabase project

1. Sign in at supabase.com and create a new project. Name it something like `staff-cards`.
2. For **Region**, choose **Canada (Central)** unless IT says otherwise.
3. Save the database password somewhere safe (it isn’t needed day to day).

## Step 2. Set up the database

1. Open `supabase/schema.sql` and make two edits:
   - **Staff email domains:** in section 1, confirm `aiacanada.com` and `i-car.ca` are the domains staff sign in with. Add or remove domains as needed.
   - **First admin:** in section 5, replace `[ADMIN EMAIL]@aiacanada.com` with the Marcom admin’s work email.
2. In Supabase, go to **SQL Editor**, paste the whole file and select **Run**.
3. To add more admins later, use **Manage admins** at the bottom of `/admin.html` (only admin managers see it). To make someone else an admin manager, run in SQL: `update public.admins set can_manage = true where email = 'name@aiacanada.com';`

## Step 3. Fill in config.js

1. In Supabase, go to **Project Settings > API**.
2. Copy the **Project URL** into `supabaseUrl` and the **anon public** key into `supabaseAnonKey`.
3. If you use a different web address than card.aiacanada.com, update `siteUrl` and the `CNAME` file.
4. Make sure `allowedDomains` matches the domains from step 2.

The anon key is designed to be public. The security rules in `schema.sql` decide who can read and change data.

## Step 4. Set up email registration

Staff register with their work email and a password. Only @aiacanada.com and @i-car.ca addresses can register (the database blocks everything else), and each person must confirm their email before signing in.

**In Supabase > Authentication > URL Configuration:**
1. Set **Site URL** to `https://card.aiacanada.com`
2. Under **Redirect URLs**, add `https://card.aiacanada.com/**` (confirmation and password-reset links go to `/edit.html`)
   Without this, confirmation and password-reset links point to the wrong address.

**In Supabase > Authentication > Sign In / Providers > Email:**
1. Make sure **Email** is on and **Confirm email** is on.
2. Set the minimum password length to 8.

**Email sending (needed before launch):** Supabase’s built-in email only sends to members of your Supabase team and only a few messages per hour, so it’s fine for testing but not for staff. Before rollout, set up custom SMTP under **Authentication > Emails > SMTP Settings**, using an AIA sending account or an email service (IT can advise). Then edit the **Confirm signup** and **Reset password** email templates so they come from AIA Canada, in English and French.

## Step 5 (optional, recommended). Reliable “Save contact” on iPhones

Without this step, the card page builds the contact file in the browser. That works on most phones, but some iPhones download it to Files instead of opening the contact screen. This small function fixes that.

1. Install the Supabase CLI (see supabase.com/docs/guides/cli), then run from this folder:
   ```
   supabase login
   supabase link --project-ref YOUR-PROJECT-REF
   supabase functions deploy vcard --no-verify-jwt
   ```
2. If your site address isn’t card.aiacanada.com, set it: `supabase secrets set CARD_SITE_URL=https://your-address`
3. In `config.js`, set `vcardFunctionUrl` to `https://YOUR-PROJECT-REF.supabase.co/functions/v1/vcard`

## Step 6. Publish on GitHub Pages (IT for the DNS record)

1. Create a GitHub repository, for example `staff-business-cards`, and upload everything in this folder (including `CNAME` and `.nojekyll`).
2. In the repository, go to **Settings > Pages**. Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Under **Custom domain**, enter `card.aiacanada.com`.
4. IT adds a DNS record: **CNAME** `card` → `YOUR-GITHUB-ORG.github.io`
5. Once GitHub shows the domain is verified, tick **Enforce HTTPS**.

The site must run on its own domain (not `github.io/repository-name`), because card addresses start at the root.

## Step 7. Test before launch

- [ ] Create an account at card.aiacanada.com/edit.html with a work email, confirm it from the email, sign in and save a test card.
- [ ] Try “Forgot your password?” and set a new password.
- [ ] Open the card link on an iPhone and an Android phone. Select **Save contact** on each.
- [ ] Scan the QR code with a phone camera.
- [ ] Try to register with a personal email (such as Gmail) and confirm it’s refused.
- [ ] Open `/admin.html` as an admin and as a regular staff member.
- [ ] On an Android phone in Chrome, write a blank NFC tag, then tap it with an iPhone.
- [ ] Switch the card and editor to French and review the wording.
- [ ] In the editor, select **Open my phone card** on an iPhone and an Android phone, add it to the home screen, then open it in airplane mode. The QR code should still show and the screen should stay on.
- [ ] Search the team on card.aiacanada.com, set a default card on a phone, reopen card.aiacanada.com and confirm it opens that card, then remove the default.
- [ ] Try to save a card with the address `my-card` and confirm it’s refused (it’s reserved for the phone app).

## Before rollout: approvals

- **Brand owner:** card design, logo use, colours, and the Arial fallback for Sofia Pro (see `styles.css`).
- **IT:** the email sending account (SMTP), the subdomain, Canadian data region.
- **Privacy:** card pages are public. Mobile numbers are hidden unless each person turns them on. Card pages ask search engines not to index them.
- **French copy:** check the French interface text against the Ongoing Terminology list.

## Team search and the default card

card.aiacanada.com opens a search of everyone with a public card, in English or French, filterable by AIA Canada or I-CAR Canada. On any card, **Make this the default card on this phone** saves that choice on the device. From then on, opening card.aiacanada.com on that phone goes straight to that card’s full-screen QR code, which suits staff phones and a shared booth tablet. **Search the team** on the QR screen still reaches the search, and **Remove default** on the card undoes it. Hidden cards never appear in the search.

## “My card” on staff phones

In the editor, **Open my phone card** opens the person’s card in phone mode (`/their-name?me=1`). Added to the home screen, the icon opens straight to a full-screen QR code at `/my-card`, keeps the screen awake while it’s showing, and works with no signal. The card details refresh whenever the phone is online. The QR code always points to the same card link, so it never needs updating.

## NFC tags for staff

Every tag stores only the person’s card link, so it never needs rewriting when their details change.
- **One at a time:** in `/admin.html`, open the page in Chrome on an Android phone and select **Write NFC** next to the person’s name.
- **In bulk:** select **Export links (CSV)** and send the file to your NFC card or sticker supplier, or use the NFC Tools app (Write > Add a record > URL).
- NTAG215 or NTAG216 tags work well. Stickers on the back of a phone case let staff tap their own phone to share.

## Updating the site

Every page loads `shared.js`, `config.js` and `styles.css` with a version tag (for example `/shared.js?v=20261027d`). After changing any of those three files, change the tag to a new value in `index.html`, `edit.html`, `admin.html`, `404.html` and `sw.js`. Otherwise phones and browsers can keep an old copy for a while and pages break until it expires.
