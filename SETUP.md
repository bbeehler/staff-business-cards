# Staff digital business cards: setup guide

> **Status (Oct. 27, 2026):** the Supabase project `staff-cards` (Canada Central) is created, the database and photo storage are set up, the contact function is deployed, and `config.js` is filled in. Steps 1, 2, 3 and 5 are done. Still to do: add the first admin (step 2, last item), Microsoft sign-in (step 4), GitHub Pages and DNS (step 6), and testing (step 7).

This guide sets up the AIA Canada and I-CAR Canada staff business card site at **card.aiacanada.com**. It takes about an hour. Steps 1, 4 and 6 need someone with IT admin access.

## What’s in this folder

| File | What it does |
|---|---|
| `index.html` | Where staff sign in with their Microsoft work account and build their card |
| `404.html` | The public card page people see when they scan a QR code or tap an NFC tag (GitHub Pages uses it for every card address, such as `/brian-beehler`) |
| `admin.html` | The Marcom admin page: hide, remove or edit cards, write NFC tags, export links |
| `config.js` | The settings you fill in during step 3 |
| `shared.js`, `styles.css` | Shared code and brand styles |
| `assets/` | The official AIA Canada and I-CAR Canada logos |
| `supabase/schema.sql` | The database, security rules and photo storage |
| `supabase/functions/vcard/` | Optional: makes “Save contact” open directly on iPhones |
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
3. To add more admins later, run: `insert into public.admins (email) values ('name@aiacanada.com');`

## Step 3. Fill in config.js

1. In Supabase, go to **Project Settings > API**.
2. Copy the **Project URL** into `supabaseUrl` and the **anon public** key into `supabaseAnonKey`.
3. If you use a different web address than card.aiacanada.com, update `siteUrl` and the `CNAME` file.
4. Make sure `allowedDomains` matches the domains from step 2.

The anon key is designed to be public. The security rules in `schema.sql` decide who can read and change data.

## Step 4. Turn on Microsoft sign-in (IT)

**In Microsoft Entra ID (Azure portal):**
1. Go to **App registrations > New registration**.
2. Name: `Staff business cards`. Supported account types: **Accounts in this organizational directory only** (single tenant). This keeps sign-in limited to AIA staff accounts.
3. Redirect URI (Web): `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
4. After it’s created, copy the **Application (client) ID** and **Directory (tenant) ID**.
5. Under **Certificates & secrets**, create a client secret and copy its **Value**.
6. Under **Token configuration**, add the optional claim `email` (ID token).

**In Supabase:**
1. Go to **Authentication > Sign In / Providers > Azure** and turn it on.
2. Paste the client ID and secret.
3. Azure Tenant URL: `https://login.microsoftonline.com/YOUR-TENANT-ID`
4. Go to **Authentication > URL Configuration**. Set **Site URL** to `https://card.aiacanada.com` and add `https://card.aiacanada.com/**` under **Redirect URLs**.

Note: the client secret expires. Set a calendar reminder to renew it before the expiry date IT chooses.

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

- [ ] Sign in at card.aiacanada.com with a work account and save a test card.
- [ ] Open the card link on an iPhone and an Android phone. Select **Save contact** on each.
- [ ] Scan the QR code with a phone camera.
- [ ] Sign in with a personal Microsoft account and confirm it’s refused.
- [ ] Open `/admin.html` as an admin and as a regular staff member.
- [ ] On an Android phone in Chrome, write a blank NFC tag, then tap it with an iPhone.
- [ ] Switch the card and editor to French and review the wording.

## Before rollout: approvals

- **Brand owner:** card design, logo use, colours, and the Arial fallback for Sofia Pro (see `styles.css`).
- **IT:** Microsoft sign-in, the subdomain, Canadian data region.
- **Privacy:** card pages are public. Mobile numbers are hidden unless each person turns them on. Card pages ask search engines not to index them.
- **French copy:** check the French interface text against the Ongoing Terminology list.

## NFC tags for staff

Every tag stores only the person’s card link, so it never needs rewriting when their details change.
- **One at a time:** in `/admin.html`, open the page in Chrome on an Android phone and select **Write NFC** next to the person’s name.
- **In bulk:** select **Export links (CSV)** and send the file to your NFC card or sticker supplier, or use the NFC Tools app (Write > Add a record > URL).
- NTAG215 or NTAG216 tags work well. Stickers on the back of a phone case let staff tap their own phone to share.
